'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';

export default function PathDetailPage() {
  const { t, api } = useApp();
  const { slug } = useParams();
  const router = useRouter();
  const [path, setPath] = useState(undefined);

  useEffect(() => {
    api.getPaths().then((all) => setPath(all.find((p) => p.slug === slug) || null)).catch(() => setPath(null));
  }, [slug]);

  return (
    <>
      <SiteNav />
      <div className="anim-in" style={{ maxWidth: 820, margin: '0 auto', padding: '24px 20px 90px' }}>
        <Link href="/paths" style={{ color: 'var(--muted)', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>{t.pathBack}</Link>

        {path === undefined ? (
          <div style={{ color: 'var(--faint)', textAlign: 'center', padding: 60 }}>…</div>
        ) : path === null ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40 }}>🔍</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 10 }}>{t.cdNotFound}</div>
            <button className="btn-primary" style={{ marginTop: 18 }} onClick={() => router.push('/paths')}>{t.pathBack}</button>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <h1 style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 700, margin: '0 0 8px' }}>{path.title}</h1>
            <p style={{ fontSize: 16, color: '#44403c', lineHeight: 1.7, margin: '0 0 24px' }}>{path.description}</p>

            {path.courses.length === 0 ? (
              <div className="panel" style={{ padding: 30, textAlign: 'center', color: 'var(--muted)' }}>{t.pathNoCourses}</div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {path.courses.map((c, i) => (
                  <Link key={c.id} href={`/course/${c.slug}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ width: 34, height: 34, flex: 'none', borderRadius: 99, background: 'var(--brand-wash)', color: 'var(--brand-deep)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{i + 1}</div>
                    <div className="placeholder-art" style={{ width: 90, height: 54, flex: 'none', fontSize: 10, borderRadius: 8 }}>{c.thumb}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.05em', color: 'var(--faint)' }}>{t.pathStep} {i + 1}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.35 }}>{c.title}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{c.instructor}</div>
                    </div>
                    <span className="display" style={{ fontSize: 17 }}>{c.price === 0 ? t.cdFree : `৳${c.price}`}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
