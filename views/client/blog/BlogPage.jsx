import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import Icon from '@/components/Icon';
import ArticleCard from '@/components/blog/ArticleCard';
import { getFrontPage, listPublished } from '@/lib/blogRepo';
import { getCopy } from '@/lib/lang';
import { num } from '@/lib/copy';
import { abs } from '@/lib/seo';

const one = (v) => (Array.isArray(v) ? v[0] : v) || '';

export async function generateMetadata(props) {
  const sp = await props.searchParams;
  const { lang } = await getCopy();
  const en = lang === 'en';
  const category = one(sp?.category), tag = one(sp?.tag), page = Number(one(sp?.page)) || 1;
  const base = en ? 'Leo Journal — study tips, exam news and guides' : 'লিও জার্নাল — পড়াশোনা, পরীক্ষা ও ক্যারিয়ার';
  return {
    title: category || tag ? `${category || `#${tag}`} — ${en ? 'Journal' : 'জার্নাল'}` : base,
    description: en ? 'Articles on studying smarter, exams, admissions and careers.' : 'পড়াশোনা, পরীক্ষা, ভর্তি ও ক্যারিয়ার নিয়ে লেখা।',
    alternates: { canonical: abs('/blog') },
    robots: category || tag || page > 1 ? { index: false, follow: true } : undefined
  };
}

function href(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, String(v));
  const s = sp.toString();
  return s ? `/blog?${s}` : '/blog';
}

export function Pagination({ page, pages, make, lang }) {
  if (pages <= 1) return null;
  const en = lang === 'en';
  const list = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);
  return (
    <nav className="pagination" aria-label={en ? 'Pages' : 'পৃষ্ঠা'}>
      {page > 1 && <Link className="page-btn" href={make(page - 1)} rel="prev" aria-label={en ? 'Previous page' : 'আগের পৃষ্ঠা'}><Icon name="chevronLeft" size={16} /></Link>}
      {list.map((p, i) => (
        <span key={p} style={{ display: 'contents' }}>
          {i > 0 && p - list[i - 1] > 1 && <span aria-hidden="true" className="muted">…</span>}
          <Link className="page-btn" href={make(p)} aria-current={p === page ? 'page' : undefined}>{num(lang, p)}</Link>
        </span>
      ))}
      {page < pages && <Link className="page-btn" href={make(page + 1)} rel="next" aria-label={en ? 'Next page' : 'পরের পৃষ্ঠা'}><Icon name="chevronRight" size={16} /></Link>}
    </nav>
  );
}

