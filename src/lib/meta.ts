import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from './analytics';

const SITE = 'ShotWorker';
const ORIGIN = 'https://shotworker.com';

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    if (selector.includes('property=')) {
      el.setAttribute('property', selector.match(/property="([^"]+)"/)![1]);
    } else if (selector.includes('name=')) {
      el.setAttribute('name', selector.match(/name="([^"]+)"/)![1]);
    } else if (selector.includes('rel=')) {
      el.setAttribute('rel', selector.match(/rel="([^"]+)"/)![1]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/** Per-page SEO meta: document title, description, canonical, OG basics. */
export function usePageMeta(title: string, description: string) {
  const { pathname } = useLocation();
  useEffect(() => {
    const url = `${ORIGIN}${pathname}`;
    document.title = pathname === '/' ? title : `${title} — ${SITE}`;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('link[rel="canonical"]', 'href', url);
    setMeta('meta[property="og:title"]', 'content', document.title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', url);
    track('page_view', { page_path: pathname, page_title: document.title });
  }, [title, description, pathname]);
}
