'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { copy } from '@/lib/copy';

const SAVE_EVERY_MS = 15_000;
const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

function rangesOf(video) {
  const out = [];
  const tr = video?.played;
  if (!tr) return out;
  for (let i = 0; i < tr.length; i++) out.push([Math.round(tr.start(i) * 10) / 10, Math.round(tr.end(i) * 10) / 10]);
  return out;
}

const newSession = () => `p${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

// One player for previews and the course player.
//  - Playback access is decided by the server on every load (GET
//    /api/lessons/:id/video). The URL is short-lived; when it expires mid-way
//    the player silently fetches a new one and resumes at the same second.
//  - Progress (learn mode, enrolled students only) is the ranges the browser
//    actually PLAYED — seeking doesn't count — saved every 15s, on pause, on
//    end, on page hide and when leaving the lesson. Failed saves keep the
//    ranges and retry; the learner is told quietly, never interrupted.
export default function VideoPlayer({ lessonId, lang = 'bn', mode = 'learn', autoPlay = false, onCompletedChange, onSaveState, onEnded, onMeta }) {
  const c = copy(lang);
  const videoRef = useRef(null);
  const [state, setState] = useState('loading'); // loading | ready | not_ready | locked | error
  const [info, setInfo] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const sessionRef = useRef(newSession());
  const seqRef = useRef(0);
  const lastSaveRef = useRef(0);
  const completedRef = useRef(false);
  const resumeRef = useRef(null);
  const renewingRef = useRef(false);
  // Nothing is saved until the learner actually plays or seeks in this
  // session — merely opening a lesson (e.g. on another device) must never
  // overwrite the saved resume position with 0.
  const interactedRef = useRef(false);
  const resumingRef = useRef(false); // our own resume seek isn't a user action
  const errorsRef = useRef(0);
  const tracking = mode === 'learn';

  const report = useCallback((code, phase) => {
    fetch(`/api/lessons/${lessonId}/playback-error`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, phase, retries: errorsRef.current }), keepalive: true
    }).catch(() => {});
  }, [lessonId]);

  const load = useCallback(async ({ keepPosition = false } = {}) => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/video`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404 && data.error === 'video_not_ready') { setState('not_ready'); return null; }
      if (res.status === 401 || res.status === 403) { setState('locked'); return null; }
      if (!res.ok) { setState('error'); report(res.status, 'authorize'); return null; }
      if (!keepPosition) {
        resumeRef.current = data.progress?.resumeAt || 0;
        completedRef.current = !!data.progress?.completed;
      }
      setInfo(data);
      setState('ready');
      onMeta?.(data);
      return data;
    } catch {
      setState('error');
      return null;
    }
  }, [lessonId, report, onMeta]);

  // (Re)load whenever the lesson changes; a fresh playback session per lesson.
  useEffect(() => {
    setState('loading'); setInfo(null);
    sessionRef.current = newSession(); seqRef.current = 0; errorsRef.current = 0; interactedRef.current = false;
    load();
  }, [lessonId, attempt, load]);

  // Always posts to the lesson this video belongs to (info.lesson.id), never
  // the lesson the user is switching to.
  const save = useCallback((reason) => {
    const v = videoRef.current;
    if (!tracking || !info?.progress || !v || !Number.isFinite(v.currentTime) || !interactedRef.current) return;
    const id = info.lesson.id;
    seqRef.current += 1;
    const body = JSON.stringify({
      positionSeconds: Math.floor(v.currentTime), ranges: rangesOf(v),
      durationSeconds: Number.isFinite(v.duration) ? Math.round(v.duration) : undefined,
      session: sessionRef.current, seq: seqRef.current
    });
    lastSaveRef.current = Date.now();
    if (reason === 'hide' && navigator.sendBeacon) {
      navigator.sendBeacon(`/api/lessons/${id}/progress`, new Blob([body], { type: 'text/plain' }));
      return;
    }
    onSaveState?.('saving');
    fetch(`/api/lessons/${id}/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: reason === 'leave' })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        const data = await r.json();
        onSaveState?.('saved');
        if (data.completed && !completedRef.current) {
          completedRef.current = true;
          onCompletedChange?.(id, true);
        }
      })
      .catch(() => onSaveState?.('error'));
  }, [tracking, info, onSaveState, onCompletedChange]);
  const saveRef = useRef(save);
  saveRef.current = save;
  // Leaving a lesson (switching or unmounting): flush the last ranges while
  // the old video is still mounted.
  useEffect(() => () => saveRef.current('leave'), [lessonId]);

  // page hide / tab switch / leaving the lesson
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') save('hide'); };
    const onPageHide = () => save('hide');
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [save]);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed, info]);

  const onError = async () => {
    const v = videoRef.current;
    const code = v?.error?.code || 0;
    // Expired signed URL (or a transient network drop): renew once silently
    // and continue from the same position.
    if (!renewingRef.current && errorsRef.current < 3) {
      renewingRef.current = true;
      errorsRef.current += 1;
      const at = v?.currentTime || resumeRef.current || 0;
      const wasPlaying = v && !v.paused;
      resumeRef.current = at;
      const fresh = await load({ keepPosition: true });
      renewingRef.current = false;
      if (fresh && wasPlaying) setTimeout(() => videoRef.current?.play().catch(() => {}), 0);
      return;
    }
    report(code, 'media');
    setState('error');
  };

  if (state !== 'ready') {
    const map = {
      loading: { icon: null, t: c.loadingVideo },
      not_ready: { icon: 'clock', t: c.videoNotReadyT, d: c.videoNotReadyD },
      locked: { icon: 'lock', t: c.lockedT, d: c.lockedD },
      error: { icon: 'alert', t: c.playbackErrorT, d: c.playbackErrorD, retry: true }
    }[state];
    return (
      <div className="video-frame">
        <div className="video-state" role={state === 'error' ? 'alert' : 'status'}>
          {state === 'loading' ? <span className="spinner spinner-lg" aria-hidden="true" /> : <Icon name={map.icon} size={30} />}
          <strong style={{ fontSize: 16 }}>{map.t}</strong>
          {map.d && <p>{map.d}</p>}
          {map.retry && <button type="button" className="btn btn-secondary" onClick={() => setAttempt((n) => n + 1)}><Icon name="refresh" size={16} />{c.retry}</button>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="video-frame">
        <video
          ref={videoRef}
          key={info.url}
          src={info.url}
          controls
          playsInline
          preload="metadata"
          autoPlay={autoPlay}
          controlsList="nodownload"
          crossOrigin={info.captions?.length ? 'use-credentials' : undefined}
          aria-label={info.lesson?.title}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            v.playbackRate = speed;
            const at = resumeRef.current || 0;
            // Some files (e.g. MediaRecorder WebM) report Infinity until fully
            // scanned — fall back to the duration the server knows.
            const total = Number.isFinite(v.duration) ? v.duration : Number(info.durationSeconds) || Infinity;
            if (at > 0 && at < total - 5) { resumingRef.current = true; v.currentTime = at; }
          }}
          onPlay={() => { interactedRef.current = true; }}
          onSeeked={() => { if (!resumingRef.current) interactedRef.current = true; resumingRef.current = false; }}
          onTimeUpdate={() => { if (tracking && Date.now() - lastSaveRef.current > SAVE_EVERY_MS && !videoRef.current?.paused) save('tick'); }}
          onPause={() => save('pause')}
          onEnded={() => { save('ended'); onEnded?.(); }}
          onError={onError}
        >
          {(info.captions || []).map((t, i) => <track key={t.lang} kind="captions" src={t.url} srcLang={t.lang} label={t.label} default={i === 0 && t.lang === (lang === 'en' ? 'en' : 'bn')} />)}
        </video>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', padding: '8px 4px 0', '--gap': '8px' }}>
        <label className="small muted" htmlFor={`speed-${lessonId}`}>{c.speed}</label>
        <select id={`speed-${lessonId}`} className="select" style={{ width: 'auto', minHeight: 34, fontSize: 14, padding: '4px 34px 4px 10px' }} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
          {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
        </select>
        {info.captions?.length > 0 && <span className="badge"><Icon name="captions" size={14} />{c.captionsLbl}</span>}
      </div>
    </div>
  );
}
