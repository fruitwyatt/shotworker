// Build-time prerender: renders each public route with react-dom/server
// (via the SSR bundle in dist-ssr/) into dist/**.html so crawlers get the
// full H1, landing copy, FAQ and JSON-LD without running JS. The client
// bundle then hydrates the same markup (src/main.tsx → hydrateRoot).
// Run after `vite build` + `vite build --ssr src/entry-server.tsx --outDir dist-ssr`.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ORIGIN = 'https://shotworker.com';
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const ssrDir = fileURLToPath(new URL('../dist-ssr/', import.meta.url));

const { render, pages } = await import(pathToFileURL(`${ssrDir}entry-server.js`).href);
const template = readFileSync(`${dist}index.html`, 'utf8');
assert.ok(template.includes('<div id="root"></div>'), 'template #root placeholder not found');

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function setTag(html, re, replacement, label) {
  assert.ok(re.test(html), `template is missing ${label}`);
  return html.replace(re, replacement);
}

for (const p of pages) {
  const body = render(p.url);
  let html = template;
  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`, '<title>');
  html = setTag(html, /<meta\s+name="description"[^>]*>/s, `<meta name="description" content="${esc(p.description)}" />`, 'description');
  html = setTag(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(p.title)}" />`, 'og:title');
  html = setTag(html, /<meta\s+property="og:description"[^>]*>/s, `<meta property="og:description" content="${esc(p.description)}" />`, 'og:description');
  if (p.canonical) {
    const url = `${ORIGIN}${p.canonical}`;
    html = setTag(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`, 'canonical');
    html = setTag(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`, 'og:url');
  } else {
    html = html.replace(/\s*<link rel="canonical"[^>]*>/, '').replace(/\s*<meta property="og:url"[^>]*>/, '');
  }
  if (p.noindex) html = html.replace('</title>', '</title>\n    <meta name="robots" content="noindex" />');
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  assert.ok(/<h1[\s>]/.test(html), `${p.url}: no <h1> in prerendered HTML`);
  writeFileSync(`${dist}${p.file}`, html);
  console.log(`prerendered ${p.url} → dist/${p.file} (${(html.length / 1024).toFixed(1)} KB)`);
}

rmSync(ssrDir, { recursive: true, force: true });
