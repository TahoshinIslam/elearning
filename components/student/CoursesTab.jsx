'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { courseCompletion } from '@/lib/progress';

const PALETTE = ['#E8590C', '#1D4ED8', '#0E9F6E', '#7C3AED'];

function fmtDate(iso, bn) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString(bn ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' });
}

export default function CoursesTab() {
  const router = useRouter();
  const { t, lang, showToast, courses: allCourses, batches, enrollments, submissions, attendance, api, auth } = useApp();
  const STUDENT_ID = auth?.studentId;
  const STUDENT_NAME = auth?.name;
  const bn = lang === 'bn';
  const [openCourse, setOpenCourse] = useState(null);
  const [learning, setLearning] = useState(null); // real per-course watch/completion data, or null while loading
  const [filter, setFilter] = useState('all'); // all | active | completed

  // Real video-progress + certificate data — the whole reason this page no
  // longer shows a fixed 72% quiz bar or a hardcoded weekly schedule.
  useEffect(() => {
    if (!STUDENT_ID) return;
    let cancelled = false;
    fetch('/api/students/me/learning')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (!cancelled) setLearning(data); })
      .catch(() => { if (!cancelled) setLearning([]); });
    return () => { cancelled = true; };
  }, [STUDENT_ID]);

  const learningByCourseId = useMemo(
    () => Object.fromEntries((learning || []).map((l) => [l.courseId, l])),
    [learning]
  );

  // ---------- real enrollment-derived data ----------
  const myEnrollments = enrollments.filter((e) => e.studentId === STUDENT_ID);
  const enrolledBatchIds = new Set(myEnrollments.map((e) => e.batchId));

  const courses = myEnrollments.map((e, i) => {
    const batch = batches.find((b) => b.id === e.batchId);
    const course = allCourses.find((c) => c.id === (e.courseId ?? batch?.courseId));
    const lessonCount = course ? course.modules.reduce((n, m) => n + m.lessons.length, 0) : 0;
    const assignments = course
      ? course.modules.flatMap((m) =>
          m.lessons.filter((l) => l.type === 'assignment').map((l) => ({ lessonId: l.id, title: l.title, moduleTitle: m.title }))
        )
      : [];
    const l = course ? learningByCourseId[course.id] : null;
    // Video-watch completion when the course actually has video lessons;
    // otherwise fall back to the older attendance+assignment measure rather
    // than showing a fake or absent number.
    const attendanceComp = course ? courseCompletion(STUDENT_ID, course, { enrollments, submissions, attendance }) : null;
    const hasVideo = !!l && l.videoLessonCount > 0;
    const completionPct = hasVideo ? l.completionPct : (attendanceComp?.completion ?? null);
    const certified = !!l?.certified;
    return {
      enrollmentId: e.id,
      courseId: course?.id ?? null,
      slug: course?.slug ?? null,
      title: course?.title || batch?.name || '—',
      short: (course?.title || batch?.name || '·').split(/[\s—]+/)[0] || '·',
      c: PALETTE[i % PALETTE.length],
      batch: batch?.name || '',
      moduleCount: course?.modules.length || 0,
      lessonCount,
      assignments,
      live: !!course?.published,
      hasVideo,
      completionPct,
      lastActivityAt: l?.lastActivityAt || null,
      certified,
      certNo: l?.certNo || null,
      attendanceComp
    };
  });

  const isDone = (co) => co.certified || co.completionPct === 100;
  const visibleCourses = courses.filter((co) => (filter === 'active' ? !isDone(co) : filter === 'completed' ? isDone(co) : true));
  const continueCourse = courses
    .filter((co) => co.lastActivityAt && !isDone(co))
    .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt))[0];

  // enrollable = batch linked to a PUBLISHED course the student isn't already
  // in — checked both by batch (live cohort) and by course (a marketplace
  // purchase has no batch at all, so batch-only checks would miss it).
  const myEnrolledCourseIds = new Set(myEnrollments.map((e) => e.courseId).filter(Boolean));
  const available = batches
    .filter((b) => {
      if (b.courseId == null || enrolledBatchIds.has(b.id) || myEnrolledCourseIds.has(b.courseId)) return false;
      const c = allCourses.find((x) => x.id === b.courseId);
      return c && c.published;
    })
    .map((b) => {
      const c = allCourses.find((x) => x.id === b.courseId);
      return { ...b, courseTitle: c?.title || b.name, price: c?.price ?? 0 };
    });

  // Same server-priced order flow as the marketplace checkout — never a bare
  // free enroll call, so a paid course here is actually charged, not skipped.
  const handleEnroll = async (batch) => {
    try {
      const result = await api.createOrder({ courseId: batch.courseId });
      if (result.paid) {
        showToast(bn ? 'সফলভাবে ভর্তি হয়েছেন ✓' : 'Enrolled successfully ✓');
      } else if (result.bkashURL) {
        window.location.href = result.bkashURL;
      }
    } catch {
      showToast(bn ? 'কিছু একটা ভুল হয়েছে' : 'Something went wrong');
    }
  };

  const handleSubmit = async (lessonId, courseId) => {
    await api.submitAssignment({
      lessonId, courseId, studentId: STUDENT_ID,
      studentName: STUDENT_NAME,
      content: bn ? 'জমা দেওয়া হয়েছে (ডেমো)' : 'Submitted (demo)'
    });
    showToast(t.asgSubmitted);
  };

  const ProgressBar = ({ pct, label }) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
        <span>{label}</span><span>{pct}%</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--brand)' }} /></div>
    </div>
  );

  // ---------- course list ----------
  if (openCourse === null || !courses[openCourse]) {
    return (
      <div className="anim-in">
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.myCourses}</div>

        {/* continue learning */}
        {continueCourse && (
          <div className="card" style={{ padding: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderLeft: '4px solid var(--brand)' }}>
            <div style={{ width: 46, height: 46, flex: 'none', borderRadius: 12, background: continueCourse.c, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>
              {continueCourse.short}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-deep)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{bn ? 'চালিয়ে যান' : 'Continue learning'}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>{continueCourse.title}</div>
              {continueCourse.completionPct != null && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{continueCourse.completionPct}% {bn ? 'সম্পন্ন' : 'complete'}</div>
              )}
            </div>
            <button className="btn-primary" style={{ borderRadius: 10, padding: '10px 22px', flex: 'none' }} onClick={() => router.push(`/learn/${continueCourse.slug}`)}>
              ▶ {bn ? 'চালিয়ে যান' : 'Resume'}
            </button>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="card" style={{ padding: 28, textAlign: 'center', color: 'var(--faint)' }}>{t.noEnrollments}</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {['all', 'active', 'completed'].map((k) => (
                <button key={k} className={`pill-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
                  {k === 'all' ? (bn ? 'সব' : 'All') : k === 'active' ? (bn ? 'চলমান' : 'Active') : (bn ? 'সম্পন্ন' : 'Completed')}
                </button>
              ))}
            </div>

            {visibleCourses.length === 0 ? (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--faint)', fontSize: 13.5 }}>
                {bn ? 'এই তালিকায় কোনো কোর্স নেই।' : 'No courses in this list yet.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(250px,100%),1fr))', gap: 14 }}>
                {visibleCourses.map((co) => {
                  const i = courses.indexOf(co);
                  return (
                    <div key={co.enrollmentId} className="card" style={{ overflow: 'hidden' }}>
                      <div style={{ height: 92, background: co.c, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 19, letterSpacing: '.02em' }}>
                        {co.short}
                      </div>
                      <div style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                          {co.batch && <span className="tag chip-stone">{co.batch}</span>}
                          {co.certified ? (
                            <span className="tag chip-green">🏆 {bn ? 'সার্টিফাইড' : 'Certified'}</span>
                          ) : (
                            <span className={`tag ${co.live ? 'chip-green' : 'chip-stone'}`}>{co.live ? t.ongoingChip : t.cbDraft}</span>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>{co.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', margin: '10px 0 10px', fontWeight: 600 }}>
                          {co.moduleCount} {t.cbModules} · {co.lessonCount} {t.cbLessons}
                        </div>

                        {co.completionPct != null ? (
                          <ProgressBar pct={co.completionPct} label={co.hasVideo ? (bn ? 'ভিডিও দেখা হয়েছে' : 'Watched') : (bn ? 'উপস্থিতি ও অ্যাসাইনমেন্ট' : 'Attendance & assignments')} />
                        ) : (
                          <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{bn ? 'এখনো শুরু হয়নি' : 'Not started yet'}</div>
                        )}
                        {co.lastActivityAt && (
                          <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 6 }}>{bn ? 'সর্বশেষ' : 'Last activity'}: {fmtDate(co.lastActivityAt, bn)}</div>
                        )}
                        {co.certified && (
                          <a href={`/verify/${co.certNo}`} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 11.5, color: 'var(--brand-deep)', marginTop: 6, fontWeight: 700, textDecoration: 'underline' }}>
                            {bn ? 'সার্টিফিকেট দেখুন' : 'View certificate'} ↗
                          </a>
                        )}

                        {co.slug && (
                          <button
                            onClick={() => router.push(`/learn/${co.slug}`)}
                            style={{ marginTop: 12, width: '100%', border: 'none', background: 'var(--coal)', color: '#fff', borderRadius: 9, padding: 9, fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit' }}
                          >
                            ▶ {co.lastActivityAt ? (bn ? 'চালিয়ে যান' : 'Resume') : (bn ? 'দেখুন' : 'Watch')}
                          </button>
                        )}
                        <button
                          onClick={() => setOpenCourse(i)}
                          style={{ marginTop: 8, width: '100%', border: '1.5px solid var(--line)', background: 'var(--paper)', borderRadius: 9, padding: 9, fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit' }}
                        >
                          {t.continueCourse} →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* available batches to enroll */}
        <div style={{ fontSize: 18, fontWeight: 700, margin: '28px 0 14px' }}>{t.availableBatches}</div>
        {available.length === 0 ? (
          <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--faint)', fontSize: 13.5 }}>{t.allEnrolled}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(260px,100%),1fr))', gap: 14 }}>
            {available.map((b) => (
              <div key={b.id} className="card" style={{ padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>{b.courseTitle}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>{b.time}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14 }}>
                  <div className="display" style={{ fontWeight: 800, fontSize: 17 }}>{b.price > 0 ? `৳${b.price}` : (bn ? 'ফ্রি' : 'Free')}</div>
                  <button className="btn-primary" style={{ borderRadius: 9, padding: '9px 20px', fontSize: 13 }} onClick={() => handleEnroll(b)}>
                    {t.enroll}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------- course detail: assignments + real progress (curriculum/video lives at /learn) ----------
  const cd = courses[openCourse];

  return (
    <div className="anim-in">
      <button
        onClick={() => setOpenCourse(null)}
        style={{ border: 'none', background: 'none', color: 'var(--muted)', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', padding: 0, marginBottom: 14 }}
      >
        ← {t.backToCourses}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ width: 56, height: 56, flex: 'none', borderRadius: 14, background: cd.c, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>
          {cd.short}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>{cd.title}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {cd.batch && <span className="tag chip-stone">{cd.batch}</span>}
            <span className="tag chip-green">{t.ongoingChip}</span>
          </div>
        </div>
        {cd.slug && (
          <button className="btn-primary" style={{ borderRadius: 10, padding: '10px 20px', flex: 'none' }} onClick={() => router.push(`/learn/${cd.slug}`)}>
            ▶ {bn ? 'প্লেয়ারে যান' : 'Open player'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 264px', gap: 16, alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 12, color: 'var(--ink-soft)' }}>{t.cAssignments}</div>
          {cd.assignments.length === 0 ? (
            <div className="card" style={{ padding: 22, textAlign: 'center', color: 'var(--faint)', fontSize: 13.5 }}>{t.noAssignments}</div>
          ) : cd.assignments.map((a) => {
            const sub = submissions.find((s) => s.lessonId === a.lessonId && s.studentId === STUDENT_ID);
            const graded = sub?.status === 'graded';
            return (
              <div key={a.lessonId} className="card" style={{ borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.4 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{a.moduleTitle}</div>
                  </div>
                  {!sub ? (
                    <button className="btn-primary" style={{ borderRadius: 9, padding: '9px 18px', fontSize: 12.5 }} onClick={() => handleSubmit(a.lessonId, cd.courseId)}>
                      {t.submit}
                    </button>
                  ) : graded ? (
                    <span className="chip chip-green" style={{ padding: '6px 14px', fontSize: 12 }}>✓ {sub.marks}/{sub.maxMarks}</span>
                  ) : (
                    <span className="chip chip-orange" style={{ padding: '6px 14px', fontSize: 12 }}>✓ {t.submitted} · {t.gradingPending}</span>
                  )}
                </div>
                {graded && sub.feedback && (
                  <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--ink-soft)', background: 'var(--paper)', borderRadius: 10, padding: '10px 12px', lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 700 }}>{t.yourFeedback}:</span> {sub.feedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* progress rail — real numbers only */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>{t.totalProgress}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '4px 0 16px' }}>
            <span className="display" style={{ fontSize: 34, color: 'var(--brand)' }}>{cd.completionPct ?? 0}%</span>
            <span style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 600 }}>{t.completion}</span>
          </div>
          {cd.hasVideo ? (
            <ProgressBar pct={cd.completionPct} label={bn ? 'ভিডিও দেখা হয়েছে' : 'Video watched'} />
          ) : (
            <>
              <div style={{ marginBottom: 13 }}><ProgressBar pct={cd.attendanceComp?.assignmentRate ?? 0} label={t.cAssignments} /></div>
              <ProgressBar pct={cd.attendanceComp?.attendanceRate ?? 0} label={t.attendance} />
            </>
          )}
          {cd.certified ? (
            <a
              href={`/verify/${cd.certNo}`} target="_blank" rel="noreferrer"
              style={{ display: 'block', textAlign: 'center', marginTop: 18, borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, background: 'var(--green-chip-bg)', color: 'var(--green-chip-fg)', textDecoration: 'none' }}
            >
              🏆 {bn ? 'সার্টিফিকেট দেখুন' : 'View certificate'} ↗
            </a>
          ) : (
            <div style={{ marginTop: 18, fontSize: 11.5, color: 'var(--faint)', textAlign: 'center' }}>
              {bn ? 'কোর্স সম্পন্ন হলে সার্টিফিকেট দেখা যাবে।' : 'A certificate appears here once the course is complete.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
