// Animated WebP muxer.
//
// mediabunny does not offer a WebP output format, so we encode each frame as a
// still lossy WebP (canvas encoder, keeps alpha via ALPH+VP8 chunks) and mux the
// frames into a RIFF/ANMF animated WebP container ourselves.

export interface WebPFrame {
  webp: Uint8Array; // a complete still WebP file
  delayMs: number;
}

interface Chunk {
  fourcc: string;
  /** Raw bytes of the whole chunk: 8-byte header + payload + padding. */
  raw: Uint8Array;
}

function readU32(dv: DataView, off: number): number {
  return dv.getUint32(off, true);
}

function extractFrameChunks(webp: Uint8Array): Uint8Array {
  const dv = new DataView(webp.buffer, webp.byteOffset, webp.byteLength);
  const tag = String.fromCharCode(webp[0], webp[1], webp[2], webp[3]);
  const form = String.fromCharCode(webp[8], webp[9], webp[10], webp[11]);
  if (tag !== 'RIFF' || form !== 'WEBP') {
    throw new Error('canvas encoder did not produce a RIFF WebP');
  }

  const kept: Chunk[] = [];
  let off = 12;
  while (off + 8 <= webp.byteLength) {
    const fourcc = String.fromCharCode(webp[off], webp[off + 1], webp[off + 2], webp[off + 3]);
    const size = readU32(dv, off + 4);
    const padded = size + (size & 1);
    const end = Math.min(off + 8 + padded, webp.byteLength);
    if (fourcc === 'VP8 ' || fourcc === 'VP8L' || fourcc === 'ALPH') {
      kept.push({ fourcc, raw: webp.slice(off, end) });
    }
    off = end;
  }
  if (!kept.some((c) => c.fourcc === 'VP8 ' || c.fourcc === 'VP8L')) {
    throw new Error('still WebP has no VP8/VP8L bitstream chunk');
  }
  const total = kept.reduce((n, c) => n + c.raw.byteLength, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of kept) {
    out.set(c.raw, o);
    o += c.raw.byteLength;
  }
  return out;
}

function writeU24(v: DataView, off: number, n: number) {
  v.setUint8(off, n & 0xff);
  v.setUint8(off + 1, (n >> 8) & 0xff);
  v.setUint8(off + 2, (n >> 16) & 0xff);
}

/** Mux still WebP frames into an animated WebP (looping, alpha preserved). */
export function muxAnimatedWebP(frames: WebPFrame[], width: number, height: number): Uint8Array {
  const frameChunks = frames.map((f) => extractFrameChunks(f.webp));

  // ANMF payload = 16-byte frame header + sub-chunks. Chunk size field counts
  // payload only (padding byte excluded but present).
  const anmfSizes = frameChunks.map((c) => 16 + c.byteLength);
  const animSize = 6;
  const vp8xSize = 10;
  let riffPayload = 4; // 'WEBP'
  riffPayload += 8 + vp8xSize + (vp8xSize & 1);
  riffPayload += 8 + animSize + (animSize & 1);
  for (let i = 0; i < frameChunks.length; i++) {
    riffPayload += 8 + anmfSizes[i] + (anmfSizes[i] & 1);
  }

  const out = new Uint8Array(8 + riffPayload);
  const v = new DataView(out.buffer);
  let o = 0;
  const writeAscii = (s: string) => {
    for (let i = 0; i < s.length; i++) out[o++] = s.charCodeAt(i);
  };
  const writeChunk = (fourcc: string, size: number, writePayload: () => void) => {
    writeAscii(fourcc);
    v.setUint32(o, size, true);
    o += 4;
    writePayload();
    if (size & 1) out[o++] = 0;
  };

  writeAscii('RIFF');
  v.setUint32(o, riffPayload, true);
  o += 4;
  writeAscii('WEBP');

  // VP8X: flags = alpha(0x10) | animation(0x02); canvas size - 1 as u24.
  writeChunk('VP8X', vp8xSize, () => {
    out[o++] = 0x10 | 0x02;
    o += 3; // reserved
    writeU24(v, o, width - 1);
    o += 3;
    writeU24(v, o, height - 1);
    o += 3;
  });

  // ANIM: background color (BGRA) = 0 (transparent), loop count 0 = infinite.
  writeChunk('ANIM', animSize, () => {
    v.setUint32(o, 0, true);
    o += 4;
    v.setUint16(o, 0, true);
    o += 2;
  });

  for (let i = 0; i < frames.length; i++) {
    const chunks = frameChunks[i];
    writeChunk('ANMF', anmfSizes[i], () => {
      writeU24(v, o, 0); // frame X / 2
      o += 3;
      writeU24(v, o, 0); // frame Y / 2
      o += 3;
      writeU24(v, o, width - 1);
      o += 3;
      writeU24(v, o, height - 1);
      o += 3;
      writeU24(v, o, Math.min(0xffffff, Math.max(0, Math.round(frames[i].delayMs))));
      o += 3;
      out[o++] = 0; // flags: no blend, no dispose — frames are full-canvas
      out.set(chunks, o);
      o += chunks.byteLength;
    });
  }

  return out;
}
