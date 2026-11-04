'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { copy } from '@/lib/copy';
import { safeReturnTo } from '@/lib/safeRedirect';
import { ROLE_HOME } from '@/lib/rbac';

function Shell({ title, sub, children, footer, icon = 'user', tone = '' }) {
  return (
    <main id="main" className="auth-shell">
      <div className="surface surface-raised auth-card anim-in">
        <div className="stack" style={{ '--gap': '8px', marginBottom: 28, alignItems: 'center', textAlign: 'center' }}>
          <span className={`auth-icon ${tone}`} aria-hidden="true"><Icon name={icon} size={28} /></span>
          <h1 className="h2" style={{ marginTop: 16 }}>{title}</h1>
          {sub && <p className="muted" style={{ fontWeight: 600 }}>{sub}</p>}
        </div>
        {children}
        {footer && <div className="small muted" style={{ marginTop: 22, textAlign: 'center' }}>{footer}</div>}
      </div>
    </main>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete, c, error, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input id={id} className="input" type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} required
          aria-invalid={!!error} aria-describedby={[hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined} style={{ paddingRight: 48 }} />
        <button type="button" className="btn btn-ghost btn-icon btn-sm" style={{ position: 'absolute', right: 5, top: 5 }} onClick={() => setShow((s) => !s)} aria-label={show ? c.hidePw : c.showPw} aria-pressed={show}>
          <Icon name={show ? 'eye' : 'lock'} size={17} />
        </button>
      </div>
      {hint && <p id={`${id}-hint`} className="help">{hint}</p>}
      {error && <p id={`${id}-err`} className="field-error">{error}</p>}
    </div>
  );
}

const DEMO = [
  { label: 'Student', email: 'student@leolearning.app' },
  { label: 'Teacher', email: 'teacher@leolearning.app' },
  { label: 'Owner', email: 'owner@leolearning.app' },
  { label: 'Superadmin', email: 'superadmin@leolearning.app' }
];

export function LoginForm({ returnTo, showDemo }) {
  const { lang, login, showToast } = useApp();
  const c = copy(lang);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const target = safeReturnTo(returnTo, '');

  const submit = async (e, creds) => {
    e?.preventDefault();
    const em = creds?.email ?? email, pw = creds?.password ?? password;
    if (!em || !pw) { setError(c.required); return; }
    setError(''); setBusy(true);
    try {
      const user = await login(em, pw);
      router.replace(target || (user.role === 'student' ? '/student' : ROLE_HOME[user.role] || '/'));
      router.refresh();
    } catch (err) {
      setError(c[`err_${err.message}`] || c.err_invalid_credentials);
      setBusy(false);
    }
  };

  return (
    <Shell icon="lock" tone="is-login" title={c.loginTitle} sub={target ? c.returnNote : c.loginSub}
      footer={<>{c.noAccount} <Link className="link" href={`/register${target ? `?returnTo=${encodeURIComponent(target)}` : ''}`}>{c.signup}</Link></>}>
      <form className="stack" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="email">{c.email}</label>
          <input id="email" className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-invalid={!!error} />
        </div>
        <PasswordField id="password" label={c.password} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" c={c} />
        <div style={{ textAlign: 'right', marginTop: -6 }}><Link href="/forgot" className="small link">{c.forgot}</Link></div>
        {error && <div className="notice notice-danger" role="alert"><Icon name="alert" size={18} />{error}</div>}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy} aria-busy={busy}>{busy && <span className="spinner" aria-hidden="true" />}{c.loginBtn}</button>
      </form>
      {showDemo && (
        <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px dashed var(--border-strong)' }}>
          <p className="xsmall muted strong" style={{ marginBottom: 8 }}>{c.demoAccounts} (demo1234)</p>
          <div className="cluster" style={{ '--gap': '6px' }}>
            {DEMO.map((d) => <button key={d.email} type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => submit(null, { email: d.email, password: 'demo1234' })}>{d.label}</button>)}
          </div>
        </div>
      )}
    </Shell>
  );
}

