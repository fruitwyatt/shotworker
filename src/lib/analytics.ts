// Pluggable client analytics.
//
// If VITE_GA_ID is set at build time, gtag.js is loaded lazily on the first
// tracked event and every event is forwarded via gtag('event', ...).
// Without a GA ID, events go to console.debug so wiring later is a one-line
// env change — and analytics never blocks the UX either way.

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = (import.meta.env.VITE_GA_ID as string | undefined)?.trim() || undefined;
let gaRequested = false;

function ensureGa() {
  if (!GA_ID || gaRequested || typeof document === 'undefined') return;
  gaRequested = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  // SPA: disable the automatic page_view — we emit our own on route change.
  window.gtag('config', GA_ID, { send_page_view: false });
}

/** Fire an analytics event. Never throws, never blocks. */
export function track(name: string, props: AnalyticsProps = {}): void {
  try {
    ensureGa();
    if (GA_ID && window.gtag) {
      window.gtag('event', name, props);
    } else {
      console.debug('[analytics]', name, props);
    }
  } catch {
    // Analytics must never break the app.
  }
}
