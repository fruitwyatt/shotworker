// GIF decoding via gifuct-js with correct frame disposal compositing,
// plus proportional downscale to the max-side cap.

import { parseGIF, decompressFrames } from 'gifuct-js';
import { MAX_FRAMES, MAX_SIDE } from './protocol';

export interface DecodedGif {
  frames: ImageData[]; // fully-composited RGBA frames, all the same size
  delaysMs: number[];
  width: number;
  height: number;
  truncated: boolean;
  sourceFrameCount: number;
}

export async function decodeGif(buf: ArrayBuffer): Promise<DecodedGif> {
  const parsed = parseGIF(buf);
  const rawFrames = decompressFrames(parsed, true);
  if (rawFrames.length === 0) throw new Error('GIF contains no frames');

  const srcW = parsed.lsd.width;
  const srcH = parsed.lsd.height;
  const truncated = rawFrames.length > MAX_FRAMES;
  const frames = truncated ? rawFrames.slice(0, MAX_FRAMES) : rawFrames;

  // Compose patches onto a full canvas honoring disposal methods:
  //   0/1 = leave, 2 = restore to background, 3 = restore to previous.
  const canvas = new OffscreenCanvas(srcW, srcH);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.clearRect(0, 0, srcW, srcH);

  let prevDisposal = 0;
  let prevRect = { left: 0, top: 0, width: 0, height: 0 };
  let saved: ImageData | null = null;

  const out: ImageData[] = [];
  const delays: number[] = [];

  for (const f of frames) {
    if (prevDisposal === 2) {
      ctx.clearRect(prevRect.left, prevRect.top, prevRect.width, prevRect.height);
    } else if (prevDisposal === 3 && saved) {
      ctx.putImageData(saved, 0, 0);
    }
    if (f.disposalType === 3) {
      saved = ctx.getImageData(0, 0, srcW, srcH);
    }

    const patch = new ImageData(
      f.patch as Uint8ClampedArray<ArrayBuffer>,
      f.dims.width,
      f.dims.height,
    );
    // drawImage (not putImageData) so semi/fully-transparent patch pixels
    // composite source-over instead of overwriting the canvas.
    const bmp = await createImageBitmap(patch);
    ctx.drawImage(bmp, f.dims.left, f.dims.top);
    bmp.close();

    out.push(ctx.getImageData(0, 0, srcW, srcH));
    delays.push(Math.max(20, f.delay || 100));

    prevDisposal = f.disposalType;
    prevRect = f.dims;
  }

  // Downscale so the longest side is <= MAX_SIDE.
  const scale = Math.min(1, MAX_SIDE / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));

  let finalFrames = out;
  if (scale < 1) {
    const dst = new OffscreenCanvas(width, height);
    const dctx = dst.getContext('2d', { willReadFrequently: true })!;
    finalFrames = out.map((img) => {
      dctx.clearRect(0, 0, width, height);
      const src = new OffscreenCanvas(img.width, img.height);
      src.getContext('2d')!.putImageData(img, 0, 0);
      dctx.drawImage(src, 0, 0, width, height);
      return dctx.getImageData(0, 0, width, height);
    });
  }

  return {
    frames: finalFrames,
    delaysMs: delays,
    width,
    height,
    truncated,
    sourceFrameCount: rawFrames.length,
  };
}
