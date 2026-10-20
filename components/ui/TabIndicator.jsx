'use client';

import { useLayoutEffect, useRef } from 'react';

// Sliding underline for a .tabs row. Drop it inside the tablist; it follows
// the [aria-selected="true"] tab (transform + width, tokens in globals.css)
// and re-measures on resize. The tab buttons keep all semantics/focus.
export default function TabIndicator({ activeKey }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const bar = ref.current;
    const list = bar?.parentElement;
    if (!list) return undefined;
    list.classList.add('has-indicator');
    const place = () => {
      const tab = list.querySelector('[aria-selected="true"]');
      if (!tab) { bar.style.width = '0px'; return; }
      bar.style.width = `${Math.max(0, tab.offsetWidth - 20)}px`;
      bar.style.transform = `translateX(${tab.offsetLeft + 10}px)`;
    };
    place();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null;
    ro?.observe(list);
    return () => ro?.disconnect();
  }, [activeKey]);
  return <span ref={ref} className="tab-indicator" aria-hidden="true" />;
}
