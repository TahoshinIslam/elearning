import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import CourseCard from '@/components/ui/CourseCard';
import Icon from '@/components/Icon';
import { FilterPanel, MobileFilters, SortSelect, ActiveFilters, CatalogShell, CatalogResults, SectionTabs } from '@/components/catalog/CatalogControls';
import { listPublishedCourses, getCatalogFacets, parseCatalogQuery, getOwnedCourseIds } from '@/lib/catalogRepo';
import { currentSession } from '@/lib/auth';
import { getCopy } from '@/lib/lang';
import { copy } from '@/lib/copy';
import { categoryLabel } from '@/lib/categoryLabel';
import { abs } from '@/lib/seo';


export async function generateMetadata(props) {
  const searchParams = await props.searchParams;
  const { lang } = await getCopy();
  const c = copy(lang);
  const query = parseCatalogQuery(searchParams);
  const filtered = query.q || query.section || query.mode || query.category || query.class || query.collection || query.level || query.language || query.price || query.page > 1;
  return {
    title: query.q ? `${query.q} — ${c.catalogTitle}` : c.catalogTitle,
    description: c.catalogSub,
    alternates: { canonical: abs('/courses') },
    // Filtered/paged permutations stay crawlable but aren't indexed separately.
    robots: filtered ? { index: false, follow: true } : undefined
  };
}

function pageHref(searchParams, page) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams || {})) if (v && k !== 'page') sp.set(k, Array.isArray(v) ? v[0] : v);
  if (page > 1) sp.set('page', String(page));
  const s = sp.toString();
  return s ? `/courses?${s}` : '/courses';
}

export default async function CoursesPage(props) {
  const searchParams = await props.searchParams;
  const { lang, c } = await getCopy();
  const query = parseCatalogQuery(searchParams);
  const [result, facets, owned] = await Promise.all([
    listPublishedCourses(query), getCatalogFacets(query), getOwnedCourseIds(await currentSession())
  ]);
  const catOptions = facets.categories.map((x) => ({ value: x.value, label: categoryLabel(lang, x.value, x.name), count: x.count }));
  const filterProps = { lang, query, facets: { ...facets, categories: catOptions } };
  const { items, total, page, pages } = result;
  const windowPages = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);

  return (
    <>
      <SiteNav />
      <main id="main" className="container section-tight" style={{ paddingTop: 28 }}>
        <div className="page-head" style={{ marginBottom: 20 }}>
          <div>
            <h1 className="h1">{query.q ? `“${query.q}”` : query.section && facets.sections.find((x) => x.value === query.section) ? (lang === 'en' ? facets.sections.find((x) => x.value === query.section).nameEn : facets.sections.find((x) => x.value === query.section).nameBn)
              : query.collection ? c[`${query.collection}Section`]
              : query.class ? (query.class === 'other' ? c.otherCourses : facets.classesAll.find((x) => x.value === query.class)?.name || c.catalogTitle)
              : query.category ? (catOptions.find((x) => x.value === query.category)?.label || c.catalogTitle) : c.catalogTitle}</h1>
            <p aria-live="polite" id="results-count">{query.q ? c.resultsFor(total, query.q) : c.results(total)}</p>
          </div>
        </div>
        <CatalogShell>
          <SectionTabs {...filterProps} />
          <aside className="filters" aria-label={c.filters}>
            <FilterPanel {...filterProps} />
          </aside>
          <CatalogResults labelledBy="results-count">
            <div className="toolbar">
              <MobileFilters {...filterProps} />
              <ActiveFilters {...filterProps} />
              <div style={{ marginLeft: 'auto' }}><SortSelect lang={lang} sort={query.sort} hasQuery={!!query.q} /></div>
            </div>
            {items.length ? (
              <ul className="grid-cards" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {items.map((course, i) => (
                  <li key={course.id} className="rise" style={{ '--i': i }}><CourseCard course={course} lang={lang} owned={owned.has(course.id)} categoryLabel={categoryLabel(lang, course.category, course.categoryName)} priority={i < 3} /></li>
                ))}
              </ul>
            ) : (
              <div className="surface state">
                <div className="state-icon"><Icon name="search" size={24} /></div>
                <h2>{c.noResultsT}</h2>
                <p>{c.noResultsD}</p>
                <Link href="/courses" className="btn btn-secondary">{c.clearFilters}</Link>
              </div>
            )}
            {pages > 1 && (
              <nav className="pagination" aria-label={c.pagination}>
                {page > 1 ? <Link className="page-btn" href={pageHref(searchParams, page - 1)} rel="prev"><Icon name="chevronLeft" size={16} /><span className="sr-only">{c.prev}</span></Link> : null}
                {windowPages.map((p, i) => (
                  <span key={p} style={{ display: 'contents' }}>
                    {i > 0 && p - windowPages[i - 1] > 1 && <span aria-hidden="true" className="muted">…</span>}
                    <Link className="page-btn" href={pageHref(searchParams, p)} aria-current={p === page ? 'page' : undefined} aria-label={c.pageOf(p, pages)}>{p}</Link>
                  </span>
                ))}
                {page < pages ? <Link className="page-btn" href={pageHref(searchParams, page + 1)} rel="next"><Icon name="chevronRight" size={16} /><span className="sr-only">{c.next}</span></Link> : null}
              </nav>
            )}
          </CatalogResults>
        </CatalogShell>
      </main>
      <SiteFooter />
    </>
  );
}
