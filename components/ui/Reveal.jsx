'use client';

import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/components/ui/motion';

// Reveals a section once as it scrolls into view. Content is visible in the
// server HTML; it is only hidden (client-side) when it starts below the
// fold, so nothing flashes, nothing is lost without JS, and scrolling is
// never hijacked. Reduced motion: always visible.
export default function Reveal({ as: Tag = 'div', children, ...rest }) {
  const ref = useRef(null);
  const [state, setState] = useState('shown');
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !('IntersectionObserver' in window)) return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return undefined;
    setState('hidden');
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setState('shown'); io.disconnect(); }
    }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const { className, ...props } = rest;
  return <Tag ref={ref} className={`reveal ${className || ''}`} data-reveal={state} {...props}>{children}</Tag>;
}
