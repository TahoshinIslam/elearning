'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';
import { modeLabel, modeChip, catLabel } from '@/lib/catalog';

function Catalog() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, courses } = useApp();

  const [q, setQ] = useState(params.get('q') || '');
  const [cat, setCat] = useState(params.get('cat') || 'all');
  const [mode, setMode] = useState('all');

  const published = useMemo(() => courses.filter((c) => c.published), [courses]);
  const cats = useMemo(() => [...new Set(published.map((c) => c.category).filter(Boolean))], [published]);
  const modes = useMemo(() => [...new Set(published.map((c) => c.mode).filter(Boolean))], [published]);

  const results = published.filter((c) => {
    if (cat !== 'all' && c.category !== cat) return false;
    if (mode !== 'all' && c.mode !== mode) return false;
    if (q.trim() && !`${c.title} ${c.tagline || ''}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  });

  const pill = (active) => ({
    border: active ? '1.5px solid var(--brand)' : '1.5px solid var(--line)',
    background: active ? 'var(--brand-wash)' : '#fff',
    color: active ? 'var(--brand-deep)' : 'var(--ink-soft)',
    borderRadius: 99, padding: '7px 15px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer'
  });

  return (
    <>
      <SiteNav />
      <div className="anim-in" style={{ maxWidth: 1280, margin: '0 auto', padding: '26px 20px 80px' }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 28, fontWeight: 700 }}>{t.catalogTitle}</h1>

        {/* search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F4EE', border: '1.5px solid var(--line)', borderRadius: 12, padding: '10px 16px', marginBottom: 16, maxWidth: 460 }}>
          <span style={{ color: 'var(--brand)' }}>⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.navSearch}
            style={{ border: 'none', outline: 'none', background: 'none', fontSize: 14, width: '100%', color: 'var(--ink)' }}
          />
        </div>

        {/* filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--faint)', marginRight: 4 }}>{t.filterSubject}:</span>
          <button style={pill(cat === 'all')} onClick={() => setCat('all')}>{t.catAll}</button>
          {cats.map((c) => <button key={c} style={pill(cat === c)} onClick={() => setCat(c)}>{catLabel(t, c)}</button>)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22, alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--faint)', marginRight: 4 }}>{t.filterMode}:</span>
          <button style={pill(mode === 'all')} onClick={() => setMode('all')}>{t.catAll}</button>
          {modes.map((m) => <button key={m} style={pill(mode === m)} onClick={() => setMode(m)}>{modeLabel(t, m)}</button>)}
        </div>

        {/* results */}
        {results.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--faint)' }}>{t.catNoResults}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {results.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/course/${c.slug}`)}
                className="card"
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
              >
                <div className="placeholder-art" style={{ height: 118, fontSize: 11 }}>{c.thumb} · banner</div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {c.mode && <span className={`tag ${modeChip(c.mode)}`}>{modeLabel(t, c.mode)}</span>}
                    {c.category && <span className="tag chip-stone">{catLabel(t, c.category)}</span>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>{c.title}</div>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span className="display" style={{ fontSize: 17 }}>{c.price === 0 ? t.cdFree : `৳${c.price}`}</span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>★ {c.rating}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<SiteNav />}>
      <Catalog />
    </Suspense>
  );
}
