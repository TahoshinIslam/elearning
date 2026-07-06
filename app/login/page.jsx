'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';

const ROLES = [
  { key: 'student', labelKey: 'roleStudent', route: '/student', icon: '🎓' },
  { key: 'teacher', labelKey: 'roleTeacher', route: '/teacher', icon: '📘' },
  { key: 'parent', labelKey: 'roleParent', route: '/parent', icon: '👪' },
  { key: 'owner', labelKey: 'roleOwner', route: '/owner', icon: '🏫' },
  { key: 'superadmin', labelKey: 'roleSuper', route: '/superadmin', icon: '🛡️' }
];

function LoginForm() {
  const { t, login, centerDisplay } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const initial = ROLES.find((r) => r.key === params.get('role'))?.key || 'student';
  const [role, setRole] = useState(initial);

  const submit = (e) => {
    e.preventDefault();
    login(role);
    // honor a return URL (e.g. a course the guest was trying to enroll in), else the role's dashboard
    const returnTo = params.get('returnTo');
    const dest = returnTo || ROLES.find((r) => r.key === role)?.route || '/';
    router.push(dest);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 51px)', display: 'grid', placeItems: 'center', padding: '40px 20px' }}>
      <div className="anim-in" style={{ width: 'min(440px, 100%)' }}>
        {/* brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 10, background: 'var(--brand)', color: '#fff',
              display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20
            }}
          >
            L
          </div>
          <div className="display" style={{ fontSize: 20, letterSpacing: '.02em' }}>LEO LEARNING</div>
        </div>

        <div className="panel" style={{ padding: 32 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700 }}>{t.loginTitle}</h1>
          <p style={{ margin: '0 0 22px', color: 'var(--muted)', fontSize: 14.5 }}>{t.loginSub}</p>

          {/* role selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
            {ROLES.map((r) => {
              const active = role === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'left', padding: '12px 14px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: active ? 'var(--brand-wash)' : 'var(--paper)',
                    border: active ? '2px solid var(--brand)' : '1.5px solid var(--line)',
                    color: active ? 'var(--brand-deep)' : 'var(--ink-soft)'
                  }}
                >
                  <span style={{ fontSize: 18 }}>{r.icon}</span>
                  {t[r.labelKey]}
                </button>
              );
            })}
          </div>

          <form onSubmit={submit}>
            <label className="label">{t.emailOrPhone}</label>
            <input className="input" defaultValue="demo@leolearning.app" style={{ marginBottom: 14 }} />
            <label className="label">{t.password}</label>
            <input className="input" type="password" defaultValue="demo1234" style={{ marginBottom: 22 }} />
            <button type="submit" className="btn btn-primary-lg">{t.loginBtn} →</button>
          </form>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12.5, color: 'var(--faint)' }}>{t.demoNote}</div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Link href="/landing" style={{ color: 'var(--muted)', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>
            ← {t.backToSite}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
