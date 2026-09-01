'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

function ForgotForm() {
  const { t } = useApp();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      setDevToken(data.devToken || '');
      setSent(true);
    } catch (e) { setSent(true); } finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 51px)', display: 'grid', placeItems: 'center', padding: '40px 20px' }}>
      <div className="anim-in" style={{ width: 'min(440px, 100%)' }}>
        <div className="panel" style={{ padding: 32 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700 }}>{t.forgotTitle}</h1>
          <p style={{ margin: '0 0 22px', color: 'var(--muted)', fontSize: 14.5 }}>{t.forgotSub}</p>

          {sent ? (
            <div>
              <div style={{ background: '#e9f7ef', color: '#1b7a44', borderRadius: 10, padding: '12px 14px', fontSize: 13.5, marginBottom: 16 }}>
                {t.resetSent}
              </div>
              {devToken && (
                <div style={{ marginBottom: 16 }}>
                  <label className="label">{t.resetToken} (demo)</label>
                  <div className="mono" style={{ wordBreak: 'break-all', fontSize: 12, background: 'var(--paper)', border: '1.5px solid var(--line)', borderRadius: 8, padding: '8px 10px' }}>{devToken}</div>
                </div>
              )}
              <Link href={devToken ? `/reset?token=${devToken}` : '/reset'} className="btn btn-primary-lg" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                {t.resetPassword} →
              </Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <label className="label">{t.emailLabel}</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 18 }} required />
              <button type="submit" className="btn btn-primary-lg" disabled={busy}>{busy ? '…' : `${t.sendResetLink} →`}</button>
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

export default function ForgotPage() {
  return <Suspense fallback={null}><ForgotForm /></Suspense>;
}
