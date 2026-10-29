// Smoke test: APNG encode via the vendored UPNG build (no window / require).
// Run: node scripts/smoke-apng.mjs
import assert from 'node:assert/strict';
import UPNG from '../src/vendor/UPNG.js';

const w = 8;
const h = 8;
const mkFrame = (r, g, b, a) => {
  const d = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const q = i << 2;
    d[q] = r;
    d[q + 1] = g;
    d[q + 2] = b;
    d[q + 3] = a;
  }
  return d;
};

// Two frames with soft alpha (a=128) — exercises the 8-bit alpha path.
const frames = [mkFrame(255, 0, 0, 128), mkFrame(0, 0, 255, 200)];
const buf = UPNG.encode(
  frames.map((f) => f.buffer),
  w,
  h,
  0,
  [100, 100],
);
const u8 = new Uint8Array(buf);

assert.equal(u8[0], 0x89, 'missing PNG signature byte');
assert.equal(u8[1], 0x50, 'missing PNG signature byte'); // 'P'
assert.equal(u8[2], 0x4e, 'missing PNG signature byte'); // 'N'
assert.equal(u8[3], 0x47, 'missing PNG signature byte'); // 'G'

const has = (tag) => {
  for (let i = 0; i + 4 <= u8.length; i++) {
    if (
      u8[i] === tag.charCodeAt(0) &&
      u8[i + 1] === tag.charCodeAt(1) &&
      u8[i + 2] === tag.charCodeAt(2) &&
      u8[i + 3] === tag.charCodeAt(3)
    )
      return true;
  }
  return false;
};
assert.ok(has('acTL'), 'missing acTL chunk — output is not an APNG');
assert.ok(has('fcTL'), 'missing fcTL chunk — no animation frames');
assert.ok(has('IDAT'), 'missing IDAT chunk');

console.log(`smoke-apng OK: ${u8.byteLength}-byte APNG with acTL/fcTL/IDAT`);
