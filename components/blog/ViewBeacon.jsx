'use client';

import { useEffect } from 'react';

// Counts one view per article per browser session (after the page is shown).
export default function ViewBeacon({ slug }) {
  useEffect(() => {
    const key = `leo_read_${slug}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch { /* private mode: still count */ }
    const t = setTimeout(() => { fetch(`/api/blog/${encodeURIComponent(slug)}`, { method: 'POST', keepalive: true }).catch(() => {}); }, 1500);
    return () => clearTimeout(t);
  }, [slug]);
  return null;
}
