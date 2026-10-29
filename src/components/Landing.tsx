import { Link } from 'react-router-dom';
import type { Crumb, PageContent, Section } from '../content/types';
import { buildSchema } from '../content/schema';
import Faq from './Faq';

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((c, i) =>
          i < items.length - 1 ? (
            <li key={c.path}>
              <Link to={c.path}>{c.name}</Link>
            </li>
          ) : (
            <li key={c.path} aria-current="page">
              {c.name}
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}

/** First screen copy above the tool: crumbs, H1, one-liner, limits. */
export function ToolHeader({ page }: { page: PageContent }) {
  return (
    <>
      <Breadcrumbs items={page.breadcrumbs} />
      <h1>{page.h1}</h1>
      <p className="tool-sub">{page.sub}</p>
      <p className="limits-line">{page.limits}</p>
    </>
  );
}

function SectionBody({ s }: { s: Section }) {
  switch (s.kind) {
    case 'text':
      return (
        <>
          {s.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {s.bullets && (
            <ul className="landing-list">
              {s.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </>
      );
    case 'steps':
      return (
        <>
          <p>{s.intro}</p>
          <ol className="steps">
            {s.steps.map((st, i) => (
              <li className="step" key={st.name}>
                <span className="step-num" aria-hidden>
                  {i + 1}
                </span>
                <h3>{st.name}</h3>
                <p>{st.text}</p>
              </li>
            ))}
          </ol>
        </>
      );
    case 'examples':
      return (
        <>
          <p>{s.intro}</p>
          {s.examples.map((ex) => (
            <figure className="example" key={ex.before}>
              <div className="preview-row">
                <div className="preview-box">
                  <span className="preview-label">Before</span>
                  <div className="checker">
                    <img src={ex.before} alt={ex.beforeAlt} width={240} height={240} loading="lazy" />
                  </div>
                </div>
                <div className="preview-box">
                  <span className="preview-label">After</span>
                  <div className="checker">
                    <img src={ex.after} alt={ex.afterAlt} width={240} height={240} loading="lazy" />
                  </div>
                </div>
              </div>
              <figcaption className="muted">{ex.caption}</figcaption>
            </figure>
          ))}
        </>
      );
    case 'related':
      return (
        <>
          {s.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p>
            <Link to={s.link.to} className="btn btn-outline">
              {s.link.label} →
            </Link>
          </p>
        </>
      );
  }
}

/** Landing body below the tool: H2 sections, FAQ and JSON-LD (one data source). */
export function LandingBody({ page }: { page: PageContent }) {
  return (
    <div className="landing">
      {page.sections.map((s) => (
        <section className="landing-section" id={s.id} key={s.id}>
          <h2>{s.h2}</h2>
          <SectionBody s={s} />
        </section>
      ))}
      <section className="landing-section" id="faq">
        <h2>{page.faqTitle}</h2>
        <Faq items={page.faq} />
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildSchema(page)).replace(/</g, '\\u003c'),
        }}
      />
    </div>
  );
}
