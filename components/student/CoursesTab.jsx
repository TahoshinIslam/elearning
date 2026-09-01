'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { courseCompletion } from '@/lib/progress';

const PALETTE = ['#E8590C', '#1D4ED8', '#0E9F6E', '#7C3AED'];

export default function CoursesTab() {
  const { t, lang, showToast, courses: allCourses, batches, enrollments, submissions, attendance, api, auth } = useApp();
  const STUDENT_ID = auth?.studentId;
  const STUDENT_NAME = auth?.name;
  const bn = lang === 'bn';
  const [openCourse, setOpenCourse] = useState(null);
  const [courseTab, setCourseTab] = useState('modules');

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
    return {
      enrollmentId: e.id,
      courseId: course?.id ?? null,
      title: course?.title || batch?.name || '—',
      short: (course?.title || batch?.name || '·').split(/[\s—]+/)[0] || '·',
      c: PALETTE[i % PALETTE.length],
      batch: batch?.name || '',
      moduleCount: course?.modules.length || 0,
      lessonCount,
      assignments,
      live: !!course?.published
    };
  });

  // enrollable = batch linked to a PUBLISHED course that the student isn't already in
  const available = batches
    .filter((b) => {
      if (b.courseId == null || enrolledBatchIds.has(b.id)) return false;
      const c = allCourses.find((x) => x.id === b.courseId);
      return c && c.published;
    })
    .map((b) => ({ ...b, courseTitle: allCourses.find((c) => c.id === b.courseId)?.title || b.name }));

  const handleEnroll = async (batch) => {
    await api.enroll(STUDENT_ID, batch.id);
    showToast(bn ? 'সফলভাবে ভর্তি হয়েছেন ✓' : 'Enrolled successfully ✓');
  };

  const handleSubmit = async (lessonId, courseId) => {
    await api.submitAssignment({
      lessonId, courseId, studentId: STUDENT_ID,
      studentName: STUDENT_NAME,
      content: bn ? 'জমা দেওয়া হয়েছে (ডেমো)' : 'Submitted (demo)'
    });
    showToast(t.asgSubmitted);
  };

  const moduleCards = [
    { num: '৭', dates: lang === 'bn' ? '২০ জুন - ২৪ জুন' : 'Jun 20 - Jun 24', pct: 100, items: '4/4', kind: 'done', title: 'মহাকর্ষ ও অভিকর্ষ | কেপলারের সূত্র', live: 2, asg: 1, test: 1 },
    { num: '৮', dates: lang === 'bn' ? '২৯ জুন - ৮ জুলাই' : 'Jun 29 - Jul 8', pct: 50, items: '2/4', kind: 'now', title: 'নিউটনিয়ান বলবিদ্যা | কাজ, শক্তি ও ক্ষমতা', live: 2, asg: 1, test: 1 },
    { num: '৯', dates: lang === 'bn' ? '১২ জুলাই - ২০ জুলাই' : 'Jul 12 - Jul 20', pct: 0, items: '0/4', kind: 'up', title: 'পর্যাবৃত্ত গতি | সরল ছন্দিত স্পন্দন', live: 2, asg: 1, test: 1 }
  ];

  const exams = [
    { title: lang === 'bn' ? 'মডেল টেস্ট ৮' : 'Model Test 8', date: lang === 'bn' ? '৯ জুলাই · রাত ৯:০০' : 'Jul 9 · 9:00 PM', done: false },
    { title: lang === 'bn' ? 'মডেল টেস্ট ৭' : 'Model Test 7', date: lang === 'bn' ? '২৫ জুন' : 'Jun 25', done: true, score: '42/50', rank: lang === 'bn' ? '১২/৬৪' : '12/64' }
  ];

  const chipClass = (kind) => (kind === 'done' ? 'chip-green' : kind === 'now' ? 'chip-orange' : 'chip-violet');
  const chipLabel = (kind) => (kind === 'done' ? t.finished : kind === 'now' ? t.runningNow : t.upcomingChip);

  // ---------- course list ----------
  if (openCourse === null || !courses[openCourse]) {
    return (
      <div className="anim-in">
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.myCourses}</div>

        {courses.length === 0 ? (
          <div className="card" style={{ padding: 28, textAlign: 'center', color: 'var(--faint)' }}>{t.noEnrollments}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(250px,100%),1fr))', gap: 14 }}>
            {courses.map((co, i) => (
              <div key={co.enrollmentId} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ height: 92, background: co.c, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 19, letterSpacing: '.02em' }}>
                  {co.short}
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className="tag chip-stone">{co.batch}</span>
                    <span className={`tag ${co.live ? 'chip-green' : 'chip-stone'}`}>{co.live ? t.ongoingChip : t.cbDraft}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>{co.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', margin: '10px 0 4px', fontWeight: 600 }}>
                    {co.moduleCount} {t.cbModules} · {co.lessonCount} {t.cbLessons}
                  </div>
                  <button
                    onClick={() => { setOpenCourse(i); setCourseTab('modules'); }}
                    style={{ marginTop: 12, width: '100%', border: '1.5px solid var(--line)', background: 'var(--paper)', borderRadius: 9, padding: 9, fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit' }}
                  >
                    {t.continueCourse} →
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                  <div className="display" style={{ fontWeight: 800, fontSize: 17 }}>৳{b.fee} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--faint)' }}>{t.perMonth}</span></div>
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

  // ---------- course detail ----------
  const cd = courses[openCourse];
  const openCourseObj = allCourses.find((c) => c.id === cd.courseId);
  const comp = courseCompletion(STUDENT_ID, openCourseObj, { enrollments, submissions, attendance });
  const progressRows = [
    { label: t.cAssignments, pct: comp.assignmentRate ?? 0, c: '#7C3AED' },
    { label: t.attendance, pct: comp.attendanceRate ?? 0, c: '#0E9F6E' },
    { label: t.quiz, pct: 72, c: '#1D4ED8' } // demo — quizzes not modeled yet
  ];

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
            <span className="tag chip-stone">{cd.batch}</span>
            <span className="tag chip-green">{t.ongoingChip}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 264px', gap: 16, alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          {/* coordinator */}
          <div className="card" style={{ borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="avatar" style={{ width: 40, height: 40, background: 'var(--brand-tint)', color: 'var(--brand-deep)', fontSize: 15 }}>সা</div>
            <div style={{ flex: 1, minWidth: 170 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.4 }}>{t.coordT}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>সাদিয়া রহমান · {t.coordRole}</div>
            </div>
            <button
              onClick={() => showToast(t.coordMsg)}
              style={{ border: '1.5px solid #16a34a', background: '#f0fdf4', color: 'var(--green-chip-fg)', borderRadius: 99, padding: '8px 18px', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit' }}
            >
              {t.contact}
            </button>
          </div>

          {/* course tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['modules', 'assignments', 'exams'].map((k) => (
              <button key={k} className={`pill-tab ${courseTab === k ? 'active' : ''}`} onClick={() => setCourseTab(k)}>
                {t[k === 'modules' ? 'cModules' : k === 'assignments' ? 'cAssignments' : 'cExams']}
              </button>
            ))}
          </div>

          {/* modules */}
          {courseTab === 'modules' && (
            <>
              <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 12, color: 'var(--ink-soft)' }}>{t.milestoneT}</div>
              {moduleCards.map((mc) => (
                <div key={mc.num} className="card" style={{ padding: '18px 20px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div
                      style={{
                        flex: 'none', borderRadius: 12, padding: '8px 14px', textAlign: 'center',
                        background: mc.kind === 'now' ? 'var(--coal)' : 'var(--line-softer)',
                        color: mc.kind === 'now' ? '#fff' : 'var(--ink-soft)'
                      }}
                    >
                      <div style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.75 }}>{t.cModules}</div>
                      <div className="display" style={{ fontSize: 19, lineHeight: 1.1 }}>{mc.num}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{mc.dates}</span>
                        <span className={`chip ${chipClass(mc.kind)}`} style={{ padding: '3px 10px', fontSize: 11 }}>{chipLabel(mc.kind)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                        <div className="progress-track" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${mc.pct}%`, background: mc.pct === 100 ? 'var(--green)' : 'var(--brand)' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{mc.items} {t.itemsW}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.45, marginTop: 12 }}>{mc.title}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, flexWrap: 'wrap' }}>
                    <span>▸ {mc.live} {t.liveClassW}</span><span>▸ {mc.asg} {t.asgW}</span><span>▸ {mc.test} {t.testW}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <button
                      onClick={() => showToast(t.openStudyPlan)}
                      style={{ flex: 1, border: '1.5px solid var(--line)', background: 'var(--paper)', borderRadius: 9, padding: 9, fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit' }}
                    >
                      {t.studyPlan}
                    </button>
                    <button
                      onClick={() => showToast(t.openFeedback)}
                      style={{ flex: 1, border: '1.5px solid var(--line)', background: '#fff', borderRadius: 9, padding: 9, fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit' }}
                    >
                      {t.feedback} ☆
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* assignments (real submission state) */}
          {courseTab === 'assignments' && (
            cd.assignments.length === 0 ? (
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
            })
          )}

          {/* exams */}
          {courseTab === 'exams' && exams.map((ex, i) => (
            <div key={i} className="card" style={{ borderRadius: 14, padding: '16px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{ex.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{ex.date}</div>
              </div>
              {ex.done ? (
                <>
                  <div style={{ textAlign: 'right' }}>
                    <div className="display" style={{ fontWeight: 800, fontSize: 16 }}>{ex.score}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{t.rankW}: {ex.rank}</div>
                  </div>
                  <button className="btn-ghost-sm" style={{ padding: '9px 16px' }} onClick={() => showToast(t.resultOpen)}>
                    {t.viewResult}
                  </button>
                </>
              ) : (
                <span className="chip chip-violet" style={{ padding: '6px 14px', fontSize: 12 }}>{t.upcomingExam}</span>
              )}
            </div>
          ))}
        </div>

        {/* progress rail */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>{t.totalProgress}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '4px 0 16px' }}>
            <span className="display" style={{ fontSize: 34, color: 'var(--brand)' }}>{comp.completion}%</span>
            <span style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 600 }}>{t.completion}</span>
          </div>
          {progressRows.map((pr) => (
            <div key={pr.label} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>
                <span>{pr.label}</span>
                <span style={{ color: pr.c }}>{pr.pct}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pr.pct}%`, background: pr.c }} />
              </div>
            </div>
          ))}
          <button className="btn-dark" style={{ width: '100%', marginTop: 6, borderRadius: 10, padding: 11, fontSize: 13 }} onClick={() => showToast(t.openReport)}>
            {t.reportDetails} →
          </button>
        </div>
      </div>
    </div>
  );
}
