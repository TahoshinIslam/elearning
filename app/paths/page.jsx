'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';

export default function PathsListPage() {
  const { t, api } = useApp();
  const [paths, setPaths] = useState(null);

  useEffect(() => { api.getPaths().then(setPaths).catch(() => setPaths([])); }, []);

  return (
    <>
      <SiteNav />
      <div className="anim-in" style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 20px 80px' }}>
        <h1 style={{ fontSize: 'clamp(24px,3.4vw,32px)', fontWeight: 700, margin: '0 0 6px' }}>{t.pathsTitle}</h1>
        <p style={{ color: 'var(--muted)', margin: '0 0 26px', fontSize: 15 }}>{t.pathsSub}</p>

        {paths === null ? (
          <div style={{ color: 'var(--faint)', textAlign: 'center', padding: 40 }}>…</div>
        ) : paths.length === 0 ? (
          <div className="panel" style={{ padding: 50, textAlign: 'center', color: 'var(--muted)' }}>{t.pathsEmpty}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(320px,100%),1fr))', gap: 18 }}>
            {paths.map((p) => (
              <Link key={p.id} href={`/paths/${p.slug}`} className="card" style={{ overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
                <div className="placeholder-art" style={{ height: 130, fontSize: 12 }}>{p.thumb || 'track'}</div>
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{p.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, flex: 1 }}>{p.description}</div>
                  <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--brand-deep)' }}>{p.courses.length} {t.pathCourses} →</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
