// Smoke test: the built worker bundle must not reference `window.pako`
// (module Workers have no `window` — the vendored UPNG imports pako via ESM).
// Run after `npm run build`: node scripts/smoke-worker-bundle.mjs
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const assetsDir = new URL('../dist/assets', import.meta.url).pathname;
assert.ok(existsSync(assetsDir), 'dist/assets missing — run `npm run build` first');

const jsFiles = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
assert.ok(jsFiles.length > 0, 'no JS bundles found in dist/assets');

let hits = 0;
for (const f of jsFiles) {
  const src = readFileSync(join(assetsDir, f), 'utf8');
  const n = src.split('window.pako').length - 1;
  if (n > 0) {
    hits += n;
    console.error(`FAIL: ${f} contains ${n} reference(s) to window.pako`);
  }
}
assert.equal(hits, 0, 'window.pako found in worker bundle — UPNG alias not applied');
console.log(`smoke-worker-bundle OK: 0 window.pako references across ${jsFiles.length} bundles`);
