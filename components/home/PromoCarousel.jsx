'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { prefersReducedMotion } from '@/components/ui/motion';
import CourseCover from '@/components/ui/CourseCover';
import { copy, num, dateLabel } from '@/lib/copy';

const INTERVAL = 6000;

// Homepage promotions (campaigns of kind "slide"). Every slide links to a
// real destination through its CTA only — arrows, dots and play/pause are
// separate buttons, so using them never navigates. Autoplay pauses on
// hover, focus, touch and when the tab is hidden, and is off entirely for
// reduced-motion users.
export default function PromoCarousel({ slides, lang }) {
  const c = copy(lang);
  const n = slides.length;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [held, setHeld] = useState(false); // hover / focus / touch
  const [dir, setDir] = useState(1);
  const touch = useRef(null);
  const root = useRef(null);

  useEffect(() => { setPlaying(n > 1 && !prefersReducedMotion()); }, [n]);
  const go = useCallback((to, d) => { setDir(d ?? (to > i ? 1 : -1)); setI(((to % n) + n) % n); }, [i, n]);
  const next = useCallback(() => go(i + 1, 1), [go, i]);
  const prev = useCallback(() => go(i - 1, -1), [go, i]);

  useEffect(() => {
    if (!playing || held || n < 2) return undefined;
    const t = setTimeout(() => { if (!document.hidden) next(); }, INTERVAL);
    return () => clearTimeout(t);
  }, [playing, held, i, n, next]);

  if (!n) return null;

  const onKey = (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };
  const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; setHeld(true); };
  const onTouchEnd = (e) => {
    const s = touch.current; touch.current = null; setHeld(false);
    if (!s) return;
    const dx = e.changedTouches[0].clientX - s.x, dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)();
  };

  return (
    <section ref={root} className="promo" aria-roledescription="carousel" aria-label={c.promotions}
      onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)} onBlur={(e) => { if (!root.current?.contains(e.relatedTarget)) setHeld(false); }}
      onKeyDown={onKey} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="promo-track" aria-live={playing && !held ? 'off' : 'polite'}>
        {slides.map((s, k) => {
          const active = k === i;
          return (
            <div key={s.id} className={`promo-slide ${active ? 'is-active' : ''}`} data-dir={dir} role="group" aria-roledescription="slide"
              aria-label={c.slideN(k + 1, n)} aria-hidden={!active} inert={!active}>
              <div className="promo-copy">
                {s.offer && (
                  <span className="badge badge-brand promo-offer">
                    {c.offerSave(s.offer.type === 'percent' ? `${num(lang, s.offer.value)}%` : `৳${num(lang, s.offer.value)}`)}
                  </span>
                )}
                <h2 className="promo-title">{s.title}</h2>
                {s.body && <p className="promo-body">{s.body}</p>}
                <div className="cluster" style={{ '--gap': '12px', alignItems: 'center' }}>
                  <Link href={s.href} className="btn btn-primary btn-lg" tabIndex={active ? undefined : -1}>{s.ctaLabel}<Icon name="arrowRight" size={18} /></Link>
                  {s.offer?.endsAt && <span className="small promo-valid">{c.validUntil(dateLabel(lang, s.offer.endsAt))}</span>}
                </div>
              </div>
              <div className="promo-art" aria-hidden={s.imageUrl && s.imageAlt ? undefined : true}>
                {s.imageUrl
                  ? <img src={s.imageUrl} alt={s.imageAlt || ''} loading={k === 0 ? 'eager' : 'lazy'} decoding="async" />
                  : s.cover ? <CourseCover {...s.cover} size="lg" priority={k === 0} />
                  : <span className="promo-art-fallback"><Icon name="gift" size={56} /></span>}
              </div>
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <div className="promo-controls">
          <button type="button" className="promo-btn" onClick={prev} aria-label={c.prevSlide}><Icon name="chevronLeft" size={20} /></button>
          <div className="promo-dots" role="group" aria-label={c.promotions}>
            {slides.map((s, k) => (
              <button key={s.id} type="button" className="promo-dot" aria-current={k === i ? 'true' : undefined} aria-label={c.slideN(k + 1, n)} onClick={() => go(k)}>
                <span className="promo-dot-fill" style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: playing && !held ? 'running' : 'paused' }} key={`${k}-${i}-${playing}`} />
              </button>
            ))}
          </div>
          <button type="button" className="promo-btn" onClick={next} aria-label={c.nextSlide}><Icon name="chevronRight" size={20} /></button>
          <button type="button" className="promo-btn" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing} aria-label={playing ? c.pauseSlides : c.playSlides}>
            <Icon name={playing ? 'pause' : 'play'} size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
