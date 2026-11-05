import Link from 'next/link';
import TrackView from '@/components/TrackView';
import { notFound } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import CourseCover from '@/components/ui/CourseCover';
import CourseCard from '@/components/ui/CourseCard';
import Rating from '@/components/ui/Rating';
import Price from '@/components/ui/Price';
import Icon from '@/components/Icon';
import ReviewForm from '@/components/ReviewForm';
import CourseBadges from '@/components/ui/CourseBadges';
import WaitlistForm from '@/components/course/WaitlistForm';
import PreviewProvider, { PreviewMediaButton } from '@/components/course/PreviewProvider';
import Curriculum from '@/components/course/Curriculum';
import { PurchaseActions, MobileBuyBar } from '@/components/course/PurchasePanel';
import { getPublicCourse, getRelatedCourses, getViewerCourseState, getOwnedCourseIds, getCompletedLessonIds } from '@/lib/catalogRepo';
import { currentSession } from '@/lib/auth';
import { getCopy } from '@/lib/lang';
import { copy, num, duration, dateLabel } from '@/lib/copy';
import { categoryLabel } from '@/lib/categoryLabel';
import { abs } from '@/lib/seo';


export async function generateMetadata(props) {
  const params = await props.params;
  const course = await getPublicCourse(params.slug);
  const { lang } = await getCopy();
  if (!course) return { title: copy(lang).unavailableT, robots: { index: false } };
  const description = (course.tagline || course.description || '').slice(0, 180);
  const url = abs(`/course/${course.slug}`);
  return {
    title: course.title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title: course.title, description, images: course.thumbnailUrl ? [{ url: abs(course.thumbnailUrl) }] : undefined }
  };
}

