'use client';

import { useEffect, useMemo, useState } from 'react';
import { prefersReducedMotion } from '@/components/ui/motion';

// Bangla-safe typewriter: steps by grapheme cluster (Intl.Segmenter) so
// conjuncts and vowel signs never render half-typed. The full text is
// always in the DOM (invisible "ghost" reserves the space, screen readers
// read the aria-label), so there's no layout shift and nothing is lost
// without JavaScript or with reduced motion.
function graphemes(text) {
  try { return [...new Intl.Segmenter('bn', { granularity: 'grapheme' }).segment(text)].map((s) => s.segment); }
  catch { return Array.from(text); }
}

export default function Typewriter({ text, as: Tag = 'h1', className = '', speed = 70, startDelay = 250 }) {
  const parts = useMemo(() => graphemes(text), [text]);
  const [n, setN] = useState(null); // null = not started (server render / no JS)
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) { setN(parts.length); setDone(true); return undefined; }
    setN(0); setDone(false);
    let i = 0, timer;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        i += 1; setN(i);
        if (i >= parts.length) { clearInterval(timer); setDone(true); }
      }, speed);
    }, startDelay);
    return () => { clearTimeout(start); clearInterval(timer); };
  }, [parts, speed, startDelay]);

  const typed = n == null ? text : parts.slice(0, n).join('');
  return (
    <Tag className={`tw ${className}`} aria-label={text} data-typing={n == null ? undefined : String(!done)}>
      <span className="tw-ghost" aria-hidden="true">{text}</span>
      <span className="tw-live" aria-hidden="true">{typed}<span className="tw-caret" /></span>
    </Tag>
  );
}
