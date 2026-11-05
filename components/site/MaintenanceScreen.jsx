'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import BrandMark from '@/components/ui/BrandMark';

const pad = (n) => String(Math.max(0, n)).padStart(2, '0');
const bn = (v, lang) => (lang === 'en' ? v : String(v).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]));

function parts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

// Full-viewport maintenance page with a live countdown to the time the admin
// set. When it reaches zero the page reloads and the site is back.
export default function MaintenanceScreen({ until, title, message, lang = 'bn', social = [] }) {
  const en = lang === 'en';
  const end = until ? Date.parse(until) : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!end) return undefined;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= end) { clearInterval(id); setTimeout(() => window.location.reload(), 1200); }
    }, 1000);
    return () => clearInterval(id);
  }, [end]);
  const left = end ? end - now : null;
  const p = left != null ? parts(left) : null;
  const units = en ? ['Days', 'Hours', 'Minutes', 'Seconds'] : ['দিন', 'ঘণ্টা', 'মিনিট', 'সেকেন্ড'];
  return (
    <main id="main" className="status-screen is-503 maint">
      <div className="status-top">
        <span className="brand"><BrandMark /><span className="brand-word">Leo <span className="sticker">Learning</span></span></span>
        <Link href="/login" className="btn btn-ghost btn-sm"><Icon name="lock" size={14} />{en ? 'Staff login' : 'স্টাফ লগইন'}</Link>
      </div>
      <div className="status-body">
        <span className="maint-icon" aria-hidden="true"><Icon name="settings" size={46} /></span>
        <p className="eyebrow"><span className="sticker sticker-cyan">{en ? 'Scheduled maintenance' : 'নির্ধারিত রক্ষণাবেক্ষণ'}</span></p>
        <h1 className="status-title">{title || (en ? 'We’re upgrading the classroom' : 'আমরা ক্লাসরুম আপগ্রেড করছি')}</h1>
        <p className="status-msg">{message || (en ? 'Leo Learning is getting better. Your courses and progress are safe — we’ll be back shortly.' : 'লিও লার্নিং আরও ভালো হচ্ছে। আপনার কোর্স ও অগ্রগতি নিরাপদ — খুব শিগগিরই ফিরছি।')}</p>
        {p && (
          <div className="countdown" role="timer" aria-live="off" aria-label={en ? 'Time until we are back' : 'ফিরে আসা পর্যন্ত সময়'}>
            {[p.d, p.h, p.m, p.s].map((v, i) => (i === 0 && v === 0 ? null : (
              <div key={i} className="cd-unit"><span className="cd-num tabular">{bn(pad(v), lang)}</span><span className="cd-label">{units[i]}</span></div>
            )))}
          </div>
        )}
        {left != null && left <= 0 && <p className="strong">{en ? 'Back now — reloading…' : 'ফিরে এসেছি — রিলোড হচ্ছে…'}</p>}
        {end && <p className="status-ref">{en ? 'Back online at' : 'আবার চালু হবে'} {new Date(end).toLocaleString(en ? 'en-GB' : 'bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
        {social.length > 0 && (
          <ul className="footer-social maint-social" aria-label="Social">
            {social.map((l) => <li key={l.key}><a href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label}><Icon name={l.icon} size={20} /></a></li>)}
          </ul>
        )}
      </div>
      <div className="status-shapes" aria-hidden="true"><i /><i /><i /><i /></div>
    </main>
  );
}