// Newspaper-style front page: masthead, section bar, lead story with top
// stories beside it, "most read", then the latest articles (paginated).
// ?category= / ?tag= / ?q= turn it into a section page.
export default async function BlogPage(props) {
  const sp = await props.searchParams;
  const { lang } = await getCopy();
  const en = lang === 'en';
  const category = one(sp?.category).slice(0, 64), tag = one(sp?.tag).slice(0, 40), text = one(sp?.q).slice(0, 100);
  const page = Math.max(1, Number(one(sp?.page)) || 1);
  const front = await getFrontPage();
  const filtered = !!(category || tag || text);
  const showFront = !filtered && page === 1 && front.lead;
  // the latest list leaves out the stories already on the front page
  const latest = await listPublished({ page, category, tag, q: text, excludeIds: filtered ? [] : front.topIds });
  const today = new Date().toLocaleDateString(en ? 'en-GB' : 'bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' });

  return (
    <>
      <SiteNav />
      <main id="main" className="journal">
        <header className="journal-mast">
          <div className="container-wide">
            <div className="journal-mast-top">
              <span>{today}</span>
              <form action="/blog" className="journal-search" role="search">
                <label htmlFor="jq" className="sr-only">{en ? 'Search articles' : 'লেখা খুঁজুন'}</label>
                <input id="jq" name="q" type="search" className="input" defaultValue={text} placeholder={en ? 'Search articles' : 'লেখা খুঁজুন'} />
                <button type="submit" className="btn btn-secondary btn-sm" aria-label={en ? 'Search' : 'খুঁজুন'}><Icon name="search" size={16} /></button>
              </form>
            </div>
            <Link href="/blog" className="journal-title">{en ? 'Leo Journal' : 'লিও জার্নাল'}</Link>
            <p className="journal-tag">{en ? 'Study smarter · exams · admissions · careers' : 'পড়াশোনা · পরীক্ষা · ভর্তি · ক্যারিয়ার'}</p>
          </div>
          <nav className="journal-sections" aria-label={en ? 'Sections' : 'বিভাগ'}>
            <div className="container-wide">
              <Link href="/blog" aria-current={!category && !tag ? 'page' : undefined}>{en ? 'Front page' : 'প্রচ্ছদ'}</Link>
              {front.categories.map((c) => (
                <Link key={c.name} href={href({ category: c.name })} aria-current={category === c.name ? 'page' : undefined}>{c.name}<span className="count">{num(lang, c.count)}</span></Link>
              ))}
            </div>
          </nav>
        </header>

        <div className="container-wide journal-wrap">
          {!front.lead ? (
            <div className="surface state"><div className="state-icon"><Icon name="newspaper" size={24} /></div><p>{en ? 'No articles yet.' : 'এখনো কোনো লেখা নেই।'}</p></div>
          ) : (
            <>
              {showFront && (
                <section className="front" aria-label={en ? 'Top stories' : 'প্রধান খবর'}>
                  <div className="front-lead"><ArticleCard post={front.lead} lang={lang} variant="lead" priority /></div>
                  <div className="front-top">{front.top.map((p) => <ArticleCard key={p.id} post={p} lang={lang} variant="row" />)}</div>
                  <aside className="front-side" aria-labelledby="most-read">
                    <h2 id="most-read" className="journal-h"><Icon name="zap" size={16} />{en ? 'Most read' : 'সর্বাধিক পঠিত'}</h2>
                    <ol className="most-read">{front.mostRead.map((p, i) => <li key={p.id}><ArticleCard post={p} lang={lang} variant="mini" rank={i + 1} /></li>)}</ol>
                    {front.tags.length > 0 && (
                      <>
                        <h2 className="journal-h" style={{ marginTop: 18 }}>#{en ? 'Topics' : 'বিষয়'}</h2>
                        <ul className="tag-cloud">{front.tags.map((t) => <li key={t.name}><Link href={href({ tag: t.name })}>#{t.name}</Link></li>)}</ul>
                      </>
                    )}
                  </aside>
                </section>
              )}

              <section aria-labelledby="latest-h" className="latest">
                <h2 id="latest-h" className="journal-h journal-h-lg">
                  {category || (tag ? `#${tag}` : text ? `“${text}”` : (en ? 'Latest' : 'সর্বশেষ'))}
                  {filtered && <span className="muted small" style={{ fontFamily: 'var(--font-body, inherit)' }}> · {en ? `${latest.total} articles` : `${num(lang, latest.total)}টি লেখা`}</span>}
                  {filtered && <Link href="/blog" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}><Icon name="x" size={14} />{en ? 'Clear' : 'মুছুন'}</Link>}
                </h2>
                {latest.items.length ? (
                  <ul className="art-grid">{latest.items.map((p) => <li key={p.id}><ArticleCard post={p} lang={lang} /></li>)}</ul>
                ) : (
                  <p className="muted">{filtered ? (en ? 'No articles match.' : 'মিলছে এমন লেখা নেই।') : (en ? 'That’s everything for now.' : 'আপাতত এটুকুই।')}</p>
                )}
                <Pagination page={latest.page} pages={latest.pages} lang={lang} make={(p) => href({ category, tag, q: text, page: p > 1 ? p : '' })} />
              </section>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
