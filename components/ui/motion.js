'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Shared motion helpers (the CSS side lives in app/globals.css "Motion layer").

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// Keeps an overlay mounted for its exit animation.
// → { mounted, state: 'open' | 'closing' }
// Closing waits for the element's animationend (with a timeout fallback), and
// is immediate under reduced motion. Re-opening mid-exit cancels the exit.
export function usePresence(open, exitMs = 220) {
  const [mounted, setMounted] = useState(open);
  const [state, setState] = useState(open ? 'open' : 'closing');
  const timer = useRef(null);
  useEffect(() => {
    clearTimeout(timer.current);
    if (open) { setMounted(true); setState('open'); return undefined; }
    if (!mounted) return undefined;
    if (prefersReducedMotion()) { setMounted(false); return undefined; }
    setState('closing');
    timer.current = setTimeout(() => setMounted(false), exitMs + 60);
    return () => clearTimeout(timer.current);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const onAnimationEnd = useCallback((e) => {
    if (e.target === e.currentTarget && !open) { clearTimeout(timer.current); setMounted(false); }
  }, [open]);
  // Mounted in the SAME render that `open` turns true, so effects that move
  // focus into the overlay find its node immediately.
  return { mounted: open || mounted, state: open ? 'open' : state, onAnimationEnd };
}

// Briefly true after trigger() — drives a button's success state.
export function useFlash(ms = 1600) {
  const [on, setOn] = useState(false);
  const t = useRef(null);
  useEffect(() => () => clearTimeout(t.current), []);
  const trigger = useCallback(() => {
    clearTimeout(t.current);
    setOn(true);
    t.current = setTimeout(() => setOn(false), ms);
  }, [ms]);
  return [on, trigger];
}
