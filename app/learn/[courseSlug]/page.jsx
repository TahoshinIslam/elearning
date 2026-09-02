'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';

const COPY = {
  no_lessons: { bn: 'এই কোর্সে এখনো কোনো ভিডিও লেসন নেই।', en: 'This course has no video lessons yet.' },
  not_enrolled: { bn: 'এই কোর্সে আপনি ভর্তি নন।', en: "You're not enrolled in this course." },
  not_found: { bn: 'কোর্সটি খুঁজে পাওয়া যায়নি।', en: 'Course not found.' },
  error: { bn: 'কিছু একটা ভুল হয়েছে।', en: 'Something went wrong.' }
};

// Landing on /learn/[courseSlug] with no lesson picked: figure out which
// lesson to resume (or start at) and redirect straight there. Keeps every
// deep link short and lets "Continue learning" always point at one stable URL.
export default function LearnResumePage() {
  const { courseSlug } = useParams();
  const router = useRouter();
  const { loaded, authReady, auth, lang, courses } = useApp();
  const bn = lang === 'bn';
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authReady || !loaded) return;
    if (!auth) { router.replace(`/login?returnTo=${encodeURIComponent(`/learn/${courseSlug}`)}`); return; }
    if (auth.role !== 'student') { setError('not_found'); return; }
    const course = courses.find((c) => c.slug === courseSlug);
    if (!course) { setError('not_found'); return; }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/courses/${course.id}/continue`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) { setError(data?.error === 'not_enrolled' ? 'not_enrolled' : 'error'); return; }
        if (!data.resumeLessonId) { setError('no_lessons'); return; }
        router.replace(`/learn/${courseSlug}/${data.resumeLessonId}`);
      } catch {
        if (!cancelled) setError('error');
      }
    })();
    return () => { cancelled = true; };
  }, [authReady, loaded, auth, courses, courseSlug, router]);

  return (
    <>
      <SiteNav />
      <div style={{ maxWidth: 480, margin: '90px auto', textAlign: 'center', padding: '0 20px' }}>
        {error ? (
          <>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 15, color: 'var(--muted)' }}>{COPY[error][bn ? 'bn' : 'en']}</div>
            <button className="btn-primary" style={{ marginTop: 18, borderRadius: 10 }} onClick={() => router.push(`/course/${courseSlug}`)}>
              {bn ? 'কোর্স পেজে যান' : 'Go to course page'}
            </button>
          </>
        ) : (
          <div style={{ color: 'var(--faint)', fontSize: 14 }}>{bn ? 'লোড হচ্ছে…' : 'Loading…'}</div>
        )}
      </div>
    </>
  );
}
