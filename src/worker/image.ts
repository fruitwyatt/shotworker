// Single-image decoding via createImageBitmap (PNG/JPEG/WebP/AVIF — whatever
// the browser supports), plus proportional downscale to the max-side cap.

import { MAX_SIDE } from './protocol';

export interface DecodedImage {
  frame: ImageData;
  width: number;
  height: number;
  /** True when the source was larger than MAX_SIDE and got downscaled. */
  downscaled: boolean;
  sourceWidth: number;
  sourceHeight: number;
}

export async function decodeImage(buf: ArrayBuffer, mime: string): Promise<DecodedImage> {
  const bmp = await createImageBitmap(new Blob([buf], { type: mime }));
  const srcW = bmp.width;
  const srcH = bmp.height;

  const scale = Math.min(1, MAX_SIDE / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close();

  return {
    frame: ctx.getImageData(0, 0, width, height),
    width,
    height,
    downscaled: scale < 1,
    sourceWidth: srcW,
    sourceHeight: srcH,
  };
}

/** Encodes an RGBA frame as a PNG via the canvas encoder (keeps 8-bit alpha). */
export async function encodePng(frame: ImageData): Promise<ArrayBuffer> {
  const canvas = new OffscreenCanvas(frame.width, frame.height);
  canvas.getContext('2d')!.putImageData(frame, 0, 0);
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return blob.arrayBuffer();
}
