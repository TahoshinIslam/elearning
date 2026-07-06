'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';

const NAV = [
  { href: '/landing', key: 'landing' },
  { href: '/login', key: 'loginCta' },
  { href: '/onboarding', key: 'onboard' },
  { href: '/owner', key: 'owner' },
  { href: '/teacher', key: 'teacher' },
  { href: '/student', key: 'student' },
  { href: '/parent', key: 'parent' },
  { href: '/superadmin', key: 'superadmin' }
];

export default function PrototypeBar() {
  const { t, lang, toggleLang } = useApp();
  const pathname = usePathname();

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 20px',
        background: 'var(--coal)',
        color: '#fff',
        flexWrap: 'wrap'
      }}
    >
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: '#fff' }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'var(--brand)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 16
          }}
        >
          L
        </div>
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, letterSpacing: '.02em' }}>
            LEO LEARNING
          </div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.55)' }}>{t.proto}</div>
        </div>
      </Link>

      <nav style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 8 }}>
        {NAV.map(({ href, key }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                textDecoration: 'none',
                borderRadius: 99,
                padding: '6px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                background: active ? 'var(--brand)' : 'rgba(255,255,255,.09)',
                color: active ? '#fff' : 'rgba(255,255,255,.75)',
                transition: 'background .15s ease'
              }}
            >
              {t[key]}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleLang}
        style={{
          marginLeft: 'auto',
          border: '1px solid rgba(255,255,255,.28)',
          background: 'none',
          color: '#fff',
          borderRadius: 99,
          padding: '5px 14px',
          fontSize: 12.5,
          fontWeight: 600
        }}
      >
        {lang === 'bn' ? 'EN' : 'বাং'}
      </button>
    </div>
  );
}
