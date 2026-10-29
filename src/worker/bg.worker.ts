// Background-removal worker: GIF decode -> BiRefNet-lite matting -> encode.
// Everything heavy runs here so the UI stays responsive.

import type { WorkerInMessage, WorkerOutMessage } from './protocol';
import { MAX_FILE_BYTES, MAX_FRAMES, MAX_SIDE, DEFAULT_BG } from './protocol';
import { ensureModel } from './model';
import { decodeGif } from './gif';
import { matteFrame } from './matte';
import { detectAlreadyTransparent, cleanupTransparent, flattenFrame } from './compose';
import { decodeImage, encodePng } from './image';
import { muxAnimatedWebP } from './webpAnim';
import { encodeTransparentGif } from './gifEncode';
import { encodeColorGif, hexToRgb } from './colorGifEncode';
import { encodeApng } from './apngEncode';

// TODO: server fallback — route oversized/unsupported inputs to a server-side
// matting endpoint once one exists (e.g. Replicate sprited/birefnet or Poof).

function post(msg: WorkerOutMessage, transfer?: Transferable[]) {
  (globalThis as unknown as {
    postMessage(m: WorkerOutMessage, t?: Transferable[]): void;
  }).postMessage(msg, transfer);
}

async function encodeWebPFrames(
  frames: ImageData[],
  delaysMs: number[],
): Promise<Uint8Array | null> {
  const canvas = new OffscreenCanvas(frames[0].width, frames[0].height);
  const ctx = canvas.getContext('2d')!;
  const stills: { webp: Uint8Array; delayMs: number }[] = [];
  for (let i = 0; i < frames.length; i++) {
    ctx.putImageData(frames[i], 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });
    if (blob.type !== 'image/webp') return null; // encoder unsupported here
    stills.push({
      webp: new Uint8Array(await blob.arrayBuffer()),
      delayMs: delaysMs[i],
    });
  }
  return muxAnimatedWebP(stills, frames[0].width, frames[0].height);
}

// Cutouts from the last run, kept so 'recolor' can re-encode the Color
// Background GIF without re-running the model.
let cutouts: ImageData[] | null = null;
let cutoutDelaysMs: number[] | null = null;
// Last single-image cutout, kept so 'recolor-image' can re-encode the
// color-background PNG without re-running the model.
let imageCutout: ImageData | null = null;

async function processImage(file: ArrayBuffer, mime: string) {
  if (file.byteLength > MAX_FILE_BYTES) {
    post({
      type: 'error',
      message: `File is ${(file.byteLength / 1024 / 1024).toFixed(1)} MB — max is 8 MB.`,
      retriable: false,
    });
    return;
  }

  post({ type: 'phase', phase: 'decoding' });
  const img = await decodeImage(file, mime);
  if (img.downscaled) {
    post({
      type: 'warn',
      text: `Image is ${img.sourceWidth}×${img.sourceHeight} — downscaled to ${img.width}×${img.height} (max side ${MAX_SIDE}px).`,
    });
  }

  let result: ImageData;
  let backend = 'n/a (already transparent)';
  if (detectAlreadyTransparent([img.frame])) {
    post({
      type: 'warn',
      text: 'This image already has transparency — skipping heavy matting, keeping the original alpha (light pass only).',
    });
    result = cleanupTransparent(img.frame);
  } else {
    const model = await ensureModel((loaded, total) => {
      post({ type: 'model-progress', loaded, total });
      post({ type: 'model-state', state: 'downloading' });
    });
    post({ type: 'model-state', state: 'ready', backend: model.backend });
    backend = model.backend;

    post({ type: 'frame-progress', current: 0, total: 1 });
    result = await matteFrame(model, img.frame);
    post({ type: 'frame-progress', current: 1, total: 1 });
  }

  imageCutout = result;

  post({ type: 'phase', phase: 'encoding' });
  const png = await encodePng(result);
  const colorPng = await encodePng(flattenFrame(result, hexToRgb(DEFAULT_BG)));

  post(
    {
      type: 'image-done',
      png,
      colorPng,
      width: img.width,
      height: img.height,
      backend,
      alreadyTransparent: backend.startsWith('n/a'),
    },
    [png, colorPng],
  );
}

