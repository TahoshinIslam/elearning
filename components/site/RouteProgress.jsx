'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Top progress bar for in-app navigation: starts when an internal link is
// clicked, completes when the new route has rendered.
export default function RouteProgress() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [state, setState] = useState('idle'); // idle | loading | done
  const timer = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      clearTimeout(timer.current);
      setState('loading');
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    if (state !== 'loading') return;
    setState('done');
    timer.current = setTimeout(() => setState('idle'), 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, params]);

  return <div className={`route-progress is-${state}`} aria-hidden="true"><span /></div>;
}
