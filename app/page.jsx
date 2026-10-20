import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import CourseCard from '@/components/ui/CourseCard';
import CourseCover, { toneFor } from '@/components/ui/CourseCover';
import Icon from '@/components/Icon';
import Reveal from '@/components/ui/Reveal';
import PromoCarousel from '@/components/home/PromoCarousel';
import PromoPopup from '@/components/home/PromoPopup';
import { getFeaturedCourses, getNewArrivals, getUpcomingCourses, getPopularCourses, getCatalogFacets, getPlatformStats, getOwnedCourseIds, getFeaturedInstructors, getCoursesBySubjects, catalogContext } from '@/lib/catalogRepo';
import { getActiveCampaigns } from '@/lib/campaignRepo';
import { getHomepage } from '@/lib/homepageRepo';
import { currentSession } from '@/lib/auth';
import { getCopy } from '@/lib/lang';
import { num } from '@/lib/copy';
import { categoryLabel } from '@/lib/categoryLabel';
import { abs } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata = { alternates: { canonical: abs('/') } };

export default async function HomePage() {
  const { lang, c } = getCopy();
  const session = currentSession();
  const ctx = await catalogContext();
  const [featured, fresh, upcoming, popular, facets, stats, owned, instructors, cms, slides] = await Promise.all([
    getFeaturedCourses(8, ctx), getNewArrivals(8, ctx), getUpcomingCourses(8, ctx), getPopularCourses(8, ctx),
    getCatalogFacets(), getPlatformStats(), getOwnedCourseIds(session), getFeaturedInstructors(4),
    getHomepage().catch(() => ({})), getActiveCampaigns({ kind: 'slide', page: 'home', session }).catch(() => [])
  ]);
  // One row per subject (admin order), for subjects that have courses.
  const rowSubjects = facets.categories.slice(0, 6);
  const bySubject = await getCoursesBySubjects(rowSubjects.map((x) => x.value), 8, ctx);
  const grid = (list, priorityFirst = false) => (
    <ul className="course-grid">
      {list.map((course, i) => (
        <li key={course.id}><CourseCard course={course} lang={lang} owned={owned.has(course.id)} categoryLabel={categoryLabel(lang, course.category, course.categoryName)} priority={priorityFirst && i < 2} /></li>
      ))}
    </ul>
  );
  const sectionHead = (id, title, sub, href, icon) => (
    <div className="home-head">
      <div className="home-head-text">
        {icon && <span className="home-head-icon" aria-hidden="true"><Icon name={icon} size={20} /></span>}
        <div><h2 id={id} className="h2">{title}</h2>{sub && <p>{sub}</p>}</div>
      </div>
      {href && <Link href={href} className="btn btn-sm home-viewall">{c.viewAll}<Icon name="arrowRight" size={16} /></Link>}
    </div>
  );
  const hero = cms?.hero || {};
  const faqs = Array.isArray(cms?.faqs) && cms.faqs.length ? cms.faqs.map((f) => [f.q, f.a]) : c.faq;
  const mosaic = (featured.length ? featured : popular).slice(0, 3);
  const statItems = [
    [stats.courses, c.statCourses], [stats.lessons, c.statLessons],
    stats.learners > 0 ? [stats.learners, c.statLearners] : null,
    stats.instructors > 0 ? [stats.instructors, c.statInstructors] : null
  ].filter(Boolean);

  const orgLd = {
    '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: 'Leo Learning', url: abs('/'),
    potentialAction: { '@type': 'SearchAction', target: `${abs('/courses')}?q={query}`, 'query-input': 'required name=query' }
  };

  return (
    <>
      <SiteNav />
      <main id="main" className="home">
        {slides.length > 0 && (
          <div className="container-wide promo-section"><PromoCarousel slides={slides} lang={lang} /></div>
        )}
        <section className="hero home-hero">
          <div className="container-wide hero-grid">
            <div className="stack hero-seq" style={{ '--gap': '22px' }}>
              <span className="eyebrow" style={{ '--i': 0 }}>{hero.badge || c.heroEyebrow}</span>
              <h1 className="display-1" style={{ '--i': 1 }}>{hero.title || c.heroTitle}</h1>
              <p className="lead" style={{ maxWidth: 560, '--i': 2 }}>{hero.subtitle || c.heroSub}</p>
              <form className="hero-search" role="search" action="/courses" method="get" style={{ '--i': 3 }}>
                <label htmlFor="hero-q" className="sr-only">{c.search}</label>
                <input id="hero-q" name="q" type="search" className="input" placeholder={c.searchPlaceholder} enterKeyHint="search" />
                <button type="submit" className="btn btn-primary"><Icon name="search" size={17} /><span className="desktop-only" style={{ display: 'inline' }}>{c.search}</span></button>
              </form>
              {statItems.length > 0 && (
                <dl className="stat-row" style={{ margin: '6px 0 0', '--i': 4 }}>
                  {statItems.map(([n, l]) => (
                    <div key={l}><dt className="sr-only">{l}</dt><dd style={{ margin: 0 }}><div className="num">{num(lang, n)}</div><div className="lbl" aria-hidden="true">{l}</div></dd></div>
                  ))}
                </dl>
              )}
            </div>
            {mosaic.length > 0 && (
              <div className="hero-mosaic hero-seq" aria-label={c.featuredSection}>
                {mosaic.map((course, i) => (
                  <Link key={course.id} href={`/course/${course.slug}`} aria-label={course.title} className="hero-tile" style={{ '--i': i + 2 }}>
                    <CourseCover id={course.id} title={course.title} category={course.category} kicker={categoryLabel(lang, course.category, course.categoryName)} thumbnailUrl={course.thumbnailUrl} size={i === 0 ? 'lg' : 'sm'} priority={i === 0} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {facets.categories.length > 0 && (
          <section className="home-section" aria-labelledby="subj-title">
            <div className="container-wide">
              {sectionHead('subj-title', c.subjectSection, c.subjectSub, '/courses', 'layers')}
              <ul className="subject-grid">
                {facets.categories.map((cat) => {
                  const label = categoryLabel(lang, cat.value, cat.name);
                  const tone = toneFor(cat.value);
                  return (
                    <li key={cat.value}>
                      <Link href={`/courses?category=${encodeURIComponent(cat.value)}`} className="subject-tile" style={{ '--tone': tone.bg, '--tone-2': tone.bg2 }}>
                        <span className="subject-tile-icon" aria-hidden="true">{cat.icon && !/^[a-z]/i.test(cat.icon) ? cat.icon : label.charAt(0)}</span>
                        <span className="subject-tile-name">{label}</span>
                        <span className="subject-tile-count">{c.coursesN(cat.count)}</span>
                        <Icon name="arrowRight" size={18} className="subject-tile-go" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {(featured.length > 0 || popular.length > 0) && (
          <section className="band band-featured" aria-labelledby="featured-title">
            <Reveal className="container-wide">
              {featured.length > 0
                ? sectionHead('featured-title', c.featuredSection, c.featuredSectionSub, '/courses?collection=featured', 'star')
                : sectionHead('featured-title', c.featuredTitle, c.featuredSub, '/courses?sort=popular', 'star')}
              {grid(featured.length ? featured : popular, true)}
            </Reveal>
          </section>
        )}

        {fresh.length > 0 && (
          <section className="home-section" aria-labelledby="new-title">
            <Reveal className="container-wide">
              {sectionHead('new-title', c.newSection, c.newSectionSub, '/courses?collection=new', 'zap')}
              {grid(fresh)}
            </Reveal>
          </section>
        )}

        {facets.classes.length > 0 && (
          <section className="home-section home-section-soft" aria-labelledby="class-title">
            <div className="container-wide">
              {sectionHead('class-title', c.classSection, c.classSub, null, 'book')}
              <ul className="subject-grid">
                {facets.classes.map((cl) => {
                  const tone = toneFor(`class-${cl.value}`);
                  return (
                    <li key={cl.value}>
                      <Link href={`/courses?class=${encodeURIComponent(cl.value)}`} className="subject-tile class-tile" style={{ '--tone': tone.bg, '--tone-2': tone.bg2 }}>
                        <span className="subject-tile-icon" aria-hidden="true"><Icon name="book" size={22} /></span>
                        <span className="subject-tile-name">{cl.name}</span>
                        <span className="subject-tile-count">{c.coursesN(cl.count)}</span>
                        <Icon name="arrowRight" size={18} className="subject-tile-go" />
                      </Link>
                    </li>
                  );
                })}
                {facets.nonClassCount > 0 && (
                  <li>
                    <Link href="/courses?class=other" className="subject-tile class-tile" style={{ '--tone': '#44403C', '--tone-2': '#A8A29E' }}>
                      <span className="subject-tile-icon" aria-hidden="true"><Icon name="grid" size={22} /></span>
                      <span className="subject-tile-name">{c.otherCourses}</span>
                      <span className="subject-tile-count">{c.coursesN(facets.nonClassCount)} · {c.otherCoursesD}</span>
                      <Icon name="arrowRight" size={18} className="subject-tile-go" />
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </section>
        )}

        {rowSubjects.filter((sub) => bySubject[sub.value]?.length).map((sub) => {
          const label = categoryLabel(lang, sub.value, sub.name);
          const tone = toneFor(sub.value);
          return (
            <section key={sub.value} className="home-section subject-row" style={{ '--tone': tone.bg, '--tone-2': tone.bg2, '--tone-tint': tone.tint }} aria-labelledby={`row-${sub.value}`}>
              <Reveal className="container-wide">
                <div className="home-head">
                  <div className="home-head-text">
                    <span className="home-head-icon tone" aria-hidden="true">{sub.icon && !/^[a-z]/i.test(sub.icon) ? sub.icon : label.charAt(0)}</span>
                    <div><h2 id={`row-${sub.value}`} className="h2">{label}</h2><p>{c.coursesN(sub.count)}</p></div>
                  </div>
                  <Link href={`/courses?category=${encodeURIComponent(sub.value)}`} className="btn btn-sm home-viewall">{c.viewAll}<Icon name="arrowRight" size={16} /></Link>
                </div>
                {grid(bySubject[sub.value])}
              </Reveal>
            </section>
          );
        })}

        {upcoming.length > 0 && (
          <section className="home-section" aria-labelledby="upc-title">
            <Reveal className="container-wide">
              {sectionHead('upc-title', c.upcomingSection, c.upcomingSectionSub, '/courses?collection=upcoming', 'clock')}
              {grid(upcoming)}
            </Reveal>
          </section>
        )}

        {!featured.length && !popular.length && !fresh.length && (
          <section className="section"><div className="container"><div className="surface state"><div className="state-icon"><Icon name="book" size={24} /></div><p>{c.noResultsT}</p></div></div></section>
        )}

        <section className="section" style={{ background: 'var(--surface)', borderBlock: '1px solid var(--border)' }} aria-labelledby="how-title">
          <Reveal className="container">
            <h2 id="how-title" className="h2" style={{ marginBottom: 28 }}>{c.howTitle}</h2>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 28, gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))' }}>
              {[['eye', c.how1T, c.how1D], ['shield', c.how2T, c.how2D], ['refresh', c.how3T, c.how3D]].map(([icon, t, d], i) => (
                <li key={t} className="stack" style={{ '--gap': '10px' }}>
                  <span className="row" style={{ '--gap': '10px' }}>
                    <span className="cat-swatch" style={{ background: 'var(--brand-tint)', color: 'var(--brand-ink)' }} aria-hidden="true"><Icon name={icon} size={18} /></span>
                    <span className="xsmall muted strong">{num(lang, i + 1)} / {num(lang, 3)}</span>
                  </span>
                  <h3 className="h4">{t}</h3>
                  <p className="muted">{d}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {instructors.length > 0 && (
          <section className="section" aria-labelledby="inst-title">
            <div className="container">
              <h2 id="inst-title" className="h2" style={{ marginBottom: 24 }}>{c.instructorsTitle}</h2>
              <ul className="grid-cards" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {instructors.map((t) => (
                  <li key={t.id} className="surface surface-pad">
                    <div className="instructor-card">
                      <span className="instructor-avatar" aria-hidden="true">{t.name.charAt(0)}</span>
                      <div className="stack grow" style={{ '--gap': '4px' }}>
                        <Link href={`/instructor/${t.id}`} className="h4" style={{ textDecoration: 'none' }}>{t.name}</Link>
                        {t.title && <p className="small muted">{t.title}</p>}
                        <p className="small strong" style={{ marginTop: 4 }}>{c.coursesN(t.courseCount)}</p>
                      </div>
                    </div>
                    {t.bio && <p className="small muted clamp-3" style={{ marginTop: 12 }}>{t.bio}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="section" aria-labelledby="faq-title">
          <div className="container container-narrow">
            <h2 id="faq-title" className="h2" style={{ marginBottom: 20 }}>{c.faqTitle}</h2>
            <div className="accordion">
              {faqs.map(([q, a]) => (
                <details key={q} className="accordion-item faq">
                  <summary className="accordion-trigger"><Icon name="chevronDown" size={18} className="chev" /><span className="grow">{q}</span></summary>
                  <div className="accordion-panel">{a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <PromoPopup page="home" lang={lang} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd).replace(/</g, '\\u003c') }} />
    </>
  );
}