async function processGif(file: ArrayBuffer) {
  if (file.byteLength > MAX_FILE_BYTES) {
    post({
      type: 'error',
      message: `File is ${(file.byteLength / 1024 / 1024).toFixed(1)} MB — max is 8 MB.`,
      retriable: false,
    });
    return;
  }

  post({ type: 'phase', phase: 'decoding' });
  const gif = await decodeGif(file);
  if (gif.truncated) {
    post({
      type: 'warn',
      text: `GIF has ${gif.sourceFrameCount} frames — truncated to the first ${MAX_FRAMES}.`,
    });
  }

  const alreadyTransparent = detectAlreadyTransparent(gif.frames);

  let results: ImageData[];
  let backend = 'n/a (already transparent)';
  if (alreadyTransparent) {
    // Already-transparent sprite: generic photo matting can only make clean
    // edges dirtier (dark outlines stick to wrong fills, mask resize softens
    // lines). We skip the model entirely and pass frames through, only
    // zeroing RGB under (near-)transparent pixels so encoders stay clean.
    // Alternative — run the model with final_a = model_a*orig_a — would help
    // "partially transparent with leftover bg" inputs but lets the model
    // erode the sprite; pass-through is never dirtier than the source.
    post({
      type: 'warn',
      text: 'This GIF already has transparency — skipping heavy matting, keeping the original alpha (light pass only).',
    });
    results = gif.frames.map((f) => cleanupTransparent(f));
  } else {
    const model = await ensureModel((loaded, total) => {
      post({ type: 'model-progress', loaded, total });
      post({ type: 'model-state', state: 'downloading' });
    });
    post({ type: 'model-state', state: 'ready', backend: model.backend });
    backend = model.backend;

    results = [];
    for (let i = 0; i < gif.frames.length; i++) {
      results.push(await matteFrame(model, gif.frames[i]));
      post({ type: 'frame-progress', current: i + 1, total: gif.frames.length });
    }
  }

  // Cache for 'recolor' re-encodes.
  cutouts = results;
  cutoutDelaysMs = gif.delaysMs;

  post({ type: 'phase', phase: 'encoding' });
  let webp: Uint8Array | null = null;
  try {
    webp = await encodeWebPFrames(results, gif.delaysMs);
  } catch (e) {
    console.warn('[encode] animated WebP failed', e);
  }
  if (!webp) {
    post({ type: 'warn', text: 'Animated WebP encoding not supported by this browser.' });
  }

  let gifOut: Uint8Array | null = null;
  try {
    gifOut = encodeTransparentGif(results, gif.delaysMs);
  } catch (e) {
    console.warn('[encode] transparent GIF failed', e);
  }

  let apng: ArrayBuffer | null = null;
  try {
    apng = encodeApng(results, gif.delaysMs);
  } catch (e) {
    console.warn('[encode] APNG failed', e);
  }
  if (!apng) {
    post({ type: 'warn', text: 'APNG encoding failed — soft-alpha preview falls back to WebP.' });
  }

  let colorGif: Uint8Array | null = null;
  try {
    colorGif = encodeColorGif(results, gif.delaysMs, hexToRgb(DEFAULT_BG));
  } catch (e) {
    console.warn('[encode] color-background GIF failed', e);
  }

  const transfer: Transferable[] = [];
  if (webp) transfer.push(webp.buffer as ArrayBuffer);
  if (gifOut) transfer.push(gifOut.buffer as ArrayBuffer);
  if (colorGif) transfer.push(colorGif.buffer as ArrayBuffer);
  if (apng) transfer.push(apng);
  post(
    {
      type: 'done',
      apng,
      gif: gifOut ? (gifOut.buffer as ArrayBuffer) : null,
      colorGif: colorGif ? (colorGif.buffer as ArrayBuffer) : null,
      webp: webp ? (webp.buffer as ArrayBuffer) : null,
      width: gif.width,
      height: gif.height,
      frameCount: gif.frames.length,
      backend,
      alreadyTransparent,
    },
    transfer,
  );
}

globalThis.onmessage = async (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;
  try {
    if (msg.type === 'warmup') {
      const model = await ensureModel((loaded, total) => {
        post({ type: 'model-progress', loaded, total });
        post({ type: 'model-state', state: 'downloading' });
      });
      post({ type: 'model-state', state: 'ready', backend: model.backend });
    } else if (msg.type === 'process') {
      await processGif(msg.file);
    } else if (msg.type === 'process-image') {
      await processImage(msg.file, msg.mime);
    } else if (msg.type === 'recolor-image') {
      if (!imageCutout) {
        post({ type: 'error', message: 'Nothing to recolor yet.', retriable: false });
        return;
      }
      const png = await encodePng(flattenFrame(imageCutout, hexToRgb(msg.color)));
      post({ type: 'image-recolor-done', png }, [png]);
    } else if (msg.type === 'recolor') {
      if (!cutouts || !cutoutDelaysMs) {
        post({ type: 'error', message: 'Nothing to recolor yet.', retriable: false });
        return;
      }
      const bytes = encodeColorGif(cutouts, cutoutDelaysMs, hexToRgb(msg.color));
      post(
        { type: 'recolor-done', gif: bytes.buffer as ArrayBuffer },
        [bytes.buffer as ArrayBuffer],
      );
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // Model download / init failures are retriable.
    const retriable = /download|fetch|network|session|provider|HTTP/i.test(message);
    post({ type: 'error', message, retriable });
  }
};
