'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import VideoPlayer from '@/components/VideoPlayer';
import Icon from '@/components/Icon';
import { copy, clock } from '@/lib/copy';

const Ctx = createContext({ open: () => {} });
export const usePreview = () => useContext(Ctx);

// Public preview dialog. Only lessons the server marked previewable are
// listed; the player still re-checks eligibility server-side on load.
// Closing unmounts the <video>, which stops playback.
export default function PreviewProvider({ courseTitle, previews, lang, children }) {
  const c = copy(lang);
  const [current, setCurrent] = useState(null);
  const open = useCallback((id) => setCurrent(id ?? previews[0]?.id ?? null), [previews]);
  // Keep the last lesson's title while the dialog animates out.
  const lastRef = useRef(null);
  const lesson = previews.find((p) => p.id === current) || lastRef.current;
  if (lesson) lastRef.current = lesson;
  return (
    <Ctx.Provider value={{ open, hasPreviews: previews.length > 0 }}>
      {children}
      <Dialog open={current != null} onClose={() => setCurrent(null)} wide dark sheet={false}
        title={lesson ? lesson.title : c.previewOf} description={`${c.previewOf} · ${courseTitle}`} closeLabel={c.closePreview}>
        {current != null && <VideoPlayer key={current} lessonId={current} lang={lang} mode="preview" autoPlay />}
        {previews.length > 1 && (
          <div style={{ marginTop: 18 }}>
            <h3 className="small strong" style={{ color: 'var(--stage-muted)', fontFamily: 'var(--font-text)', marginBottom: 8 }}>{c.morePreviews}</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
              {previews.map((p) => (
                <li key={p.id}>
                  <button type="button" className="cur-lesson" aria-current={p.id === current ? 'true' : undefined} onClick={() => setCurrent(p.id)} style={{ borderRadius: 0 }}>
                    <Icon name="play" size={14} style={{ marginTop: 3 }} />
                    <span className="lt">{p.title}</span>
                    {p.durationSeconds ? <span className="lm tabular">{clock(p.durationSeconds)}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Dialog>
    </Ctx.Provider>
  );
}

export function PreviewMediaButton({ children, label }) {
  const { open, hasPreviews } = usePreview();
  if (!hasPreviews) return <div className="buy-card-media">{children}</div>;
  return (
    <button type="button" className="buy-card-media" onClick={() => open()} aria-label={label}>
      {children}
      <span className="play-overlay" aria-hidden="true">
        <span className="play-disc"><Icon name="play" size={22} /></span>
        <span className="play-label">{label}</span>
      </span>
    </button>
  );
}

export function PreviewLink({ lessonId, children }) {
  const { open } = usePreview();
  return <button type="button" className="lesson-title" onClick={() => open(lessonId)}>{children}</button>;
}
