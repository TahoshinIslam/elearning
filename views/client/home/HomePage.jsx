import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import CourseCard from '@/components/ui/CourseCard';
import CourseCover, { toneFor } from '@/components/ui/CourseCover';
import Icon from '@/components/Icon';
import Reveal from '@/components/ui/Reveal';
import PromoCarousel from '@/components/home/PromoCarousel';
import { getFeaturedCourses, getPopularCourses, getCatalogFacets, getPlatformStats, getOwnedCourseIds, getFeaturedInstructors, catalogContext } from '@/lib/catalogRepo';
import { getHomeSections, listPublicSections } from '@/lib/sectionRepo';
import { getActiveCampaigns } from '@/lib/campaignRepo';
import { getHomepage } from '@/lib/homepageRepo';
import { currentSession } from '@/lib/auth';
import { getCopy } from '@/lib/lang';
import { num, taka } from '@/lib/copy';
import { categoryLabel } from '@/lib/categoryLabel';
import { abs } from '@/lib/seo';

export const metadata = { alternates: { canonical: abs('/') } };

export default async function HomePage() {
  const { lang, c } = await getCopy();
  const session = await currentSession();
  const ctx = await catalogContext();
  const [featured, popular, stats, owned, instructors, cms, slides, homeSections, allSections] = await Promise.all([
    getFeaturedCourses(5, ctx), getPopularCourses(8, ctx), getPlatformStats(), getOwnedCourseIds(session), getFeaturedInstructors(8),
    getHomepage().catch(() => ({})), getActiveCampaigns({ kind: 'slide', page: 'home', session }).catch(() => []),
    getHomeSections(), listPublicSections()
  ]);
  // Quick filters for each home section: the classes and subjects its courses cover.
  const sectionFacets = await Promise.all(homeSections.map((sec) => getCatalogFacets({ section: sec.slug })));
  const en = lang === 'en';
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
  const mosaic = [...featured, ...popular].filter((x, i, all) => all.findIndex((y) => y.id === x.id) === i).slice(0, 3);
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
              {allSections.length > 0 && (
                <ul className="hero-chips" style={{ '--i': 1 }} aria-label={c.catalogTitle}>
                  {allSections.slice(0, 6).map((sec) => (
                    <li key={sec.slug}><Link href={`/courses?section=${sec.slug}`} className="chip-link" style={{ '--tone': `var(--c-${sec.tone})` }}><Icon name={sec.icon} size={15} />{en ? sec.nameEn : sec.nameBn}</Link></li>
                  ))}
                </ul>
              )}
              <div className="cluster" style={{ '--gap': '12px', '--i': 3 }}>
                <Link href="/courses" className="btn btn-primary btn-lg">{c.heroBrowse}<Icon name="arrowRight" size={18} /></Link>
                <Link href="/courses?price=free" className="btn btn-secondary btn-lg">{c.heroFree}</Link>
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

        {allSections.length > 0 && (
          <div className="ticker" aria-hidden="true">
            <div className="ticker-track">
              {[0, 1].map((k) => (
                <div key={k} style={{ display: 'flex' }}>
                  {[...allSections.map((sec) => (en ? sec.nameEn : sec.nameBn)), ...statItems.map(([n, l]) => `${num(lang, n)} ${l}`)].concat(allSections.length < 5 ? allSections.map((sec) => (en ? sec.nameEn : sec.nameBn)) : []).map((t, i) => <span key={`${k}-${i}`}>{t}</span>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {carousel.length > 0 && (
          <div className="container-wide promo-section"><PromoCarousel slides={carousel} lang={lang} /></div>
        )}

        {homeSections.map((sec, si) => {
          const f = sectionFacets[si];
          const title = en ? sec.nameEn : sec.nameBn;
          const badge = en ? sec.badgeEn : sec.badgeBn;
          const chips = [
            ...f.classes.map((x) => ({ href: `/courses?section=${sec.slug}&class=${encodeURIComponent(x.value)}`, label: x.name, n: x.count })),
            ...(f.classes.length ? [] : f.categories.map((x) => ({ href: `/courses?section=${sec.slug}&category=${encodeURIComponent(x.value)}`, label: categoryLabel(lang, x.value, x.name), n: x.count })))
          ].slice(0, 10);
          return (
            <section key={sec.slug} className={`home-section home-sec tone-${sec.tone} ${si % 2 ? 'home-section-soft' : ''}`} style={{ '--tone': `var(--c-${sec.tone})`, '--tone-2': `var(--c-${sec.tone}-2, var(--c-${sec.tone}))` }} aria-labelledby={`sec-${sec.slug}`}>
              <Reveal className="container-wide">
                <div className="home-head">
                  <div className="home-head-text">
                    <span className="home-head-icon tone" aria-hidden="true"><Icon name={sec.icon} size={22} /></span>
                    <div>
                      <h2 id={`sec-${sec.slug}`} className="h2">{title}{badge && <span className="home-sec-badge">{badge}</span>}</h2>
                      {(en ? sec.blurbEn : sec.blurbBn) && <p>{en ? sec.blurbEn : sec.blurbBn}</p>}
                    </div>
                  </div>
                  <Link href={`/courses?section=${sec.slug}`} className="btn btn-sm home-viewall">{c.viewAll}<Icon name="arrowRight" size={16} /></Link>
                </div>
                {chips.length > 1 && (
                  <ul className="home-sec-chips" aria-label={title}>
                    {chips.map((ch) => <li key={ch.href}><Link href={ch.href} className="chip-link">{ch.label}<span className="count">{num(lang, ch.n)}</span></Link></li>)}
                  </ul>
                )}
                {grid(sec.courses, si === 0)}
              </Reveal>
            </section>
          );
        })}

        {!homeSections.length && (featured.length > 0 || popular.length > 0) && (
          <section className="home-section" aria-labelledby="featured-title">
            <Reveal className="container-wide">
              {sectionHead('featured-title', c.featuredTitle, c.featuredSub, '/courses?sort=popular', 'star')}
              {grid(featured.length ? featured : popular, true)}
            </Reveal>
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
