// Pure pixel helpers for the matte pipeline.
// No canvas/ORT dependencies so these can be unit-tested in plain Node.

// Alpha below this is treated as fully transparent and its RGB is zeroed —
// keeps stray dark colors from dirtying soft edges in WebP/APNG/GIF encoders.
export const ALPHA_EPS = 4;

/**
 * Composite a possibly-transparent frame onto an opaque background color.
 * out_rgb = src_rgb * a + bg * (1-a), out_a = 255.
 * Used for model input ONLY — the original frame is kept for alpha compose.
 */
export function flattenFrame(
  frame: ImageData,
  bg: [number, number, number] = [255, 255, 255],
): ImageData {
  const out = new ImageData(frame.width, frame.height);
  const s = frame.data;
  const d = out.data;
  for (let i = 0; i < s.length; i += 4) {
    const a = s[i + 3] / 255;
    d[i] = Math.round(s[i] * a + bg[0] * (1 - a));
    d[i + 1] = Math.round(s[i + 1] * a + bg[1] * (1 - a));
    d[i + 2] = Math.round(s[i + 2] * a + bg[2] * (1 - a));
    d[i + 3] = 255;
  }
  return out;
}

/**
 * Write the model matte into the frame's alpha channel, constrained by the
 * original alpha: final_a = round(model_a/255 * orig_a). The model can never
 * invent opaque pixels where the source was already transparent. Source RGB
 * is kept verbatim (never the flattened RGB). Pixels below `eps` are left
 * fully zeroed (r=g=b=a=0).
 */
export function applyMatte(
  frame: ImageData,
  modelAlpha: ImageData,
  eps: number = ALPHA_EPS,
): ImageData {
  const out = new ImageData(frame.width, frame.height);
  const s = frame.data;
  const m = modelAlpha.data;
  const d = out.data;
  for (let i = 0; i < s.length; i += 4) {
    const a = Math.round((m[i] / 255) * s[i + 3]); // model_a(0..1) × orig_a(0..255)
    if (a < eps) continue;
    d[i] = s[i];
    d[i + 1] = s[i + 1];
    d[i + 2] = s[i + 2];
    d[i + 3] = a;
  }
  return out;
}

/**
 * Pass-through cleanup for already-transparent sprites: copies the frame,
 * zeroing RGB of fully/nearly transparent pixels so encoders and palettes
 * don't pick up stray colors. Original alpha is preserved exactly.
 */
export function cleanupTransparent(frame: ImageData, eps: number = ALPHA_EPS): ImageData {
  const out = new ImageData(frame.width, frame.height);
  const s = frame.data;
  const d = out.data;
  for (let i = 0; i < s.length; i += 4) {
    if (s[i + 3] < eps) continue;
    d[i] = s[i];
    d[i + 1] = s[i + 1];
    d[i + 2] = s[i + 2];
    d[i + 3] = s[i + 3];
  }
  return out;
}

/** Fraction of pixels with alpha < 8 across up to `maxSamples` sampled frames. */
export function transparentFraction(frames: ImageData[], maxSamples = 5): number {
  if (frames.length === 0) return 0;
  const step = Math.max(1, Math.floor(frames.length / Math.min(maxSamples, frames.length)));
  let transparent = 0;
  let total = 0;
  for (let f = 0; f < frames.length; f += step) {
    const d = frames[f].data;
    for (let i = 3; i < d.length; i += 4) {
      total++;
      if (d[i] < 8) transparent++;
    }
  }
  return total ? transparent / total : 0;
}

/** True when the input is mostly an already-transparent sprite (>15% transparent px). */
export function detectAlreadyTransparent(frames: ImageData[], threshold = 0.15): boolean {
  return transparentFraction(frames) > threshold;
}
