# ShotWorker

AI Product Photography & Image Tools — https://shotworker.com

Free, in-browser AI tools for product photos. All processing runs on the user's
device (BiRefNet-lite via onnxruntime-web, WebGPU → WASM fallback) — files are
never uploaded for inference.

## Stack

- Vite + React 19 + TypeScript + React Router 7
- Static site, deploys to Cloudflare Pages
- Engine: BiRefNet-lite ONNX model (~94 MB, cached via Cache API), vendored
  UPNG.js for APNG, gifenc + gifuct-js for GIF, custom animated-WebP muxer

## Develop

```bash
npm install
npm run dev      # COOP/COEP headers are set in vite.config.ts
npm run build    # tsc --noEmit + vite build
npm run smoke    # APNG encode + worker-bundle window.pako checks
npm run preview  # serve dist/ locally
```

## Deploy

```bash
export CLOUDFLARE_ACCOUNT_ID=…
npx wrangler@4 pages deploy dist --project-name=shotworker --commit-dirty=true
```

`public/_headers` (cross-origin isolation, required for ORT SharedArrayBuffer),
`public/_redirects` (www → apex 301), `robots.txt` and `sitemap.xml` ship with
the build.

## Analytics

Set `VITE_GA_ID=G-XXXXXXXXXX` at build time to enable GA4 via gtag.js. Without
it, events are logged through a `console.debug` stub — no UX impact. Events:
`page_view`, `upload`, `process_start`, `process_success`, `process_fail`,
`download`, `limit_exceeded`. See `src/lib/analytics.ts`.

## Free-tier limits

- ≤ 8 MB per file
- GIF ≤ 48 frames (truncated with a warning)
- Longest side ≤ 512 px (auto-downscaled, never rejected)
