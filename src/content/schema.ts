import { ORIGIN, SITE, type PageContent } from './types';

const abs = (path: string) => `${ORIGIN}${path}`;

/** JSON-LD graph built from the same content object that renders the page. */
export function buildSchema(page: PageContent): object {
  const url = abs(page.path);
  const graph: object[] = [
    {
      '@type': 'WebApplication',
      '@id': `${url}#app`,
      name: page.app.name,
      url,
      description: page.app.description,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any (modern web browser)',
      browserRequirements: 'Requires JavaScript and a modern browser',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: page.app.features,
      publisher: { '@id': `${ORIGIN}/#org` },
    },
    {
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: page.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  for (const s of page.sections) {
    if (s.kind !== 'steps') continue;
    graph.push({
      '@type': 'HowTo',
      '@id': `${url}#howto`,
      name: s.h2,
      description: s.intro,
      step: s.steps.map((st, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: st.name,
        text: st.text,
        url: `${url}#${s.id}`,
      })),
    });
  }

  if (page.breadcrumbs.length > 0) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: page.breadcrumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: abs(c.path),
      })),
    });
  }

  graph.push({ '@type': 'Organization', '@id': `${ORIGIN}/#org`, name: SITE, url: `${ORIGIN}/`, logo: `${ORIGIN}/favicon.svg` });
  if (page.path === '/') {
    graph.push({ '@type': 'WebSite', '@id': `${ORIGIN}/#website`, name: SITE, url: `${ORIGIN}/`, publisher: { '@id': `${ORIGIN}/#org` } });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
