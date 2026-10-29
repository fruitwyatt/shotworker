// APNG (animated PNG) export via UPNG.js — lossless RGBA frames with true
// 8-bit soft alpha, unlike GIF's 1-bit transparency.

// `upng-js` is aliased to src/vendor/UPNG.js (patched to import pako via ESM;
// the published build crashes in module Workers via `window.pako`).
import UPNG from 'upng-js';

/** Encodes RGBA frames as an APNG; `delaysMs` is per-frame delay in ms. */
export function encodeApng(frames: ImageData[], delaysMs: number[]): ArrayBuffer {
  const w = frames[0].width;
  const h = frames[0].height;
  const bufs = frames.map((f) => f.data.buffer as ArrayBuffer);
  // cnum = 0 → truecolor (no palette quantization), keeps full alpha.
  return UPNG.encode(bufs, w, h, 0, delaysMs);
}
