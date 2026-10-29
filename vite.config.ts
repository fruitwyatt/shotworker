import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cross-origin isolation headers (mirrors public/_headers for Cloudflare Pages).
// Needed so onnxruntime-web can use multi-threaded WASM / SharedArrayBuffer,
// and WebGPU in workers where available.
const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

export default defineConfig({
  plugins: [react()],
  // Use ORT's "extern wasm" build: it loads the .wasm binaries from
  // ort.env.wasm.wasmPaths (we point at pinned jsDelivr) instead of Vite
  // emitting ~30 MB wasm assets that would blow the Pages 25 MB/file limit.
  resolve: {
    conditions: ['onnxruntime-web-use-extern-wasm'],
    alias: {
      // upng-js's published build does `window.pako` / `require("pako")`
      // detection, which crashes in module Workers. Alias to a vendored
      // copy that imports pako as a normal ESM module.
      'upng-js': fileURLToPath(new URL('./src/vendor/UPNG.js', import.meta.url)),
    },
  },
  server: { headers: isolationHeaders },
  preview: { headers: isolationHeaders },
});
