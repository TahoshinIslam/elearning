'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';

const COPY = {
  loading: { bn: 'লোড হচ্ছে…', en: 'Loading…' },
  not_enrolled: { bn: 'এই লেসন দেখতে কোর্সটি কিনতে হবে অথবা লগইন করুন।', en: 'Enroll in this course (or log in, if you already have) to watch this lesson.' },
  video_not_ready: { bn: 'ভিডিও এখনো প্রস্তুত হয়নি।', en: 'This video is not ready yet.' },
  generic: { bn: 'ভিডিও লোড করা যায়নি।', en: 'Could not load this video.' }
};

const RESUME_SKIP_TAIL_SECONDS = 5;   // don't bother resuming into the last few seconds
const SAVE_INTERVAL_MS = 15000;       // periodic save while playing

// Plays one lesson's video. Always fetches its own signed URL server-side
// (GET /api/lessons/:id/video) — never receives a raw src as a prop — so the
// entitlement check in lib/videoRepo.js runs every time a lesson is opened,
// not just once at some earlier point in the page's life.
export default function VideoPlayer({ lessonId, onCompleted }) {
  const { lang } = useApp();
  const bn = lang === 'bn';
  const videoRef = useRef(null);
  const lastSavedAtRef = useRef(0);
  const resumedRef = useRef(false);
  const completedRef = useRef(false);

  const [state, setState] = useState('loading'); // loading | ready | error
  const [errorKey, setErrorKey] = useState('generic');
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    resumedRef.current = false;
    setState('loading');
    (async () => {
      try {
        const res = await fetch(`/api/lessons/${lessonId}/video`);
        const data = await res.json();
        if (!res.ok) {
          if (cancelled) return;
          setErrorKey(data?.error === 'not_enrolled' ? 'not_enrolled' : data?.error === 'video_not_ready' ? 'video_not_ready' : 'generic');
          setState('error');
          return;
        }
        if (cancelled) return;
        completedRef.current = !!data.completed;
        setInfo(data);
        setState('ready');
      } catch {
        if (!cancelled) { setErrorKey('generic'); setState('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, [lessonId]);

  const saveProgress = useCallback((watchedSeconds, durationSeconds) => {
    const payload = JSON.stringify({ watchedSeconds: Math.floor(watchedSeconds), durationSeconds: Math.floor(durationSeconds) || undefined });
    // sendBeacon on the way out (tab close/navigation) is best-effort and
    // fire-and-forget; a normal fetch otherwise so we can react to the result.
    if (document.visibilityState === 'hidden' && navigator.sendBeacon) {
      navigator.sendBeacon(`/api/lessons/${lessonId}/progress`, new Blob([payload], { type: 'application/json' }));
      return;
    }
    fetch(`/api/lessons/${lessonId}/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })
      .then((r) => r.json())
      .then((data) => {
        if (data?.completed && !completedRef.current) {
          completedRef.current = true;
          onCompleted?.(lessonId);
        }
      })
      .catch(() => {});
  }, [lessonId, onCompleted]);

  useEffect(() => {
    const onHide = () => {
      const v = videoRef.current;
      if (v && v.currentTime > 0) saveProgress(v.currentTime, v.duration);
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
    };
  }, [saveProgress]);

  if (state === 'loading') {
    return <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: 14, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 14 }}>{COPY.loading[bn ? 'bn' : 'en']}</div>;
  }
  if (state === 'error') {
    return (
      <div style={{ aspectRatio: '16/9', background: 'var(--paper)', border: '1.5px dashed var(--line)', borderRadius: 14, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 20 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 280 }}>{COPY[errorKey][bn ? 'bn' : 'en']}</div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      preload="metadata"
      src={info.url}
      style={{ width: '100%', aspectRatio: '16/9', borderRadius: 14, background: '#000' }}
      onLoadedMetadata={(e) => {
        if (resumedRef.current) return;
        resumedRef.current = true;
        const v = e.currentTarget;
        if (info.watchedSeconds > 0 && info.watchedSeconds < v.duration - RESUME_SKIP_TAIL_SECONDS) {
          v.currentTime = info.watchedSeconds;
        }
      }}
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        const now = Date.now();
        if (now - lastSavedAtRef.current >= SAVE_INTERVAL_MS) {
          lastSavedAtRef.current = now;
          saveProgress(v.currentTime, v.duration);
        }
      }}
      onPause={(e) => saveProgress(e.currentTarget.currentTime, e.currentTarget.duration)}
      onEnded={(e) => saveProgress(e.currentTarget.duration, e.currentTarget.duration)}
    />
  );
}
