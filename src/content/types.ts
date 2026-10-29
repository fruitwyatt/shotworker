// Shared page-content types. The same objects drive the React pages, the
// JSON-LD schema and the build-time prerender, so visible copy and structured
// data can never drift apart.

export const ORIGIN = 'https://shotworker.com';
export const SITE = 'ShotWorker';

export interface FaqItem {
  q: string;
  a: string;
}

export interface Crumb {
  name: string;
  path: string;
}

export interface Step {
  name: string;
  text: string;
}

export interface Example {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  caption: string;
}

export type Section =
  | { kind: 'text'; id: string; h2: string; paragraphs: string[]; bullets?: string[] }
  | { kind: 'steps'; id: string; h2: string; intro: string; steps: Step[] }
  | { kind: 'examples'; id: string; h2: string; intro: string; examples: Example[] }
  | {
      kind: 'related';
      id: string;
      h2: string;
      paragraphs: string[];
      link: { to: string; label: string };
    };

export interface PageContent {
  path: string;
  /** Full document <title>. */
  title: string;
  description: string;
  h1: string;
  sub: string;
  limits: string;
  /** Visible breadcrumbs + BreadcrumbList schema. Empty = none (homepage). */
  breadcrumbs: Crumb[];
  app: { name: string; description: string; features: string[] };
  sections: Section[];
  faqTitle: string;
  faq: FaqItem[];
}
