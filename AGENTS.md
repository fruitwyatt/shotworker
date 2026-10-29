# ShotWorker — agent notes

Product standard: `/workspace/docs/premium-tool-page-standard.md` (one keyword cluster = one URL; tool + landing + result on the same page; 1 H1, ~8–9 H2, FAQ ≥ 6, schema from the same data as visible copy; no competitor names).

## Commands
- `npm run build` — tsc + client build + SSR build + `scripts/prerender.mjs` (writes prerendered HTML into `dist/`).
- `npm run smoke` — APNG encode + worker bundle has no `window.pako` (run after build).
- `npm run gen:examples` — regenerate `public/examples/*` before/after samples.
- Local CF Pages emulation (routing, `_redirects`, `_headers`): `npx wrangler@4 pages dev dist --port 8788 --compatibility-date=2026-05-01`.
- Deploy: `CLOUDFLARE_ACCOUNT_ID=08c8b4657124c4adff729031926b450f npx wrangler@4 pages deploy dist --project-name=shotworker --commit-dirty=true`.

## Gates before deploy
- `rg -i 'matting|94 ?MB|cached by (your )?browser|BiRefNet' src/pages src/components src/content index.html public dist -g '!*.map' -g '!dist/assets/bg.worker*'` → no hits. No model/runtime jargon in any user-visible copy.
- `dist/index.html` must contain the H1 "GIF Background Remover" and FAQ text without JS.

## Conventions
- Page copy/FAQ/meta live in `src/content/` — edit there, not in page components.
- Routes are shared by client and prerender in `src/routes.tsx`; new prerendered pages also go in `pages` in `src/entry-server.tsx` (use `name.html`, not `name/index.html`, to avoid CF trailing-slash redirects) and `public/sitemap.xml`.
- Do not touch COOP/COEP in `public/_headers` or the vendored UPNG alias.
