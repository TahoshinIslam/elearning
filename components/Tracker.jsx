'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const SKIP = /^\/(owner|superadmin|dev)(\/|$)/;

function device() {
  const w = window.innerWidth;
  return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
}

// Send one analytics event. Uses sendBeacon so it survives navigation.
export function track(type, data = {}) {
  try {
    const payload = JSON.stringify({ type, path: window.location.pathname, device: device(), ...data });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    else fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
  } catch { /* ignore */ }
}

// Page-view tracker for the public site and learner area. UTM tags and ad
// click ids are read from the landing URL; the referrer only on the first
// page of a visit (later pages are internal navigation).
export default function Tracker() {
  const pathname = usePathname();
  const params = useSearchParams();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname || SKIP.test(pathname)) return;
    const utm = {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      gclid: params.get('gclid') || undefined,
      fbclid: params.get('fbclid') || undefined
    };
    const referrer = first.current ? document.referrer || undefined : undefined;
    first.current = false;
    track('pageview', { ...utm, referrer });
    if (pathname === '/courses' && params.get('q')) track('search', { category: params.get('category') || undefined });
    try { sessionStorage.setItem('leo_pv', String(Number(sessionStorage.getItem('leo_pv') || 0) + 1)); } catch { /* ignore */ }
  }, [pathname, params]);

  return null;
}
