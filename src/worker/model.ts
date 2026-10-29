// Model download (with progress + Cache API) and ORT session creation.
// Prefers the WebGPU execution provider, falls back to WASM.

import * as ort from 'onnxruntime-web/webgpu';
import { MODEL_BYTES, MODEL_SHA256, MODEL_URL } from './protocol';

// ORT's WASM/JSEP binaries are ~15-30 MB and would exceed the Cloudflare Pages
// 25 MB per-file limit, so they are served from the pinned package on jsDelivr.
const ORT_VERSION = '1.31.1';
ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
ort.env.wasm.numThreads = self.crossOriginIsolated
  ? Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 4) - 1))
  : 1;
ort.env.logLevel = 'warning';

type ProgressFn = (loaded: number, total: number) => void;

const CACHE_NAME = 'birefnet-model-v1';

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function downloadModelBytes(onProgress: ProgressFn): Promise<Uint8Array> {
  let cache: Cache | null = null;
  try {
    cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(MODEL_URL);
    if (hit) {
      onProgress(MODEL_BYTES, MODEL_BYTES);
      return new Uint8Array(await hit.arrayBuffer());
    }
  } catch {
    cache = null; // Cache API unavailable (e.g. private mode) — fetch anyway.
  }

  const resp = await fetch(MODEL_URL, { credentials: 'omit' });
  if (!resp.ok || !resp.body) {
    throw new Error(`Model download failed (HTTP ${resp.status})`);
  }
  const total = Number(resp.headers.get('content-length')) || MODEL_BYTES;
  const reader = resp.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress(loaded, total);
  }
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }

  if (cache) {
    try {
      await cache.put(MODEL_URL, new Response(bytes.slice().buffer));
    } catch {
      // Non-fatal: caching is best-effort.
    }
  }
  return bytes;
}

export interface LoadedModel {
  session: ort.InferenceSession;
  backend: string;
}

let sessionPromise: Promise<LoadedModel> | null = null;

/** Returns a ready inference session, downloading the model on first use. */
export function ensureModel(onProgress: ProgressFn): Promise<LoadedModel> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const bytes = await downloadModelBytes(onProgress);

      // Integrity check (HF x-linked-etag == SHA-256 of the LFS object).
      // Mismatch is a warning, not fatal — corrupt files will fail to load anyway.
      const hex = await sha256Hex(bytes.buffer as ArrayBuffer);
      if (hex !== MODEL_SHA256) {
        console.warn(`[model] sha256 mismatch: got ${hex}, expected ${MODEL_SHA256}`);
      }

      const options: ort.InferenceSession.SessionOptions = {
        graphOptimizationLevel: 'all',
      };

      const hasWebGPU =
        typeof (navigator as { gpu?: unknown }).gpu !== 'undefined';
      const providers: Array<{ name: string; options?: Record<string, unknown> }> = [];
      if (hasWebGPU) providers.push({ name: 'webgpu' });
      providers.push({ name: 'wasm' });

      let lastError: unknown = null;
      for (const p of providers) {
        try {
          const session = await ort.InferenceSession.create(bytes, {
            ...options,
            executionProviders: [{ name: p.name, ...(p.options ?? {}) }],
          });
          return { session, backend: p.name };
        } catch (e) {
          console.warn(`[model] ${p.name} EP failed, trying next`, e);
          lastError = e;
        }
      }
      throw lastError instanceof Error
        ? lastError
        : new Error('No usable ONNX execution provider on this device');
    })();
  }
  return sessionPromise.catch((e) => {
    sessionPromise = null; // allow retry after a failed load
    throw e;
  });
}
