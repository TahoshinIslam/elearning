import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import CourseCard from '@/components/ui/CourseCard';
import CourseCover, { toneFor } from '@/components/ui/CourseCover';
import Icon from '@/components/Icon';
import Reveal from '@/components/ui/Reveal';
import PromoCarousel from '@/components/home/PromoCarousel';
import PathCard from '@/components/ui/PathCard';
import { getFeaturedCourses, getNewArrivals, getUpcomingCourses, getPopularCourses, getCatalogFacets, getPlatformStats, getOwnedCourseIds, getFeaturedInstructors, getCoursesBySubjects, getClassLevels, getPublicPaths, catalogContext } from '@/lib/catalogRepo';
import { getActiveCampaigns } from '@/lib/campaignRepo';
import { getHomepage } from '@/lib/homepageRepo';
import { currentSession } from '@/lib/auth';
import { getCopy } from '@/lib/lang';
import { num, taka } from '@/lib/copy';
import { categoryLabel } from '@/lib/categoryLabel';
import { abs } from '@/lib/seo';

export const metadata = { alternates: { canonical: abs('/') } };

export default async function HomePage() {
  const { lang, c } = getCopy();
  const session = await currentSession();
  const ctx = await catalogContext();
  const [featured, fresh, upcoming, popular, facets, stats, owned, instructors, cms, slides, classLevels, paths] = await Promise.all([
    getFeaturedCourses(8, ctx), getNewArrivals(8, ctx), getUpcomingCourses(8, ctx), getPopularCourses(8, ctx),
    getCatalogFacets(), getPlatformStats(), getOwnedCourseIds(session), getFeaturedInstructors(8),
    getHomepage().catch(() => ({})), getActiveCampaigns({ kind: 'slide', page: 'home', session }).catch(() => []), getClassLevels(), getPublicPaths(ctx)
  ]);
  // One row per subject (admin order), for subjects that have courses.
  const rowSubjects = facets.categories.slice(0, 6);
  const bySubject = await getCoursesBySubjects(rowSubjects.map((x) => x.value), 8, ctx);
  const grid = (list, priorityFirst = false) => (
    <ul className="course-grid" data-n={Math.min(list.length, 4)}>
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
  // Carousel: admin campaigns when any are live; otherwise real featured /
  // popular courses (their own title, tagline, price offer and image).
  const courseSlides = [...featured, ...popular].filter((x, i, all) => all.findIndex((y) => y.id === x.id) === i).slice(0, 5).map((course) => ({
    id: `course-${course.id}`, title: course.title,
    body: course.tagline || [course.instructor, course.lessonCount ? c.lessonsN(course.lessonCount) : null, course.price ? taka(lang, course.price) : c.free].filter(Boolean).join(' · '),
    href: `/course/${course.slug}`, ctaLabel: c.viewCourse,
    imageUrl: course.thumbnailUrl, imageAlt: '', offer: course.offer || null,
    cover: { id: course.id, title: course.title, category: course.category, kicker: categoryLabel(lang, course.category, course.categoryName) }
  }));
  const carousel = slides.length ? slides : courseSlides;
  // Three hero tiles: featured first, topped up from popular and newest.
  const mosaic = [...featured, ...popular, ...fresh].filter((x, i, all) => all.findIndex((y) => y.id === x.id) === i).slice(0, 3);
  // Headline: the last clause (after "—" or the last comma) becomes the
  // tilted highlight sticker, e.g. "… — [নিজের গতিতে।]".
  const heroTitle = String(hero.title || c.heroTitle || '').trim();
  const cut = heroTitle.lastIndexOf('—') >= 0 ? heroTitle.lastIndexOf('—') : heroTitle.lastIndexOf(',');
  const headMain = cut > 0 ? heroTitle.slice(0, cut).replace(/[\s,—]+$/, '') : heroTitle;
  const headMark = cut > 0 ? heroTitle.slice(cut + 1).trim() : '';
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
        <section className="hero home-hero">
          <div className="container-wide hero-grid">
            <div className="stack hero-seq" style={{ '--gap': '24px' }}>
              <span className="eyebrow" style={{ '--i': 0 }}>{hero.badge || c.heroEyebrow}</span>
              <h1 className="display-1" style={{ '--i': 0 }}>
                {headMain}{headMark && <>{' '}<span className="sticker">{headMark}</span></>}
              </h1>
              <form role="search" action="/courses" method="get" className="hero-search" style={{ '--i': 1 }}>
                <label htmlFor="hero-q" className="sr-only">{c.search}</label>
                <Icon name="search" size={20} className="hero-search-icon" />
                <input id="hero-q" name="q" type="search" className="input" placeholder={c.searchPlaceholder} autoComplete="off" enterKeyHint="search" />
                <button type="submit" className="btn btn-primary btn-lg">{c.search}</button>
              </form>
              {facets.categories.length > 0 && (
                <ul className="hero-chips" style={{ '--i': 2 }} aria-label={c.subjectSection}>
                  {facets.categories.slice(0, 5).map((cat) => (
                    <li key={cat.value}><Link href={`/courses?category=${encodeURIComponent(cat.value)}`} className="chip-link">{categoryLabel(lang, cat.value, cat.name)}</Link></li>
                  ))}
                </ul>
              )}
              <div className="cluster" style={{ '--gap': '12px', '--i': 3 }}>
                <Link href="/courses" className="btn btn-primary btn-lg">{c.heroBrowse}<Icon name="arrowRight" size={18} /></Link>
                {facets.price.free > 0 && <Link href="/courses?price=free" className="btn btn-secondary btn-lg">{c.heroFree}</Link>}
              </div>
              {statItems.length > 0 && (
                <dl className="stat-row" style={{ margin: '6px 0 0', '--i': 3 }}>
                  {statItems.map(([n, l]) => (
                    <div key={l}><dt className="sr-only">{l}</dt><dd style={{ margin: 0 }}><div className="num">{num(lang, n)}</div><div className="lbl" aria-hidden="true">{l}</div></dd></div>
                  ))}
                </dl>
              )}
            </div>
            {mosaic.length > 0 && (
              <div className={`hero-mosaic hero-seq n-${mosaic.length}`} aria-label={c.featuredSection}>
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
          <div className="ticker" aria-hidden="true">
            <div className="ticker-track">
              {[0, 1].map((k) => (
                <div key={k} style={{ display: 'flex' }}>
                  {[...facets.categories.map((cat) => categoryLabel(lang, cat.value, cat.name)), ...statItems.map(([n, l]) => `${num(lang, n)} ${l}`)].concat(facets.categories.length < 4 ? facets.categories.map((cat) => categoryLabel(lang, cat.value, cat.name)) : []).map((t, i) => <span key={`${k}-${i}`}>{t}</span>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {carousel.length > 0 && (
          <div className="container-wide promo-section"><PromoCarousel slides={carousel} lang={lang} /></div>
        )}

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

        {classLevels.length > 0 && (
          <section className="home-section home-section-soft" aria-labelledby="class-title">
            <div className="container-wide">
              {sectionHead('class-title', c.classSection, c.classSub, null, 'book')}
              <ul className="class-grid">
                {classLevels.map((cl) => {
                  const n = /^class-(\d+)$/.exec(cl.value)?.[1];
                  const tone = toneFor(`class-${cl.value}`);
                  const short = n ? num(lang, Number(n)) : cl.name.split(/[\s(]/)[0];
                  return (
                    <li key={cl.value}>
                      <Link href={`/courses?class=${encodeURIComponent(cl.value)}`} className={`class-tile ${cl.count ? '' : 'is-empty'}`} style={{ '--tone': tone.bg, '--tone-2': tone.bg2 }}>
                        <span className={`class-num ${n ? '' : 'is-word'}`} aria-hidden="true">{short}</span>
                        <span className="class-name">{cl.name}</span>
                        <span className="class-count">{cl.count ? c.coursesN(cl.count) : c.comingSoon}</span>
                      </Link>
                    </li>
                  );
                })}
                {facets.nonClassCount > 0 && (
                  <li>
                    <Link href="/courses?class=other" className="class-tile" style={{ '--tone': '#B69CFF', '--tone-2': '#B69CFF' }}>
                      <span className="class-num" aria-hidden="true"><Icon name="grid" size={22} /></span>
                      <span className="class-name">{c.otherCourses}</span>
                      <span className="class-count">{c.coursesN(facets.nonClassCount)}</span>
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

        {paths.some((p) => p.courses.length) && (
          <section className="home-section" aria-labelledby="paths-title">
            <div className="container-wide">
              {sectionHead('paths-title', c.pathsSection, c.pathsWhat, '/paths', 'compass')}
              <ul className="path-grid">{paths.filter((p) => p.courses.length).slice(0, 3).map((p) => <li key={p.id}><PathCard path={p} lang={lang} /></li>)}</ul>
            </div>
          </section>
        )}

        <section className="home-section how-band" aria-labelledby="how-title">
          <Reveal className="container-wide">
            {sectionHead('how-title', c.howTitle, null, null, 'zap')}
            <ol className="how-grid">
              {[['eye', c.how1T, c.how1D, '#FFD84D', '#FFD84D'], ['shield', c.how2T, c.how2D, '#4DE3F4', '#4DE3F4'], ['refresh', c.how3T, c.how3D, '#FF7AA2', '#FF7AA2']].map(([icon, t, d, a1, a2], i) => (
                <li key={t} className="how-step" style={{ '--tone': a1, '--tone-2': a2 }}>
                  <span className="how-n" aria-hidden="true">{num(lang, i + 1)}</span>
                  <span className="how-icon" aria-hidden="true"><Icon name={icon} size={22} /></span>
                  <h3 className="h4">{t}</h3>
                  <p>{d}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {instructors.length > 0 && (
          <section className="home-section" aria-labelledby="inst-title">
            <div className="container-wide">
              {sectionHead('inst-title', c.instructorsTitle, null, null, 'user')}
              <ul className="inst-grid">
                {instructors.map((t) => {
                  const tone = toneFor(`t-${t.id}-${t.name}`);
                  return (
                    <li key={t.id} className="inst-card" style={{ '--tone': tone.bg, '--tone-2': tone.bg2, '--tone-tint': tone.tint }}>
                      <div className="inst-top">
                        <span className="inst-avatar" aria-hidden="true">{t.name.charAt(0)}</span>
                        <div style={{ minWidth: 0 }}>
                          <h3 className="inst-name"><Link href={`/instructor/${t.id}`}>{t.name}</Link></h3>
                          {t.title && <p className="inst-title">{t.title}</p>}
                        </div>
                      </div>
                      {t.bio && <p className="inst-bio">{t.bio}</p>}
                      <div className="inst-stats">
                        <span><Icon name="book" size={14} />{c.coursesN(t.courseCount)}</span>
                        {t.learnerCount > 0 && <span><Icon name="users" size={14} />{c.studentsN(t.learnerCount)}</span>}
                        <span className="inst-go" aria-hidden="true"><Icon name="arrowRight" size={16} /></span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        <section className="home-section home-section-soft" aria-labelledby="faq-title">
          <div className="container-wide faq-layout">
            <div className="faq-intro">
              <span className="home-head-icon" aria-hidden="true"><Icon name="help" size={20} /></span>
              <h2 id="faq-title" className="h2">{c.faqTitle}</h2>
              <p className="muted">{c.faqSub}</p>
              <Link href="/contact" className="btn btn-secondary">{c.navContact}<Icon name="arrowRight" size={16} /></Link>
            </div>
            <div className="accordion faq-list">
              {faqs.map(([q, a]) => (
                <details key={q} className="accordion-item faq">
                  <summary className="accordion-trigger"><span className="grow">{q}</span><Icon name="plus" size={18} className="chev faq-plus" /></summary>
                  <div className="accordion-panel">{a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd).replace(/</g, '\\u003c') }} />
    </>
  );
}
