'use client';

import { useEffect } from 'react';
import BrandMark from '@/components/ui/BrandMark';

// First-load splash. Pure CSS timing: it fades out on its own (~0.9 s) even
// if JavaScript is slow or off, so it can never block the page. JS only
// remembers (session cookie) that it was shown, so later full reloads in the
// same visit skip it.
export function Splash() {
  useEffect(() => { try { document.cookie = 'leo_splash=1; path=/; samesite=lax'; } catch { /* ignore */ } }, []);
  return (
    <div className="splash" aria-hidden="true">
      <div className="splash-mark"><BrandMark size={72} /></div>
      <div className="splash-word">LEO <span className="sticker">LEARNING</span></div>
      <div className="splash-bar"><span /></div>
    </div>
  );
}
