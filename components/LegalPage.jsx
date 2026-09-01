'use client';

import SiteNav from '@/components/SiteNav';

// Simple content shell for static pages (About / Privacy / Terms).
// `sections` is an array of { heading, paras: string[] }.
export default function LegalPage({ title, intro, sections = [] }) {
  return (
    <>
      <SiteNav />
      <div className="anim-in" style={{ maxWidth: 760, margin: '0 auto', padding: '30px 20px 90px' }}>
        <h1 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 700, margin: '0 0 12px' }}>{title}</h1>
        {intro && <p style={{ fontSize: 16, lineHeight: 1.75, color: '#44403c', margin: '0 0 28px' }}>{intro}</p>}
        {sections.map((s, i) => (
          <section key={i} style={{ marginBottom: 26 }}>
            {s.heading && <h2 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 10px' }}>{s.heading}</h2>}
            {s.paras.map((p, j) => (
              <p key={j} style={{ fontSize: 15, lineHeight: 1.8, color: '#292524', margin: '0 0 12px' }}>{p}</p>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
