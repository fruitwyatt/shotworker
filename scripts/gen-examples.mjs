// Generates the small illustrative before/after samples shown on the landing
// pages (public/examples/*). Pure Node: draws simple antialiased product shapes,
// encodes the "before" GIF with gifenc and the transparent "after" files with
// the vendored UPNG. Run: npm run gen:examples
import { mkdirSync, writeFileSync } from 'node:fs';
import gifenc from 'gifenc';
import UPNG from '../src/vendor/UPNG.js';

const { GIFEncoder, quantize, applyPalette } = gifenc;

const S = 240;
const SS = 3; // supersampling per axis
const out = new URL('../public/examples/', import.meta.url);
mkdirSync(out, { recursive: true });

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function inRoundRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/** Render a scene: `subject(x,y)` → [r,g,b] | null, `shadow(x,y)` → 0..1, `bg(x,y)` → [r,g,b]. */
function render(subject, shadow, bg) {
  const before = new Uint8Array(S * S * 4);
  const after = new Uint8Array(S * S * 4);
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      let cov = 0;
      const col = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = subject(px + (sx + 0.5) / SS, py + (sy + 0.5) / SS);
          if (c) {
            cov++;
            col[0] += c[0];
            col[1] += c[1];
            col[2] += c[2];
          }
        }
      }
      const a = cov / (SS * SS);
      const subj = cov ? col.map((v) => v / cov) : [0, 0, 0];
      const sh = shadow(px + 0.5, py + 0.5) * (1 - a);
      const b = mix(bg(px, py), [0, 0, 0], sh);
      const comp = mix(b, subj, a);
      const i = (py * S + px) * 4;
      before.set([...comp.map(Math.round), 255], i);
      // transparent output: subject over a soft shadow on nothing
      const outA = a + sh * (1 - a);
      const outC = outA > 0 ? subj.map((v) => (v * a) / outA) : [0, 0, 0];
      after.set([...outC.map(Math.round), Math.round(outA * 255)], i);
    }
  }
  return { before, after };
}

// ---------- animated GIF sample: bouncing bottle with a spinning label ----------
const FRAMES = 12;
const DELAY = 80;
const stripeBg = (x, y) => {
  const band = Math.floor((x + y) / 18) % 2;
  const dot = ((x % 30) - 15) ** 2 + ((y % 30) - 15) ** 2 < 10;
  return dot ? [255, 255, 255] : band ? [247, 178, 103] : [242, 112, 89];
};

const gif = GIFEncoder();
const apngFrames = [];
for (let f = 0; f < FRAMES; f++) {
  const t = f / FRAMES;
  const dy = -22 * Math.abs(Math.sin(Math.PI * t));
  const spin = t * 64;
  const subject = (x, y) => {
    const yy = y - dy;
    if (inRoundRect(x, yy, 103, 48, 137, 68, 5)) return [34, 37, 66];
    if (inRoundRect(x, yy, 108, 66, 132, 94, 3)) return [70, 200, 190];
    if (inRoundRect(x, yy, 86, 88, 154, 204, 16)) {
      const shade = 0.75 + 0.35 * Math.sin(((x - 86) / 68) * Math.PI);
      if (yy > 126 && yy < 166) {
        const stripe = Math.floor((x + spin + (yy - 126) * 0.6) / 16) % 2 === 0;
        const base = stripe ? [88, 86, 240] : [250, 250, 255];
        return base.map((v) => Math.min(255, v * shade));
      }
      return [15, 181, 168].map((v) => Math.min(255, v * shade));
    }
    return null;
  };
  const rx = 42 + dy * 0.5;
  const shadow = (x, y) => {
    const d = ((x - 120) / rx) ** 2 + ((y - 214) / 7) ** 2;
    return d < 1 ? 0.35 * (1 - d) * (1 + dy / 60) : 0;
  };
  const { before, after } = render(subject, shadow, stripeBg);
  const palette = quantize(before, 256);
  gif.writeFrame(applyPalette(before, palette), S, S, { palette, delay: DELAY });
  apngFrames.push(after.buffer);
}
gif.finish();
writeFileSync(new URL('gif-before.gif', out), gif.bytes());
writeFileSync(
  new URL('gif-after.png', out),
  Buffer.from(UPNG.encode(apngFrames, S, S, 256, Array(FRAMES).fill(DELAY))),
);

// ---------- still photo sample: mug on a cluttered tablecloth ----------
const clothBg = (x, y) => {
  const check = (Math.floor(x / 20) + Math.floor(y / 20)) % 2;
  const blob = ((x - 40) ** 2 + (y - 50) ** 2 < 500) || ((x - 205) ** 2 + (y - 190) ** 2 < 700);
  if (blob) return [120, 160, 90];
  return check ? [214, 72, 72] : [240, 226, 205];
};
const mug = (x, y) => {
  const inHandle =
    ((x - 160) ** 2 + (y - 128) ** 2 <= 30 ** 2) && ((x - 160) ** 2 + (y - 128) ** 2 >= 18 ** 2) && x > 150;
  if (inRoundRect(x, y, 66, 72, 162, 190, 14) || inHandle) {
    const shade = 0.8 + 0.3 * Math.sin(((x - 66) / 96) * Math.PI);
    if (inHandle && x > 162) return [52, 56, 98];
    if (y > 112 && y < 140 && x < 162) return [255, 196, 64].map((v) => Math.min(255, v * shade));
    return [64, 70, 130].map((v) => Math.min(255, v * shade));
  }
  return null;
};
const mugShadow = (x, y) => {
  const d = ((x - 114) / 60) ** 2 + ((y - 196) / 8) ** 2;
  return d < 1 ? 0.4 * (1 - d) : 0;
};
const photo = render(mug, mugShadow, clothBg);
writeFileSync(new URL('photo-before.png', out), Buffer.from(UPNG.encode([photo.before.buffer], S, S, 0)));
writeFileSync(new URL('photo-after.png', out), Buffer.from(UPNG.encode([photo.after.buffer], S, S, 0)));

console.log('examples written to public/examples/');
