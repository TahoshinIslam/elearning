'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';
import VideoPlayer from '@/components/VideoPlayer';

export default function LessonPlayerPage() {
  const { courseSlug, lessonId } = useParams();
  const router = useRouter();
  const { loaded, authReady, auth, lang, courses } = useApp();
  const bn = lang === 'bn';
  const lessonIdNum = Number(lessonId);

  const course = loaded ? courses.find((c) => c.slug === courseSlug) : null;
  const [progress, setProgress] = useState(null); // { lessons, resumeLessonId, completion }
  const [progressError, setProgressError] = useState(null);

  const fetchProgress = useCallback(async () => {
    if (!course) return;
    try {
      const res = await fetch(`/api/courses/${course.id}/continue`);
      const data = await res.json();
      if (!res.ok) { setProgressError(data?.error || 'error'); return; }
      setProgress(data);
      setProgressError(null);
    } catch { setProgressError('error'); }
  }, [course]);

  useEffect(() => {
    if (!authReady || !loaded) return;
    if (!auth) { router.replace(`/login?returnTo=${encodeURIComponent(`/learn/${courseSlug}/${lessonId}`)}`); return; }
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, loaded, auth, course?.id]);

  const grouped = useMemo(() => {
    if (!progress) return [];
    const groups = [];
    for (const l of progress.lessons) {
      let g = groups[groups.length - 1];
      if (!g || g.title !== l.moduleTitle) { g = { title: l.moduleTitle, lessons: [] }; groups.push(g); }
      g.lessons.push(l);
    }
    return groups;
  }, [progress]);

  const flatLessons = progress?.lessons || [];
  const idx = flatLessons.findIndex((l) => l.id === lessonIdNum);
  const current = idx >= 0 ? flatLessons[idx] : null;
  const prevLesson = idx > 0 ? flatLessons[idx - 1] : null;
  const nextLesson = idx >= 0 && idx < flatLessons.length - 1 ? flatLessons[idx + 1] : null;

  const go = (id) => router.push(`/learn/${courseSlug}/${id}`);

  if (!loaded || !authReady) return (<><SiteNav /><div style={{ maxWidth: 480, margin: '90px auto', textAlign: 'center', color: 'var(--faint)' }}>…</div></>);

  if (!course) {
    return (
      <>
        <SiteNav />
        <div style={{ maxWidth: 480, margin: '90px auto', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontSize: 15, color: 'var(--muted)' }}>{bn ? 'কোর্সটি খুঁজে পাওয়া যায়নি।' : 'Course not found.'}</div>
        </div>
      </>
    );
  }

  if (progressError === 'not_enrolled') {
    return (
      <>
        <SiteNav />
        <div style={{ maxWidth: 480, margin: '90px auto', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
          <div style={{ fontSize: 15, color: 'var(--muted)' }}>{bn ? 'এই কোর্সে আপনি ভর্তি নন।' : "You're not enrolled in this course."}</div>
          <button className="btn-primary" style={{ marginTop: 18, borderRadius: 10 }} onClick={() => router.push(`/course/${courseSlug}`)}>
            {bn ? 'কোর্স পেজে যান' : 'Go to course page'}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteNav />
      <div className="learn-shell">
        <div style={{ minWidth: 0 }}>
          {/* compact header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <button onClick={() => router.push('/student')} style={{ border: 'none', background: 'none', color: 'var(--muted)', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', padding: 0, cursor: 'pointer' }}>
                ← {bn ? 'আমার কোর্স' : 'My Courses'}
              </button>
              <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3, marginTop: 2 }}>{course.title}</div>
            </div>
            {progress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
                <div className="progress-track" style={{ width: 100 }}>
                  <div className="progress-fill" style={{ width: `${progress.completion}%`, background: progress.completion === 100 ? 'var(--green)' : 'var(--brand)' }} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}>{progress.completion}%</span>
              </div>
            )}
          </div>

          {/* player */}
          {current ? (
            <VideoPlayer key={lessonIdNum} lessonId={lessonIdNum} onCompleted={fetchProgress} />
          ) : (
            <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: 14 }} />
          )}

          <div style={{ fontWeight: 700, fontSize: 16, marginTop: 14 }}>{current?.title || ''}</div>

          {/* prev/next */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              disabled={!prevLesson}
              onClick={() => prevLesson && go(prevLesson.id)}
              style={{ flex: 1, border: '1.5px solid var(--line)', background: '#fff', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', opacity: prevLesson ? 1 : 0.4, cursor: prevLesson ? 'pointer' : 'default' }}
            >
              ← {bn ? 'আগের লেসন' : 'Previous'}
            </button>
            <button
              disabled={!nextLesson}
              onClick={() => nextLesson && go(nextLesson.id)}
              style={{ flex: 1, border: 'none', background: 'var(--coal)', color: '#fff', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', opacity: nextLesson ? 1 : 0.4, cursor: nextLesson ? 'pointer' : 'default' }}
            >
              {bn ? 'পরের লেসন' : 'Next'} →
            </button>
          </div>
        </div>

        {/* curriculum sidebar */}
        <div className="card" style={{ overflow: 'hidden', maxHeight: 640, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '13px 16px', fontWeight: 700, fontSize: 13.5, borderBottom: '1.5px solid var(--line)', flex: 'none' }}>
            {bn ? 'কারিকুলাম' : 'Curriculum'}
          </div>
          <div style={{ overflowY: 'auto' }}>
            {grouped.map((g) => (
              <div key={g.title}>
                <div style={{ padding: '9px 16px', fontSize: 11.5, fontWeight: 700, color: 'var(--faint)', letterSpacing: '.03em', textTransform: 'uppercase', background: 'var(--paper)' }}>{g.title}</div>
                {g.lessons.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => go(l.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                      border: 'none', borderBottom: '1px solid var(--line-soft)', background: l.id === lessonIdNum ? 'var(--brand-wash)' : 'none',
                      textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit'
                    }}
                  >
                    <span style={{ width: 16, flex: 'none', textAlign: 'center', fontSize: 13, color: l.completed ? 'var(--green)' : 'var(--faint)' }}>
                      {l.completed ? '✓' : '▶'}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: l.id === lessonIdNum ? 700 : 500, color: l.id === lessonIdNum ? 'var(--brand-deep)' : 'var(--ink-soft)' }}>
                      {l.title}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
