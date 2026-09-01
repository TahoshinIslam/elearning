'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';

function ResetForm() {
  const { t } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError(t.errPwMismatch); return; }
    if (password.length < 6) { setError(t.errWeakPassword); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(t.errBadToken); setBusy(false); return; }
      setDone(true);
      setTimeout(() => router.push('/login'), 1400);
    } catch (e) { setError(t.errGeneric); setBusy(false); }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 51px)', display: 'grid', placeItems: 'center', padding: '40px 20px' }}>
      <div className="anim-in" style={{ width: 'min(440px, 100%)' }}>
        <div className="panel" style={{ padding: 32 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700 }}>{t.resetTitle}</h1>
          <p style={{ margin: '0 0 22px', color: 'var(--muted)', fontSize: 14.5 }}>{t.resetSub}</p>

          {done ? (
            <div style={{ background: '#e9f7ef', color: '#1b7a44', borderRadius: 10, padding: '12px 14px', fontSize: 13.5 }}>
              {t.resetDone}
            </div>
          ) : (
            <form onSubmit={submit}>
              <label className="label">{t.resetToken}</label>
              <input className="input mono" value={token} onChange={(e) => setToken(e.target.value)} style={{ marginBottom: 12, fontSize: 12 }} required />
              <label className="label">{t.password}</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: 12 }} required />
              <label className="label">{t.confirmPassword}</label>
              <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ marginBottom: 18 }} required />

              {error && (
                <div style={{ background: '#fdecec', color: '#c92a2a', borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>{error}</div>
              )}

              <button type="submit" className="btn btn-primary-lg" disabled={busy}>{busy ? '…' : `${t.resetPassword} →`}</button>
            </form>
          )}

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13.5 }}>
            <Link href="/login" style={{ color: 'var(--muted)', fontWeight: 600, textDecoration: 'none' }}>← {t.backToLogin}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPage() {
  return <Suspense fallback={null}><ResetForm /></Suspense>;
}