export function RegisterForm({ returnTo, referral }) {
  const { lang, register } = useApp();
  const c = copy(lang);
  const router = useRouter();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', referralCode: referral || '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const target = safeReturnTo(returnTo, '');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!f.name.trim()) errs.name = c.err_name_required;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) errs.email = c.err_invalid_email;
    if (f.password.length < 8) errs.password = c.err_weak_password;
    setErrors(errs); setError('');
    if (Object.keys(errs).length) { document.getElementById(Object.keys(errs)[0])?.focus(); return; }
    setBusy(true);
    try {
      await register({ name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() || undefined, password: f.password, role: 'student', referralCode: f.referralCode.trim() || undefined });
      router.replace(target || '/student');
      router.refresh();
    } catch (err) {
      const key = err.message;
      if (key === 'email_taken' || key === 'invalid_email') setErrors({ email: c[`err_${key}`] });
      else if (key === 'weak_password') setErrors({ password: c.err_weak_password });
      else setError(c[`err_${key}`] || c.err_generic);
      setBusy(false);
    }
  };

  return (
    <Shell title={c.signupTitle} sub={c.signupSub}
      footer={<>{c.haveAccount} <Link className="link" href={`/login${target ? `?returnTo=${encodeURIComponent(target)}` : ''}`}>{c.login}</Link></>}>
      <form className="stack" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="name">{c.name}</label>
          <input id="name" className="input" autoComplete="name" value={f.name} onChange={set('name')} required aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-err' : undefined} />
          {errors.name && <p id="name-err" className="field-error">{errors.name}</p>}
        </div>
        <div className="field">
          <label htmlFor="email">{c.email}</label>
          <input id="email" className="input" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set('email')} required aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-err' : undefined} />
          {errors.email && <p id="email-err" className="field-error">{errors.email}</p>}
        </div>
        <div className="field">
          <label htmlFor="phone">{c.phone}</label>
          <input id="phone" className="input" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} />
        </div>
        <PasswordField id="password" label={c.password} value={f.password} onChange={set('password')} autoComplete="new-password" c={c} hint={c.pwHint} error={errors.password} />
        {error && <div className="notice notice-danger" role="alert"><Icon name="alert" size={18} />{error}</div>}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy} aria-busy={busy}>{busy && <span className="spinner" aria-hidden="true" />}{c.signupBtn}</button>
        <p className="xsmall muted">{c.agreeTerms.replace(/[।.]$/, '')} — <Link href="/terms" className="link">{c.terms}</Link>, <Link href="/privacy" className="link">{c.privacy}</Link></p>
      </form>
    </Shell>
  );
}

export function ForgotForm() {
  const { lang } = useApp();
  const c = copy(lang);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState(null);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError(c.required); return; }
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setSent(true); setDevToken(data.devToken || null);
    } catch (err) { setError(c[`err_${err.message}`] || c.err_generic); } finally { setBusy(false); }
  };
  return (
    <Shell icon="mail" tone="is-forgot" title={c.forgotTitle} sub={c.forgotSub} footer={<Link className="link" href="/login">{c.login}</Link>}>
      {sent ? (
        <div className="stack">
          <div className="notice notice-success" role="status"><Icon name="mail" size={18} />{c.forgotSent}</div>
          <div className="notice notice-warn"><Icon name="info" size={18} />{c.forgotNoEmail}</div>
          {devToken && <Link className="btn btn-secondary" href={`/reset?token=${devToken}`}>Development: open reset link</Link>}
        </div>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="email">{c.email}</label>
            <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-invalid={!!error} />
          </div>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy && <span className="spinner" aria-hidden="true" />}{c.sendLink}</button>
        </form>
      )}
    </Shell>
  );
}

export function ResetForm({ token }) {
  const { lang } = useApp();
  const c = copy(lang);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError(c.err_weak_password); return; }
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch (err) { setError(c[`err_${err.message}`] || c.err_generic); } finally { setBusy(false); }
  };
  return (
    <Shell icon="shield" tone="is-reset" title={c.resetTitle}>
      {done ? (
        <div className="stack"><div className="notice notice-success" role="status"><Icon name="checkCircle" size={18} />{c.resetDone}</div><Link href="/login" className="btn btn-primary btn-block">{c.loginBtn}</Link></div>
      ) : !token ? (
        <div className="notice notice-danger" role="alert"><Icon name="alert" size={18} />{c.err_invalid_or_expired_token}</div>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          <PasswordField id="password" label={c.newPassword} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" c={c} hint={c.pwHint} error={error} />
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy && <span className="spinner" aria-hidden="true" />}{c.resetBtn}</button>
        </form>
      )}
    </Shell>
  );
}
