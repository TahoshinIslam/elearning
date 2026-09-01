'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';
import CheckoutModal from '@/components/CheckoutModal';
import ReviewForm from '@/components/ReviewForm';
import LessonQAModal from '@/components/LessonQAModal';
import { modeLabel, modeChip } from '@/lib/catalog';

const LESSON_ICON = { video: '▶', pdf: '📄', quiz: '❓', assignment: '✍' };

function Stars({ rating }) {
  const full = Math.round(rating || 0);
  return <span style={{ color: '#f59e0b', letterSpacing: 1 }}>{'★'.repeat(full)}<span style={{ color: 'var(--line)' }}>{'★'.repeat(5 - full)}</span></span>;
}

function CourseDetails() {
  const { slug } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const { t, lang, loaded, auth, courses, batches, enrollments, showToast, api, wishlist, toggleWishlist } = useApp();
  const STUDENT_ID = auth?.studentId;
  const STUDENT_NAME = auth?.name;
  const [openFaq, setOpenFaq] = useState(null);
  const [checkout, setCheckout] = useState(false);
  const [qaLesson, setQaLesson] = useState(null);
  const enrollTriedRef = useRef(false);

  const course = loaded ? courses.find((c) => c.slug === slug) : null;

  // return-URL flow: guest clicks Enroll → login → returns here with ?enroll=1 → auto-complete enrollment
  useEffect(() => {
    if (!loaded || !course || search.get('enroll') !== '1' || auth?.role !== 'student') return;
    if (enrollTriedRef.current) return;
    enrollTriedRef.current = true;
    const already = enrollments.some((e) => e.studentId === STUDENT_ID && e.courseId === course.id);
    if (already) { router.replace('/student'); return; }
    if (!batches.find((b) => b.courseId === course.id)) { showToast(t.cdNoBatch); return; }
    setCheckout(true); // return-to-checkout: land back here and complete enrollment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, course, auth, search]);

  if (!loaded) {
    return (<><SiteNav /><div style={{ maxWidth: 1280, margin: '60px auto', textAlign: 'center', color: 'var(--faint)' }}>…</div></>);
  }

  if (!course || !course.published) {
    return (
      <>
        <SiteNav />
        <div style={{ maxWidth: 700, margin: '80px auto', textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 40 }}>🔍</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 10 }}>{t.cdNotFound}</div>
          <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => router.push('/landing')}>{t.backToSite}</button>
        </div>
      </>
    );
  }

  const enrolledCount = enrollments.filter((e) => e.courseId === course.id).length;
  const courseBatches = batches.filter((b) => b.courseId === course.id);
  const isEnrolled = auth?.role === 'student' && enrollments.some((e) => e.studentId === STUDENT_ID && e.courseId === course.id);
  const free = course.price === 0;
  const discount = course.oldPrice && course.price ? Math.round((1 - course.price / course.oldPrice) * 100) : 0;
  const related = courses.filter((c) => c.published && c.id !== course.id);

  const onEnroll = () => {
    if (!auth) {
      const returnTo = encodeURIComponent(`/course/${course.slug}?enroll=1`);
      router.push(`/login?role=student&returnTo=${returnTo}`);
      return;
    }
    if (auth.role !== 'student') { showToast(t.roleStudent); return; }
    if (!courseBatches[0]) { showToast(t.cdNoBatch); return; }
    setCheckout(true);
  };

  // called by CheckoutModal after free-confirm or successful payment
  const confirmEnroll = async (couponCode) => {
    const batch = courseBatches[0];
    // Payment Service: record a transaction only for paid courses.
    // The coupon (if any) is applied + redeemed server-side; amount here is the pre-discount price.
    if (course.price > 0) {
      try {
        await api.recordPayment({
          studentId: STUDENT_ID, studentName: STUDENT_NAME,
          courseId: course.id, batchId: batch.id, amount: course.price, method: 'bkash', type: 'enrollment',
          ...(couponCode ? { couponCode } : {}),
          ...(search.get('aff') ? { affiliateCode: search.get('aff') } : {})
        });
      } catch { /* ignore */ }
    }
    try { await api.enroll(STUDENT_ID, batch.id); } catch { /* already enrolled */ }
    showToast(t.enrolledToastCourse);
    setCheckout(false);
    router.push('/student');
  };

  const lessonClick = (l) => showToast(l.free ? t.cdPreviewToast : t.cdLockedToast);

  const section = { fontSize: 19, fontWeight: 700, margin: '0 0 14px' };

  return (
    <>
      <SiteNav />
      <div className="anim-in" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 20px 80px' }}>
        <button onClick={() => router.push('/landing')} style={{ border: 'none', background: 'none', color: 'var(--muted)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: 0, marginBottom: 14 }}>
          ← {t.navAllCourses}
        </button>

        {/* header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 28, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {course.mode && <span className={`tag ${modeChip(course.mode)}`}>{modeLabel(t, course.mode)}</span>}
              <span className="tag chip-stone">{course.level}</span>
              <span className="tag chip-orange">{course.language}</span>
            </div>
            <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(24px,3.4vw,34px)', lineHeight: 1.2, fontWeight: 700 }}>{course.title}</h1>
            <p style={{ margin: '0 0 12px', color: 'var(--ink-soft)', fontSize: 15.5, lineHeight: 1.6 }}>{course.tagline}</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', fontSize: 13.5, color: 'var(--muted)' }}>
              <span><Stars rating={course.rating} /> <b style={{ color: 'var(--coal)' }}>{course.rating}</b> ({course.ratingCount})</span>
              <span>👥 {enrolledCount} {t.cdEnrolledN}</span>
              <span>👩‍🏫 {t.cdInstructor}: {course.instructorId ? (
                <button onClick={() => router.push(`/instructor/${course.instructorId}`)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 700, color: 'var(--brand-deep)', padding: 0, textDecoration: 'underline' }}>{course.instructor}</button>
              ) : <b style={{ color: 'var(--ink-soft)' }}>{course.instructor}</b>}</span>
            </div>

            {/* what you'll learn */}
            {course.whatYouLearn?.length > 0 && (
              <div className="panel" style={{ padding: 20, marginTop: 22 }}>
                <h2 style={section}>{t.cdWhatLearn}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: 10 }}>
                  {course.whatYouLearn.map((w, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13.5, lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--green)' }}>✓</span> {w}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* description */}
            <div style={{ marginTop: 26 }}>
              <h2 style={section}>{t.cdDescription}</h2>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: 'var(--ink-soft)' }}>{course.description}</p>
            </div>

            {/* requirements */}
            {course.requirements?.length > 0 && (
              <div style={{ marginTop: 26 }}>
                <h2 style={section}>{t.cdRequirements}</h2>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.9, color: 'var(--ink-soft)' }}>
                  {course.requirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {/* curriculum + free-preview playlist */}
            <div style={{ marginTop: 26 }}>
              <h2 style={section}>{t.cdCurriculum}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {course.modules.map((m) => (
                  <div key={m.id} className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, background: 'var(--paper)', borderBottom: '1px solid var(--line-soft)' }}>{m.title}</div>
                    {m.lessons.map((l) => (
                      <div key={l.id} className="row-line" style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          onClick={() => lessonClick(l)}
                          style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', border: 'none', background: 'none', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                        >
                          <span style={{ width: 18, textAlign: 'center', fontSize: 12, color: l.free ? 'var(--brand)' : 'var(--faint)' }}>{l.free ? LESSON_ICON[l.type] || '▶' : '🔒'}</span>
                          <span style={{ flex: 1, fontSize: 13.5, minWidth: 0, color: l.free ? 'var(--coal)' : 'var(--muted)' }}>{l.title}</span>
                          {l.duration && <span style={{ fontSize: 12, color: 'var(--faint)' }}>{l.duration}</span>}
                          {l.free && <span className="tag chip-green" style={{ flex: 'none' }}>{t.cdPreviewTag}</span>}
                        </button>
                        <button onClick={() => setQaLesson(l)} title={t.qa} aria-label="Q&A"
                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 14px', fontSize: 15, color: 'var(--muted)' }}>💬</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            {course.faqs?.length > 0 && (
              <div style={{ marginTop: 26 }}>
                <h2 style={section}>{t.cdFaq}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {course.faqs.map((f, i) => (
                    <div key={i} className="card" style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontWeight: 600, fontSize: 14 }}>
                        <span>{f.q}</span><span style={{ color: 'var(--faint)' }}>{openFaq === i ? '−' : '+'}</span>
                      </div>
                      {openFaq === i && <div style={{ marginTop: 8, fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{f.a}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* reviews */}
            {(course.reviews?.length > 0 || isEnrolled) && (
              <div style={{ marginTop: 26 }}>
                <h2 style={section}>{t.cdReviews}</h2>
                {course.reviews?.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap: 12 }}>
                    {course.reviews.map((r, i) => (
                      <div key={i} className="card" style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Stars rating={r.rating} />
                          {r.featured && <span className="tag chip-orange" style={{ fontSize: 10.5 }}>★ {t.reviewFeatured}</span>}
                        </div>
                        <div style={{ fontSize: 13.5, lineHeight: 1.65, color: '#44403c', margin: '8px 0 10px' }}>&ldquo;{r.text}&rdquo;</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{r.name}</div>
                      </div>
                    ))}
                  </div>
                )}
                {/* enrolled students can leave a review */}
                {isEnrolled && <ReviewForm courseId={course.id} />}
              </div>
            )}
          </div>

          {/* sticky purchase sidebar */}
          <div style={{ position: 'sticky', top: 70 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="placeholder-art" style={{ height: 150, fontSize: 12 }}>{course.thumb || 'course'} · banner</div>
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span className="display" style={{ fontSize: 28 }}>{free ? t.cdFree : `৳${course.price}`}</span>
                  {!free && course.oldPrice && <span style={{ fontSize: 14, color: 'var(--faint)', textDecoration: 'line-through' }}>৳{course.oldPrice}</span>}
                  {discount > 0 && <span className="tag chip-green">{discount}% {t.cdOff}</span>}
                </div>
                {!free && <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>/{t.month}</div>}

                {isEnrolled ? (
                  <>
                    <div className="chip chip-green" style={{ marginTop: 14, width: '100%', justifyContent: 'center', display: 'flex' }}>{t.cdEnrolledChip}</div>
                    <button className="btn-dark" style={{ width: '100%', marginTop: 10, borderRadius: 11, padding: 12 }} onClick={() => router.push('/student')}>{t.continueCourse} →</button>
                  </>
                ) : (
                  <button className="btn-primary" style={{ width: '100%', marginTop: 14, padding: 13, fontSize: 15 }} onClick={onEnroll}>
                    {free ? t.cdEnrollFree : t.cdEnrollNow}
                  </button>
                )}

                {/* wishlist (logged-in students, not yet enrolled) */}
                {auth?.role === 'student' && !isEnrolled && (
                  <button
                    onClick={() => toggleWishlist(course.id)}
                    style={{
                      width: '100%', marginTop: 10, padding: 11, borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 13.5, fontWeight: 700, background: 'var(--paper)',
                      border: wishlist.includes(course.id) ? '1.5px solid var(--brand)' : '1.5px solid var(--line)',
                      color: wishlist.includes(course.id) ? 'var(--brand-deep)' : 'var(--ink-soft)'
                    }}
                  >
                    {wishlist.includes(course.id) ? `${t.wishlistSaved}` : `♡ ${t.wishlistSave}`}
                  </button>
                )}

                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13, color: 'var(--ink-soft)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t.cdLevel}</span><b>{course.level}</b></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t.cdDuration}</span><b>{course.duration}</b></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t.cdLanguage}</span><b>{course.language}</b></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t.cdInstructor}</span><b>{course.instructor}</b></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* related courses */}
        {related.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={section}>{t.cdRelated}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(240px,100%),1fr))', gap: 14 }}>
              {related.map((rc) => (
                <button key={rc.id} className="card" onClick={() => router.push(`/course/${rc.slug}`)} style={{ overflow: 'hidden', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                  <div className="placeholder-art" style={{ height: 100, fontSize: 11 }}>{rc.thumb}</div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35 }}>{rc.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>{rc.price ? `৳${rc.price}` : t.cdFree} · <Stars rating={rc.rating} /></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {checkout && (
        <CheckoutModal course={course} batch={courseBatches[0]} t={t} onClose={() => setCheckout(false)} onConfirm={confirmEnroll} />
      )}

      {qaLesson && <LessonQAModal lesson={qaLesson} onClose={() => setQaLesson(null)} />}
    </>
  );
}

export default function CourseDetailsPage() {
  return (
    <Suspense fallback={<SiteNav />}>
      <CourseDetails />
    </Suspense>
  );
}
