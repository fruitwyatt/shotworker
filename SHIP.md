# ShotWorker — Ship Notes

## URLs

- **Pages (production):** https://shotworker.pages.dev
- **Latest deployment:** https://390c569c.shotworker.pages.dev
- **Repo:** https://github.com/fruitwyatt/shotworker
- **Git SHA:** `b838d7254540625b7fdc103769447f78930fa729` (branch `main`)
- **Cloudflare Pages project:** `shotworker` (account `08c8b4657124c4adff729031926b450f`)

## What works (verified end-to-end in headless Chromium)

- **Home** (`/`) — hero, tool hub cards (2 live + 4 coming-soon), value props,
  how-it-works, FAQ, CTA band.
- **Image Background Remover** (`/tools/image-background-remover`) — e2e tested:
  PNG upload → BiRefNet-lite (WASM backend in headless; WebGPU preferred on
  real GPUs) → transparent PNG with real alpha (verified: corner a=0, subject
  a=255) + color-background PNG with live recolor.
- **GIF Background Remover** (`/tools/gif-background-remover`) — e2e tested:
  4-frame GIF → per-frame matting → APNG (transparent, verified), transparent
  GIF, animated WebP, color-background GIF with live recolor.
- Model download progress + frame progress + Cancel + Retry; ~94 MB model is
  cached via Cache API after first run.
- Drag-drop upload; free limits enforced in UI and worker (≤8 MB, ≤48 GIF
  frames w/ truncate+warn, longest side ≤512 px w/ auto-downscale).
- Privacy page (`/privacy`): files processed in-browser, never uploaded.
- SEO: per-route titles/descriptions/canonical/OG, `robots.txt` (Allow + sitemap),
  `sitemap.xml`, `og.png`, no `X-Robots-Tag` (indexing allowed).
- `_headers`: COOP same-origin / COEP credentialless / CORP cross-origin —
  verified live (required for ORT SharedArrayBuffer).
- `_redirects`: `https://www.shotworker.com/* → https://shotworker.com/:splat` 301.
- Worker smoke: `0` `window.pako` references in built bundles
  (`scripts/smoke-worker-bundle.mjs`); vendored UPNG APNG encode verified
  (`scripts/smoke-apng.mjs`).
- Analytics: `src/lib/analytics.ts` fires `page_view`, `upload`,
  `process_start`, `process_success`, `process_fail`, `download`,
  `limit_exceeded` — verified via console stub. Set `VITE_GA_ID=G-XXXXXXXXXX`
  at build time to enable GA4.

## Deferred / roadmap

- White Background Photos, AI Scene Generator, Ghost Mannequin, Batch Studio
  (cards on home are disabled "Soon" placeholders; architecture supports
  adding worker paths under `/tools/*`).
- Higher-resolution output (current cap 512 px longest side for free in-browser
  inference).
- Server-side matting fallback for oversized inputs.
- Real GA4 property (stub + env hook shipped).

## DNS ask (Cloudflare)

Bind `shotworker.com` (apex) **and** `www.shotworker.com` as custom domains on
the Pages project `shotworker`. The `www → apex` 301 is already handled by
`public/_redirects` once both hostnames are attached. Apex on Cloudflare uses
CNAME flattening — add a CNAME for `shotworker.com` → `shotworker.pages.dev`
in the zone, plus attach both hostnames in Pages → Custom domains.

## Deploy command

```bash
export CLOUDFLARE_ACCOUNT_ID=08c8b4657124c4adff729031926b450f
npx wrangler@4 pages deploy dist --project-name=shotworker --commit-dirty=true
```


## DNS status (updated by ship agent)

Already created on zone `shotworker.com` (id `515a7a2f658b95cf8ef46603b186d7d0`):

| Name | Type | Content | Proxied |
|------|------|---------|---------|
| `shotworker.com` | CNAME | `shotworker.pages.dev` | yes (CNAME flattening) |
| `www.shotworker.com` | CNAME | `shotworker.com` | yes |

Pages custom domains attached on project `shotworker`:
- `shotworker.com` — verification active; HTTPS **200** live
- `www.shotworker.com` — re-attached; SSL may still be initializing (intermittent 522 until cert active). `_redirects` has www→apex 301 once both hostnames are fully active.

**For cf teammate:** domain bind mostly done by ship agent. Please confirm both custom domains show **Active** in Pages → Custom domains, and www→apex 301 works. If www stuck pending, re-validate in dashboard.