export default async function CoursePage(props) {
  const params = await props.params;
  const { lang, c } = await getCopy();
  const course = await getPublicCourse(params.slug);
  if (!course) notFound();
  const session = await currentSession();
  const [state, related, owned, completedIds] = await Promise.all([
    getViewerCourseState(session, course.id), getRelatedCourses(course, 4), getOwnedCourseIds(session), getCompletedLessonIds(session, course.id)
  ]);
  const isOwner = state.status === 'enrolled';
  const upcoming = state.status === 'upcoming';
  const social = course.free ? course.enrollmentCount : course.purchaseCount;
  const offerText = course.offer ? (course.offer.type === 'percent' ? `${num(lang, course.offer.value)}%` : `৳${num(lang, course.offer.value)}`) : null;
  const catLabel = categoryLabel(lang, course.category, course.categoryName);
  const totalSeconds = course.modules.reduce((s, m) => s + m.durationSeconds, 0);
  const previewCount = course.previewLessons.length;

  const ld = {
    '@context': 'https://schema.org', '@type': 'Course', name: course.title,
    description: course.tagline || course.description?.slice(0, 300) || course.title,
    url: abs(`/course/${course.slug}`), inLanguage: course.language === 'English' ? 'en' : 'bn',
    provider: { '@type': 'Organization', name: 'Leo Learning', url: abs('/') },
    ...(upcoming ? {} : { offers: { '@type': 'Offer', category: course.price ? 'Paid' : 'Free', price: course.price, priceCurrency: 'BDT', availability: 'https://schema.org/InStock', url: abs(`/course/${course.slug}`) } }),
    ...(course.rating != null && course.reviewCount ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: course.rating, reviewCount: course.reviewCount } } : {}),
    ...(course.instructorProfile ? { instructor: { '@type': 'Person', name: course.instructorProfile.name } } : {})
  };

  const includes = [
    course.lessonCount > 0 && ['list', c.incLessons(course.lessonCount)],
    totalSeconds > 0 && ['video', c.incVideo(duration(lang, totalSeconds))],
    previewCount > 0 && ['eye', c.incPreview(previewCount)],
    ['phone', c.incDevices],
    ['refresh', c.incProgress],
    ['award', c.incCert]
  ].filter(Boolean);

  return (
    <PreviewProvider courseTitle={course.title} previews={course.previewLessons} lang={lang}>
      <SiteNav />
      <TrackView type="course_view" refId={course.id} category={course.category} />
      <main id="main" className={isOwner || upcoming ? '' : 'has-buy-bar'}>
        <section className="course-hero on-dark">
          <div className="container">
            <nav aria-label="Breadcrumb">
              <ol className="crumbs" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li><Link href="/">{c.home}</Link></li>
                <li aria-hidden="true"><Icon name="chevronRight" size={14} /></li>
                <li><Link href="/courses">{c.navCourses}</Link></li>
                {course.category && <>
                  <li aria-hidden="true"><Icon name="chevronRight" size={14} /></li>
                  <li><Link href={`/courses?category=${encodeURIComponent(course.category)}`}>{catLabel}</Link></li>
                </>}
              </ol>
            </nav>
            <div className="course-layout" style={{ marginTop: 0 }}>
              <div>
                <CourseBadges badges={course.badges} lang={lang} className="hero-badges" />
                <h1>{course.title}</h1>
                {course.tagline && <p className="lead">{course.tagline}</p>}
                <div className="meta">
                  {upcoming ? null : course.rating != null && course.reviewCount > 0
                    ? <a href="#rev-h" className="hero-rating"><Rating value={course.rating} count={course.reviewCount} lang={lang} countLabel={c.reviewsN(course.reviewCount)} /></a>
                    : <span><Icon name="star" size={16} />{c.noReviewsYet}</span>}
                  {!upcoming && social > 0 && <span><Icon name="users" size={16} />{course.free ? c.studentsN(social) : c.purchasersN(social)}</span>}
                  {upcoming && <span><Icon name="clock" size={16} />{course.releaseDate ? c.releaseOn(dateLabel(lang, course.releaseDate)) : c.tba}</span>}
                  {course.className && <span><Icon name="book" size={16} /><Link className="link" style={{ color: '#FFD84D' }} href={`/courses?class=${encodeURIComponent(course.classSlug)}`}>{course.className}</Link></span>}
                  {course.instructor && <span><Icon name="user" size={16} />{course.instructorProfile ? <Link className="link" style={{ color: '#FFD84D' }} href={`/instructor/${course.instructorProfile.id}`}>{course.instructor}</Link> : course.instructor}</span>}
                  {course.language && <span><Icon name="language" size={16} />{course.language}</span>}
                  {course.level && course.level !== course.className && <span><Icon name="bar" size={16} />{course.level}</span>}
                  {course.updatedAt && <span><Icon name="clock" size={16} />{c.updated} {dateLabel(lang, course.updatedAt)}</span>}
                </div>
              </div>
              <div aria-hidden="true" />
            </div>
          </div>
        </section>

        <div className="container" style={{ paddingTop: 28 }}>
          <div className="course-layout">
            <div className="stack course-main" style={{ '--gap': '40px', minWidth: 0 }}>
              {course.whatYouLearn.length > 0 && (
                <section aria-labelledby="learn-h" className="surface">
                  <h2 id="learn-h" className="h3" style={{ padding: '22px 24px 0' }}>{c.whatLearn}</h2>
                  <ul className="outcomes" style={{ margin: 0 }}>
                    {course.whatYouLearn.map((w) => <li key={w}><Icon name="check" size={17} />{w}</li>)}
                  </ul>
                </section>
              )}

              {!upcoming && (
                <section aria-labelledby="cur-h">
                  <h2 id="cur-h" className="h2" style={{ marginBottom: 12 }}>{c.curriculum}</h2>
                  <Curriculum modules={course.modules} lang={lang} owned={isOwner} slug={course.slug} completedIds={completedIds} totalSeconds={totalSeconds} lessonCount={course.lessonCount} />
                </section>
              )}

              {course.requirements.length > 0 && (
                <section aria-labelledby="req-h">
                  <h2 id="req-h" className="h3" style={{ marginBottom: 12 }}>{c.requirements}</h2>
                  <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--ink-2)', lineHeight: 1.9 }}>{course.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
                </section>
              )}

              {course.audience.length > 0 && (
                <section aria-labelledby="aud-h">
                  <h2 id="aud-h" className="h3" style={{ marginBottom: 12 }}>{c.audience}</h2>
                  <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--ink-2)', lineHeight: 1.9 }}>{course.audience.map((r) => <li key={r}>{r}</li>)}</ul>
                </section>
              )}

              {course.description && (
                <section aria-labelledby="desc-h">
                  <h2 id="desc-h" className="h3" style={{ marginBottom: 12 }}>{c.description}</h2>
                  <div className="prose">{course.description}</div>
                </section>
              )}

              {course.instructorProfile && (
                <section aria-labelledby="inst-h">
                  <h2 id="inst-h" className="h3" style={{ marginBottom: 14 }}>{c.instructor}</h2>
                  <div className="instructor-card">
                    <span className="instructor-avatar" aria-hidden="true">{course.instructorProfile.name.charAt(0)}</span>
                    <div className="stack" style={{ '--gap': '6px' }}>
                      <Link href={`/instructor/${course.instructorProfile.id}`} className="h4 link" style={{ textDecoration: 'none', color: 'var(--ink)' }}>{course.instructorProfile.name}</Link>
                      {course.instructorProfile.title && <p className="small muted">{course.instructorProfile.title}</p>}
                      <p className="small muted">{c.coursesN(course.instructorProfile.courseCount)}{course.instructorProfile.learnerCount > 0 ? ` · ${c.studentsN(course.instructorProfile.learnerCount)}` : ''}</p>
                      {course.instructorProfile.bio && <p className="prose small" style={{ marginTop: 6 }}>{course.instructorProfile.bio}</p>}
                    </div>
                  </div>
                </section>
              )}

              {!upcoming && <section aria-labelledby="rev-h">
                <h2 id="rev-h" className="h3" style={{ marginBottom: 6 }}>{c.reviews}</h2>
                <p className="small muted" style={{ marginBottom: 14 }}>{c.verifiedReviewNote}</p>
                {course.reviewCount > 0 && course.rating != null && (
                  <div className="rating-summary surface surface-pad">
                    <div className="rating-big"><strong className="tabular">{num(lang, course.rating.toFixed(1))}</strong><Rating value={course.rating} count={course.reviewCount} lang={lang} showCount={false} /><span className="small muted">{c.reviewsN(course.reviewCount)}</span></div>
                    <ul className="rating-bars" aria-label={c.ratingBreakdown}>
                      {course.ratingBreakdown.map((b) => (
                        <li key={b.stars}><span className="tabular">{num(lang, b.stars)}★</span><span className="bar" aria-hidden="true"><span style={{ width: `${course.reviewCount ? Math.round((b.count / course.reviewCount) * 100) : 0}%` }} /></span><span className="tabular small muted">{num(lang, b.count)}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                {course.reviews.length ? (
                  <ul className="grid-cards" style={{ listStyle: 'none', padding: 0, margin: 0, gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))' }}>
                    {course.reviews.map((r) => (
                      <li key={r.id} className="surface review-card stack" style={{ '--gap': '8px' }}>
                        <Rating value={r.rating} count={1} lang={lang} showCount={false} />
                        {r.text && <p style={{ color: 'var(--ink-2)' }}>{r.text}</p>}
                        <p className="small strong">{r.name} <span className="muted" style={{ fontWeight: 400 }}>· {dateLabel(lang, r.createdAt)}</span></p>
                        {r.verifiedPurchase && <p className="xsmall row" style={{ '--gap': '4px', color: 'var(--success)' }}><Icon name="checkCircle" size={13} />{c.verifiedBuyer}</p>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="muted">{c.noReviews}</p>}
                {isOwner && <div style={{ marginTop: 16 }}><ReviewForm courseId={course.id} /></div>}
              </section>}

              {course.faqs.length > 0 && (
                <section aria-labelledby="faq-h">
                  <h2 id="faq-h" className="h3" style={{ marginBottom: 12 }}>{c.courseFaq}</h2>
                  <div className="accordion">
                    {course.faqs.map((f) => (
                      <details key={f.q} className="accordion-item faq">
                        <summary className="accordion-trigger"><Icon name="chevronDown" size={18} className="chev" /><span className="grow">{f.q}</span></summary>
                        <div className="accordion-panel">{f.a}</div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="buy-col" aria-label={c.buyNow}>
              <div className="buy-card">
                <PreviewMediaButton label={previewCount ? c.previewCourse : course.title}>
                  <CourseCover id={course.id} title={course.title} category={course.category} kicker={catLabel} thumbnailUrl={course.thumbnailUrl} priority />
                </PreviewMediaButton>
                <div className="buy-card-body">
                  {upcoming && (
                    <div className="stack" style={{ '--gap': '6px' }}>
                      <span className="badge badge-info" style={{ alignSelf: 'flex-start' }}><Icon name="clock" size={12} />{c.upcomingT}</span>
                      <p className="h4">{course.releaseDate ? c.releaseOn(dateLabel(lang, course.releaseDate)) : c.tba}</p>
                      <p className="small muted">{c.notifyNote}</p>
                    </div>
                  )}
                  {!upcoming && state.status !== 'enrolled' && state.status !== 'staff' && (
                    <div className="stack" style={{ '--gap': '4px' }}>
                      <Price price={course.price} listPrice={course.listPrice} lang={lang} freeLabel={c.free} className="buy-price" />
                      {course.offer && <p className="small row" style={{ '--gap': '6px', flexWrap: 'wrap' }}><span className="badge badge-brand">{c.offerSave(offerText)}</span>{course.offer.endsAt && <span className="muted">{c.offerEnds(dateLabel(lang, course.offer.endsAt))}</span>}</p>}
                    </div>
                  )}
                  {isOwner && state.completionPct != null && (
                    <div className="stack" style={{ '--gap': '6px' }}>
                      <div className="progress" role="progressbar" aria-valuenow={state.completionPct} aria-valuemin={0} aria-valuemax={100} aria-label={c.percentDone(state.completionPct)}><span style={{ width: `${state.completionPct}%` }} /></div>
                      <span className="small muted">{c.percentDone(state.completionPct)}</span>
                    </div>
                  )}
                  {upcoming
                    ? <WaitlistForm courseId={course.id} lang={lang} signedInEmail={session?.email || null} />
                    : <PurchaseActions course={{ id: course.id, slug: course.slug, title: course.title, price: course.price, instructor: course.instructor }} state={state} lang={lang} />}
                  {!upcoming && <ul className="include-list">
                    {includes.map(([icon, text]) => <li key={text}><Icon name={icon} size={16} />{text}</li>)}
                  </ul>}
                  {!upcoming && !isOwner && state.status !== 'staff' && (
                    <div className="small muted stack" style={{ '--gap': '6px', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <p className="row" style={{ alignItems: 'flex-start', '--gap': '8px' }}><Icon name="shield" size={15} style={{ marginTop: 3 }} />{c.accessNote}</p>
                      {course.price > 0 && <p className="row" style={{ alignItems: 'flex-start', '--gap': '8px' }}><Icon name="receipt" size={15} style={{ marginTop: 3 }} /><span>{c.refundNote} <Link href="/terms#refund" className="link">{c.refundPolicy}</Link></span></p>}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>

          {related.length > 0 && (
            <section className="section" aria-labelledby="rel-h">
              <h2 id="rel-h" className="h2" style={{ marginBottom: 20 }}>{c.related}</h2>
              <div className="grid-cards">
                {related.map((rc) => <CourseCard key={rc.id} course={rc} lang={lang} owned={owned.has(rc.id)} categoryLabel={categoryLabel(lang, rc.category, rc.categoryName)} />)}
              </div>
            </section>
          )}
        </div>
      </main>
      {!isOwner && !upcoming && state.status !== 'staff' && <MobileBuyBar course={{ id: course.id, slug: course.slug, title: course.title, price: course.price, instructor: course.instructor }} state={state} lang={lang} />}
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </PreviewProvider>
  );
}
