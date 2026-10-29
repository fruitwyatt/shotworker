// Build-time prerender entry (vite build --ssr). Consumed by scripts/prerender.mjs.
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { gifPage } from './content/gifPage';
import { imagePage } from './content/imagePage';
import { privacyMeta, notFoundMeta } from './content/meta';

export interface PrerenderPage {
  url: string;
  /** Output path relative to dist/. */
  file: string;
  title: string;
  description: string;
  /** null = no canonical (e.g. 404). */
  canonical: string | null;
  noindex?: boolean;
}

export const pages: PrerenderPage[] = [
  { url: '/', file: 'index.html', title: gifPage.title, description: gifPage.description, canonical: '/' },
  // Cloudflare Pages serves `background-remover.html` at the extension-less
  // `/background-remover` (a `background-remover/index.html` would force a
  // trailing-slash redirect away from the canonical URL).
  {
    url: '/background-remover',
    file: 'background-remover.html',
    title: imagePage.title,
    description: imagePage.description,
    canonical: '/background-remover',
  },
  { url: '/privacy', file: 'privacy.html', ...privacyMeta, canonical: '/privacy' },
  { url: '/404', file: '404.html', ...notFoundMeta, canonical: null, noindex: true },
];

export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </StrictMode>,
  );
}
