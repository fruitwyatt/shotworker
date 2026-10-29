// Generates public/og.png (1200x630 Open Graph image) with a tiny 5x7 bitmap
// font rendered into an RGBA buffer, encoded via the vendored UPNG + pako.
// Run: node scripts/gen-og.mjs
import { writeFileSync } from 'node:fs';
import UPNG from '../src/vendor/UPNG.js';

const W = 1200;
const H = 630;
const buf = new Uint8Array(W * H * 4);

const INK = [16, 18, 35];
const INK2 = [30, 33, 62];
const WHITE = [255, 255, 255];
const ACCENT = [122, 118, 250];
const TEAL = [15, 181, 168];

// vertical + diagonal blend ink -> ink2
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const t = Math.min(1, (x / W) * 0.55 + (y / H) * 0.45);
    const i = (y * W + x) * 4;
    buf[i] = Math.round(INK[0] + (INK2[0] - INK[0]) * t);
    buf[i + 1] = Math.round(INK[1] + (INK2[1] - INK[1]) * t);
    buf[i + 2] = Math.round(INK[2] + (INK2[2] - INK[2]) * t);
    buf[i + 3] = 255;
  }
}

function px(x, y, c, a = 255) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
  buf[i + 3] = a;
}

function rect(x, y, w, h, c, a = 255) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(xx, yy, c, a);
}

function circle(cx, cy, r, c) {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) px(cx + x, cy + y, c);
}

function ring(cx, cy, r, thick, c) {
  const r2 = r * r;
  const ri = (r - thick) * (r - thick);
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (d <= r2 && d >= ri) px(cx + x, cy + y, c);
    }
}

const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '01010', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00110', '00110'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

function text(str, x, y, scale, c, spacing = 1) {
  let cx = x;
  for (const ch of str.toUpperCase()) {
    const g = FONT[ch];
    if (g) {
      for (let r = 0; r < 7; r++)
        for (let col = 0; col < 5; col++)
          if (g[r][col] === '1') rect(cx + col * scale, y + r * scale, scale, scale, c);
    }
    cx += (5 + spacing) * scale;
  }
  return cx;
}

// checkerboard strip along the bottom (transparency motif)
const sq = 30;
for (let y = H - 60, row = 0; y < H; y += sq, row++) {
  for (let x = 0, col = 0; x < W; x += sq, col++) {
    if ((row + col) % 2 === 0) rect(x, y, sq, Math.min(sq, H - y), [42, 46, 80]);
  }
}

// aperture-mark logo (ring + core + notch) top-left text block
ring(150, 150, 62, 16, ACCENT);
circle(150, 150, 22, WHITE);
rect(186, 96, 34, 20, TEAL);

text('SHOTWORKER', 250, 122, 12, WHITE);
text('AI PRODUCT PHOTOGRAPHY', 250, 230, 6, TEAL, 1);
text('& IMAGE TOOLS', 250, 285, 6, ACCENT, 1);

rect(150, 380, 300, 6, ACCENT);
text('REMOVE BACKGROUNDS FREE', 150, 425, 6, WHITE, 1);
text('IN YOUR BROWSER - NO UPLOADS', 150, 490, 6, [190, 194, 220], 1);

const png = UPNG.encode([buf.buffer], W, H, 0);
writeFileSync(new URL('../public/og.png', import.meta.url), Buffer.from(png));
console.log('wrote public/og.png', png.byteLength, 'bytes');
