'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';

export default function BlogListPage() {
  const { t, api } = useApp();
  const [posts, setPosts] = useState(null);

  useEffect(() => { api.getPosts().then(setPosts).catch(() => setPosts([])); }, []);

  return (
    <>
      <SiteNav />
      <div className="anim-in" style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 20px 80px' }}>
        <h1 style={{ fontSize: 'clamp(24px,3.4vw,32px)', fontWeight: 700, margin: '0 0 6px' }}>{t.blogTitle}</h1>
        <p style={{ color: 'var(--muted)', margin: '0 0 26px', fontSize: 15 }}>{t.blogSub}</p>

        {posts === null ? (
          <div style={{ color: 'var(--faint)', textAlign: 'center', padding: 40 }}>…</div>
        ) : posts.length === 0 ? (
          <div className="panel" style={{ padding: 50, textAlign: 'center', color: 'var(--muted)' }}>{t.blogEmpty}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap: 18 }}>
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="card" style={{ overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
                <div className="placeholder-art" style={{ height: 150, fontSize: 12 }}>{p.cover || 'blog'}</div>
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {p.category && <span className="tag chip-orange" style={{ alignSelf: 'flex-start' }}>{p.category}</span>}
                  <div style={{ fontWeight: 700, fontSize: 16.5, lineHeight: 1.35 }}>{p.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>{p.excerpt}</div>
                  <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--faint)', display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                    <span>{t.blogBy} {p.author}</span><span>{p.publishedAt}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
