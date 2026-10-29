// Optional transparent-GIF export via gifenc.
// GIF only supports 1-bit alpha — soft mattes are thresholded at 50%.

import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export function encodeTransparentGif(
  frames: ImageData[],
  delaysMs: number[],
): Uint8Array {
  const gif = GIFEncoder();
  const w = frames[0].width;
  const h = frames[0].height;

  frames.forEach((frame, i) => {
    // Snap alpha to 0/255 and zero RGB of transparent pixels so they all
    // collapse into a single transparent palette entry.
    const rgba = new Uint8ClampedArray(frame.data);
    let hasTransparent = false;
    for (let p = 0; p < rgba.length; p += 4) {
      if (rgba[p + 3] < 128) {
        rgba[p] = 0;
        rgba[p + 1] = 0;
        rgba[p + 2] = 0;
        rgba[p + 3] = 0;
        hasTransparent = true;
      } else {
        rgba[p + 3] = 255;
      }
    }

    const palette = quantize(rgba, 256, { format: 'rgba4444', oneBitAlpha: true });
    let transparentIndex = -1;
    for (let c = 0; c < palette.length; c++) {
      if (palette[c][3] === 0) {
        transparentIndex = c;
        break;
      }
    }
    const index = applyPalette(rgba, palette, 'rgba4444');

    gif.writeFrame(index, w, h, {
      palette,
      delay: delaysMs[i],
      transparent: hasTransparent && transparentIndex >= 0,
      transparentIndex: Math.max(0, transparentIndex),
      dispose: 2, // restore to background so transparent pixels don't ghost
      repeat: 0, // loop forever (only affects first frame)
    });
  });

  gif.finish();
  return gif.bytes();
}
