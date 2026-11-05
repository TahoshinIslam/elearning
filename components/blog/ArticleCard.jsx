import Link from 'next/link';
import Icon from '@/components/Icon';
import { dateLabel, num } from '@/lib/copy';
import { toneFor } from '@/components/ui/CourseCover';

// Cover: uploaded image, or a typographic panel coloured by category.
export function ArticleCover({ post, size = 'md', priority = false }) {
  const tone = toneFor(post.category || post.title);
  return (
    <div className={`art-cover art-cover-${size}`} style={{ '--tone': tone.bg }}>
      {post.coverUrl
        ? <img src={post.coverUrl} alt="" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" />
        : <span className="art-cover-mark" aria-hidden="true">{(post.category || post.title || '·').trim().charAt(0)}</span>}
    </div>
  );
}

export function ArticleMeta({ post, lang, views = false }) {
  const en = lang === 'en';
  return (
    <p className="art-meta">
      <span>{post.author}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={post.publishedAt || undefined}>{dateLabel(lang, post.publishedAt)}</time>
      <span aria-hidden="true">·</span>
      <span>{en ? `${post.readMinutes} min read` : `${num(lang, post.readMinutes)} মিনিটে পড়া`}</span>
      {views && post.views > 0 && <><span aria-hidden="true">·</span><span><Icon name="eye" size={13} /> {num(lang, post.views)}</span></>}
    </p>
  );
}

// variant: lead | top | card | row | mini
export default function ArticleCard({ post, lang, variant = 'card', priority = false, rank }) {
  const href = `/blog/${encodeURIComponent(post.slug)}`;
  if (variant === 'mini') {
    return (
      <article className="art-mini">
        {rank != null && <span className="art-rank" aria-hidden="true">{num(lang, rank)}</span>}
        <div>
          <h3 className="art-mini-title"><Link href={href}>{post.title}</Link></h3>
          <ArticleMeta post={post} lang={lang} />
        </div>
      </article>
    );
  }
  return (
    <article className={`art art-${variant}`}>
      <Link href={href} tabIndex={-1} aria-hidden="true" className="art-media"><ArticleCover post={post} size={variant === 'lead' ? 'lg' : 'md'} priority={priority} /></Link>
      <div className="art-body">
        {post.category && <Link href={`/blog?category=${encodeURIComponent(post.category)}`} className="art-kicker">{post.category}</Link>}
        <h3 className="art-title"><Link href={href}>{post.title}</Link></h3>
        {post.excerpt && variant !== 'row' && <p className="art-excerpt">{post.excerpt}</p>}
        <ArticleMeta post={post} lang={lang} />
      </div>
    </article>
  );
}
