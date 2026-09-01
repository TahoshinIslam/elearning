'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';

export default function BlogPostPage() {
  const { t, api } = useApp();
  const { slug } = useParams();
  const router = useRouter();
  const [post, setPost] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => { api.getPost(slug).then(setPost).catch(() => setPost(null)); }, [slug]);

  return (
    <>
      <SiteNav />
      <div className="anim-in" style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 90px' }}>
        <Link href="/blog" style={{ color: 'var(--muted)', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>{t.blogBack}</Link>

        {post === undefined ? (
          <div style={{ color: 'var(--faint)', textAlign: 'center', padding: 60 }}>…</div>
        ) : post === null ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40 }}>🔍</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 10 }}>{t.cdNotFound}</div>
            <button className="btn-primary" style={{ marginTop: 18 }} onClick={() => router.push('/blog')}>{t.blogBack}</button>
          </div>
        ) : (
          <article style={{ marginTop: 16 }}>
            {post.category && <span className="tag chip-orange">{post.category}</span>}
            <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 700, lineHeight: 1.25, margin: '12px 0 10px' }}>{post.title}</h1>
            <div style={{ fontSize: 13, color: 'var(--faint)', marginBottom: 20 }}>{t.blogBy} {post.author} · {post.publishedAt}</div>
            <div className="placeholder-art" style={{ height: 220, fontSize: 13, borderRadius: 14, marginBottom: 24 }}>{post.cover || 'blog'}</div>
            {post.excerpt && <p style={{ fontSize: 17, lineHeight: 1.7, color: '#44403c', fontWeight: 500, marginBottom: 20 }}>{post.excerpt}</p>}
            {String(post.body || '').split('\n').filter(Boolean).map((para, i) => (
              <p key={i} style={{ fontSize: 15.5, lineHeight: 1.85, color: '#292524', margin: '0 0 16px' }}>{para}</p>
            ))}
          </article>
        )}
      </div>
    </>
  );
}
