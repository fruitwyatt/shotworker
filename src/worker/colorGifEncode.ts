// Color-background GIF export: composite matted RGBA frames onto a solid
// color, then encode as an opaque GIF (rgb565 quantization, no transparency).

import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return [255, 255, 255];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

export function encodeColorGif(
  frames: ImageData[],
  delaysMs: number[],
  bg: [number, number, number],
): Uint8Array {
  const gif = GIFEncoder();
  const w = frames[0].width;
  const h = frames[0].height;

  frames.forEach((frame, i) => {
    // out = src * a + bg * (1-a), fully opaque.
    const src = frame.data;
    const rgba = new Uint8ClampedArray(src.length);
    for (let p = 0; p < src.length; p += 4) {
      const a = src[p + 3] / 255;
      rgba[p] = Math.round(src[p] * a + bg[0] * (1 - a));
      rgba[p + 1] = Math.round(src[p + 1] * a + bg[1] * (1 - a));
      rgba[p + 2] = Math.round(src[p + 2] * a + bg[2] * (1 - a));
      rgba[p + 3] = 255;
    }

    const palette = quantize(rgba, 256, { format: 'rgb565' });
    const index = applyPalette(rgba, palette, 'rgb565');

    gif.writeFrame(index, w, h, {
      palette,
      delay: delaysMs[i],
      repeat: 0, // loop forever (only affects first frame)
    });
  });

  gif.finish();
  return gif.bytes();
}
