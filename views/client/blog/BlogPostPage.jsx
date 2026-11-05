import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import Icon from '@/components/Icon';
import ArticleCard, { ArticleCover, ArticleMeta } from '@/components/blog/ArticleCard';
import ShareBar from '@/components/blog/ShareBar';
import ViewBeacon from '@/components/blog/ViewBeacon';
import { getPostBySlug, getRelatedPosts } from '@/lib/blogRepo';
import { renderMarkdown } from '@/lib/markdown';
import { currentSession } from '@/lib/auth';
import { canAccess } from '@/lib/rbac';
import { getCopy } from '@/lib/lang';
import { abs } from '@/lib/seo';

async function load(slug) {
  const s = await currentSession();
  return getPostBySlug(decodeURIComponent(slug), { includeDrafts: !!s && canAccess(s, 'blog', 'view') });
}

export async function generateMetadata(props) {
  const { slug } = await props.params;
  const post = await load(slug);
  if (!post) return { title: 'Not found', robots: { index: false } };
  const url = abs(`/blog/${encodeURIComponent(post.slug)}`);
  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: { canonical: url },
    robots: post.live ? undefined : { index: false, follow: false },
    openGraph: { type: 'article', title: post.title, description: post.excerpt || undefined, url, publishedTime: post.publishedAt || undefined, authors: [post.author], images: post.coverUrl ? [abs(post.coverUrl)] : undefined }
  };
}

export default async function BlogPostPage(props) {
  const { slug } = await props.params;
  const { lang } = await getCopy();
  const en = lang === 'en';
  const post = await load(slug);
  if (!post) notFound();
  const [related, { html, headings }] = await Promise.all([getRelatedPosts(post.id, 4), renderMarkdown(post.body)]);
  const url = abs(`/blog/${encodeURIComponent(post.slug)}`);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt || undefined,
    datePublished: post.publishedAt || undefined, dateModified: post.updatedAt || undefined, author: { '@type': 'Person', name: post.author },
    image: post.coverUrl ? [abs(post.coverUrl)] : undefined, mainEntityOfPage: url, publisher: { '@type': 'Organization', name: 'Leo Learning' }
  };
  const toc = headings.filter((h) => h.level === 2);

  return (
    <>
      <SiteNav />
      <main id="main" className="journal article-page">
        {!post.live && <div className="notice notice-warn container" style={{ marginTop: 16 }}><Icon name="eye" size={16} />{post.status === 'draft' ? (en ? 'Draft — only staff can see this.' : 'খসড়া — শুধু স্টাফরা দেখতে পাচ্ছেন।') : (en ? 'Scheduled — not public yet.' : 'নির্ধারিত সময়ে প্রকাশ হবে — এখনো সবার জন্য নয়।')}</div>}
        <article className="article">
          <header className="article-head container">
            <nav aria-label="Breadcrumb"><ol className="breadcrumbs"><li><Link href="/blog">{en ? 'Journal' : 'জার্নাল'}</Link></li>{post.category && <li><Link href={`/blog?category=${encodeURIComponent(post.category)}`}>{post.category}</Link></li>}</ol></nav>
            <h1 className="article-title">{post.title}</h1>
            {post.excerpt && <p className="article-dek">{post.excerpt}</p>}
            <div className="article-byline">
              <span className="article-avatar" aria-hidden="true">{post.author.charAt(0)}</span>
              <ArticleMeta post={post} lang={lang} views />
            </div>
          </header>
          <div className="container-wide article-cover"><ArticleCover post={post} size="xl" priority /></div>
          <div className="container article-layout">
            <aside className="article-aside">
              <ShareBar url={url} title={post.title} lang={lang} />
              {toc.length > 2 && (
                <nav className="article-toc" aria-label={en ? 'In this article' : 'এই লেখায়'}>
                  <strong>{en ? 'In this article' : 'এই লেখায়'}</strong>
                  <ol>{toc.map((h) => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}</ol>
                </nav>
              )}
            </aside>
            <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
          {post.tags.length > 0 && (
            <div className="container article-tags">
              <ul className="tag-cloud">{post.tags.map((t) => <li key={t}><Link href={`/blog?tag=${encodeURIComponent(t)}`}>#{t}</Link></li>)}</ul>
            </div>
          )}
        </article>

        {related.length > 0 && (
          <section className="related container-wide" aria-labelledby="rel-h">
            <h2 id="rel-h" className="journal-h journal-h-lg">{en ? 'Related articles' : 'সম্পর্কিত লেখা'}</h2>
            <ul className="art-grid art-grid-4">{related.map((p) => <li key={p.id}><ArticleCard post={p} lang={lang} /></li>)}</ul>
          </section>
        )}
        <div className="container" style={{ paddingBottom: 48 }}><Link href="/blog" className="btn btn-secondary"><Icon name="arrowLeft" size={16} />{en ? 'All articles' : 'সব লেখা'}</Link></div>
        {post.live && <ViewBeacon slug={post.slug} />}
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </>
  );
}
