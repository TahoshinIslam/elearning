'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { ROLE_HOME } from '@/lib/rbac';

// Demo accounts seeded by database/seed_users.mjs (all password: demo1234).
const DEMO_ACCOUNTS = [
  { key: 'student', labelKey: 'roleStudent', email: 'student@leolearning.app', icon: 'cap' },
  { key: 'teacher', labelKey: 'roleTeacher', email: 'teacher@leolearning.app', icon: 'book' },
  { key: 'owner', labelKey: 'roleOwner', email: 'owner@leolearning.app', icon: 'building' },
  { key: 'superadmin', labelKey: 'roleSuper', email: 'superadmin@leolearning.app', icon: 'shield' }
];
const DEMO_PASSWORD = 'demo1234';

const ERR = { invalid_credentials: 'errInvalidCreds', account_disabled: 'errGeneric' };

function LoginForm() {
  const { t, login, showToast } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const go = (user) => {
    const returnTo = params.get('returnTo');
    router.push(returnTo || ROLE_HOME[user.role] || '/');
  };

  const submit = async (e, creds) => {
    if (e) e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(creds?.email ?? email, creds?.password ?? password);
      showToast(t.signedIn || 'Signed in', 'success');
      go(user);
    } catch (err) {
      setError(t[ERR[err.message]] || t.errInvalidCreds);
      setBusy(false);
    }
  };

  const quick = (acct) => {
    setEmail(acct.email);
    setPassword(DEMO_PASSWORD);
    submit(null, { email: acct.email, password: DEMO_PASSWORD });
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 51px)', display: 'grid', placeItems: 'center', padding: '40px 20px' }}>
      <div className="anim-in" style={{ width: 'min(440px, 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20 }}>L</div>
          <div className="display" style={{ fontSize: 20, letterSpacing: '.02em' }}>LEO LEARNING</div>
        </div>

        <div className="panel" style={{ padding: 32 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700 }}>{t.loginTitle}</h1>
          <p style={{ margin: '0 0 22px', color: 'var(--muted)', fontSize: 14.5 }}>{t.signInSub}</p>

          <form onSubmit={submit}>
            <label className="label">{t.emailLabel}</label>
            <input className="input" type="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ marginBottom: 14 }} />
            <label className="label">{t.password}</label>
            <input className="input" type="password" autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ marginBottom: 8 }} />

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Link href="/forgot" style={{ color: 'var(--muted)', fontSize: 12.5, fontWeight: 600, textDecoration: 'none' }}>
                {t.forgotLink}
              </Link>
            </div>

            {error && (
              <div style={{ background: '#fdecec', color: '#c92a2a', borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary-lg" disabled={busy}>
              {busy ? t.signingIn : `${t.loginBtn} →`}
            </button>
          </form>

          <div style={{ textAlign: 'center', margin: '18px 0 12px', fontSize: 12.5, color: 'var(--faint)' }}>{t.quickDemo}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.key} type="button" onClick={() => quick(a)} disabled={busy}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--paper)', border: '1.5px solid var(--line)', color: 'var(--ink-soft)' }}>
                <Icon name={a.icon} size={16} />{t[a.labelKey]}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13.5, color: 'var(--muted)' }}>
            {t.noAccount}{' '}
            <Link href="/register" style={{ color: 'var(--brand-deep)', fontWeight: 700, textDecoration: 'none' }}>{t.createAccount}</Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Link href="/landing" style={{ color: 'var(--muted)', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>← {t.backToSite}</Link>
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
