import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';

// Content shell for static pages (About / Privacy / Terms).
// `sections`: [{ id?, heading, paras: string[] }] — ids make sections linkable.
export default function LegalPage({ eyebrow, title, intro, sections = [], updated }) {
  return (
    <>
      <SiteNav />
      <main id="main" className="container container-narrow section">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="h1" style={{ margin: '8px 0 14px' }}>{title}</h1>
        {intro && <p className="lead" style={{ marginBottom: 32 }}>{intro}</p>}
        <div className="stack" style={{ '--gap': '28px' }}>
          {sections.map((s, i) => (
            <section key={s.id || i} id={s.id} aria-labelledby={s.heading ? `sec-${i}` : undefined} style={{ scrollMarginTop: 'calc(var(--header-h) + 16px)' }}>
              {s.heading && <h2 id={`sec-${i}`} className="h3" style={{ marginBottom: 10 }}>{s.heading}</h2>}
              <div className="stack" style={{ '--gap': '10px' }}>{s.paras.map((p, j) => <p key={j} style={{ color: 'var(--ink-2)', lineHeight: 1.8 }}>{p}</p>)}</div>
            </section>
          ))}
        </div>
        {updated && <p className="small muted" style={{ marginTop: 40 }}>{updated}</p>}
      </main>
      <SiteFooter />
    </>
  );
}
