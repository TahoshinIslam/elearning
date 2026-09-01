'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ROLE_HOME } from '@/lib/rbac';

const ERR = {
  email_taken: 'errEmailTaken',
  weak_password: 'errWeakPassword',
  invalid_email: 'errInvalidEmail',
  name_required: 'errNameRequired'
};

function RegisterForm() {
  const { t, register, showToast } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', role: 'student', referralCode: params.get('ref') || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError(t.errPwMismatch); return; }
    setBusy(true);
    try {
      const user = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password, role: form.role, referralCode: form.referralCode });
      showToast(t.accountCreated || 'Account created', 'success');
      router.push(ROLE_HOME[user.role] || '/');
    } catch (err) {
      setError(t[ERR[err.message]] || t.errGeneric);
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 51px)', display: 'grid', placeItems: 'center', padding: '40px 20px' }}>
      <div className="anim-in" style={{ width: 'min(440px, 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20 }}>L</div>
          <div className="display" style={{ fontSize: 20, letterSpacing: '.02em' }}>LEO LEARNING</div>
        </div>

        <div className="panel" style={{ padding: 32 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700 }}>{t.registerTitle}</h1>
          <p style={{ margin: '0 0 22px', color: 'var(--muted)', fontSize: 14.5 }}>{t.registerSub}</p>

          <form onSubmit={submit}>
            <label className="label">{t.fullName}</label>
            <input className="input" value={form.name} onChange={set('name')} style={{ marginBottom: 12 }} required />
            <label className="label">{t.emailLabel}</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} style={{ marginBottom: 12 }} required />
            <label className="label">{t.phoneLabel}</label>
            <input className="input" value={form.phone} onChange={set('phone')} style={{ marginBottom: 12 }} />
            <label className="label">{t.password}</label>
            <input className="input" type="password" value={form.password} onChange={set('password')} style={{ marginBottom: 12 }} required />
            <label className="label">{t.confirmPassword}</label>
            <input className="input" type="password" value={form.confirm} onChange={set('confirm')} style={{ marginBottom: 12 }} required />
            <label className="label">{t.referralWith}</label>
            <input className="input" value={form.referralCode} onChange={set('referralCode')} placeholder="LEOXXXXXX" style={{ marginBottom: 18, textTransform: 'uppercase' }} />

            {error && (
              <div style={{ background: '#fdecec', color: '#c92a2a', borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>{error}</div>
            )}

            <button type="submit" className="btn btn-primary-lg" disabled={busy}>{busy ? t.signingIn : `${t.createAccount} →`}</button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13.5, color: 'var(--muted)' }}>
            {t.haveAccount}{' '}
            <Link href="/login" style={{ color: 'var(--brand-deep)', fontWeight: 700, textDecoration: 'none' }}>{t.loginBtn}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={null}><RegisterForm /></Suspense>;
}
