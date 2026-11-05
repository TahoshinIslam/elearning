'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';

const LEN = 6;
const bn = (v) => String(v).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const T = {
  bn: {
    title: 'ইমেইল চেক করুন', sent: (m) => <>৬ অঙ্কের একটি কোড পাঠানো হয়েছে <strong>{m}</strong> ঠিকানায়।</>,
    expires: 'কোডের মেয়াদ', expired: 'কোডের মেয়াদ শেষ', attempts: (n) => `আর ${bn(n)} বার চেষ্টা করা যাবে`, digit: (i) => `অঙ্ক ${bn(i)} / ৬`,
    hint: 'কোডটি লিখুন বা পেস্ট করুন। ৬ নম্বর অঙ্ক দিলেই নিজে থেকে যাচাই হবে।', verify: 'কোড যাচাই করুন', verifying: 'যাচাই হচ্ছে…',
    ok: 'কোড সঠিক — এগিয়ে যাচ্ছি…', wrong: (n) => `কোড মেলেনি। আর ${bn(n)} বার চেষ্টা করা যাবে।`, locked: 'অনেকবার ভুল হয়েছে — নতুন কোড নিন।', expiredMsg: 'মেয়াদ শেষ — নতুন কোড নিন।',
    paste: 'কোড পেস্ট', noClip: 'ক্লিপবোর্ডে ৬ অঙ্কের কোড পাওয়া যায়নি', didnt: 'কোড পাননি?', resendIn: (t) => `আবার পাঠান ${t}`, resend: 'আবার পাঠান', sentAgain: 'নতুন কোড পাঠানো হয়েছে',
    demo: 'ডেমো মোড', autofill: 'অটোফিল', inbox: 'ইনবক্স খুলুন', restart: 'ইমেইল বদলান'
  },
  en: {
    title: 'Check your email', sent: (m) => <>We sent a 6-digit code to <strong>{m}</strong>.</>,
    expires: 'Code expires in', expired: 'Code expired', attempts: (n) => `${n} attempt${n === 1 ? '' : 's'} left`, digit: (i) => `Digit ${i} of 6`,
    hint: 'Type or paste the code. It checks itself after the 6th digit.', verify: 'Verify code', verifying: 'Verifying…',
    ok: 'Code verified — continuing…', wrong: (n) => `That code didn’t match. ${n} attempt${n === 1 ? '' : 's'} left.`, locked: 'Too many wrong tries — get a new code.', expiredMsg: 'Expired — get a new code.',
    paste: 'Paste code', noClip: 'No 6-digit code on the clipboard', didnt: 'Didn’t get it?', resendIn: (t) => `Resend in ${t}`, resend: 'Resend code', sentAgain: 'A new code is on its way',
    demo: 'Demo mode', autofill: 'Autofill', inbox: 'Open inbox', restart: 'Change email'
  }
};
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;

// Six-box one-time-code entry, styled for the notebook look:
//  ring countdown, masked address, expiry + attempts meter, auto-advance,
//  paste anywhere, self-submit on the 6th digit, resend cooldown bar, and a
//  demo strip (autofill + demo inbox) while mail is not really delivered.
// Props: info = response of /api/auth/otp/request; onVerify(code) → resolves
// on success or throws an Error with .data = { error, attemptsLeft }.
export default function OtpCode({ info, onVerify, onResend, onRestart, lang = 'bn' }) {
  const t = T[lang === 'en' ? 'en' : 'bn'];
  const [digits, setDigits] = useState(Array(LEN).fill(''));
  const [left, setLeft] = useState(info.expiresIn);
  const [resendLeft, setResendLeft] = useState(info.resendIn);
  const [attempts, setAttempts] = useState(info.attemptsLeft);
  const [state, setState] = useState('idle'); // idle | checking | ok | wrong | locked | expired
  const [msg, setMsg] = useState('');
  const boxes = useRef([]);
  const started = useRef(Date.now());

  // reset everything when a new code is issued
  useEffect(() => {
    setDigits(Array(LEN).fill('')); setLeft(info.expiresIn); setResendLeft(info.resendIn);
    setAttempts(info.attemptsLeft); setState('idle'); setMsg('');
    started.current = Date.now();
    setTimeout(() => boxes.current[0]?.focus(), 50);
  }, [info]);

  useEffect(() => {
    const id = setInterval(() => {
      const gone = Math.floor((Date.now() - started.current) / 1000);
      setLeft(Math.max(0, info.expiresIn - gone));
      setResendLeft(Math.max(0, info.resendIn - gone));
    }, 250);
    return () => clearInterval(id);
  }, [info]);

  useEffect(() => { if (left === 0 && state !== 'ok') { setState('expired'); setMsg(t.expiredMsg); } }, [left, state, t]);

  const submit = useCallback(async (code) => {
    if (code.length !== LEN || state === 'checking' || state === 'ok' || state === 'locked' || state === 'expired') return;
    setState('checking'); setMsg('');
    try {
      await onVerify(code);
      setState('ok'); setMsg(t.ok);
    } catch (e) {
      const d = e?.data || {};
      if (d.error === 'otp_expired') { setState('expired'); setMsg(t.expiredMsg); return; }
      const n = Number(d.attemptsLeft ?? Math.max(0, attempts - 1));
      setAttempts(n);
      if (d.error === 'otp_locked' || n <= 0) { setState('locked'); setMsg(t.locked); return; }
      setState('wrong'); setMsg(t.wrong(n));
      setDigits(Array(LEN).fill(''));
      setTimeout(() => boxes.current[0]?.focus(), 30);
    }
  }, [attempts, onVerify, state, t]);

  const fill = (start, text) => {
    const clean = String(text).replace(/\D/g, '').slice(0, LEN - start);
    if (!clean) return;
    const next = [...digits];
    for (let i = 0; i < clean.length; i++) next[start + i] = clean[i];
    setDigits(next);
    if (state === 'wrong') setState('idle');
    const nextIdx = Math.min(LEN - 1, start + clean.length);
    boxes.current[nextIdx]?.focus();
    const code = next.join('');
    if (code.length === LEN && !next.includes('')) submit(code);
  };

  const onKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) next[i] = '';
      else if (i > 0) { next[i - 1] = ''; boxes.current[i - 1]?.focus(); }
      setDigits(next);
    } else if (e.key === 'ArrowLeft' && i > 0) boxes.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < LEN - 1) boxes.current[i + 1]?.focus();
    else if (e.key === 'Enter') submit(digits.join(''));
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (/\d{6}/.test(text.replace(/\s/g, ''))) fill(0, text.replace(/\s/g, '').match(/\d{6}/)[0]);
      else setMsg(t.noClip);
    } catch { setMsg(t.noClip); }
  };

  const resend = async () => {
    if (resendLeft > 0) return;
    await onResend();
    setMsg(t.sentAgain);
  };

  const ratio = Math.max(0, left / info.expiresIn);
  const R = 52;
  const C = 2 * Math.PI * R;
  const done = state === 'ok';
  const blocked = state === 'locked' || state === 'expired';
  const code = digits.join('');

  return (
    <div className={`otp is-${state}`}>
      <div className="otp-card">
        <div className={`otp-ring ${left <= 30 && !done ? 'is-low' : ''}`} aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={R} className="otp-ring-track" />
            <circle cx="60" cy="60" r={R} className="otp-ring-time" strokeDasharray={`${C * ratio} ${C}`} transform="rotate(-90 60 60)" />
            <circle cx="60" cy="60" r="40" className="otp-ring-dash" />
          </svg>
          <span className="otp-ring-icon"><Icon name={done ? 'check' : blocked ? 'alert' : 'mail'} size={30} /></span>
        </div>
        <h1 className="otp-title">{t.title}</h1>
        <p className="otp-sub">{t.sent(info.masked)}</p>

        <div className="otp-meta">
          <span className={`otp-expiry ${blocked ? 'is-off' : ''}`}>
            <span className="otp-dot" aria-hidden="true" />
            {state === 'expired' ? t.expired : <>{t.expires} <strong className="tabular">{clock(left)}</strong></>}
          </span>
          <span className="otp-attempts" aria-label={t.attempts(attempts)}>
            {Array.from({ length: info.attemptsLeft }).map((_, i) => <i key={i} className={i < attempts ? 'on' : ''} aria-hidden="true" />)}
            {t.attempts(attempts)}
          </span>
        </div>

        <div className="otp-tear" aria-hidden="true" />

        <fieldset className="otp-boxes" disabled={blocked || done || state === 'checking'}>
          <legend className="sr-only">{t.hint}</legend>
          {digits.map((d, i) => (
            <input key={i} ref={(el) => { boxes.current[i] = el; }} className={`otp-box ${d ? 'is-filled' : ''}`}
              type="text" inputMode="numeric" pattern="[0-9]*" maxLength={LEN} autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={t.digit(i + 1)} value={d}
              onChange={(e) => fill(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              onPaste={(e) => { e.preventDefault(); fill(i, e.clipboardData.getData('text')); }}
              onFocus={(e) => e.target.select()} />
          ))}
        </fieldset>

        <p className={`otp-msg ${state === 'ok' ? 'is-ok' : state === 'idle' || state === 'checking' ? '' : 'is-bad'}`} role="status" aria-live="polite">
          {msg || t.hint}
        </p>

        <button type="button" className="btn btn-primary btn-lg btn-block" disabled={code.length !== LEN || blocked || done || state === 'checking'} onClick={() => submit(code)} aria-busy={state === 'checking'}>
          {state === 'checking' ? <><span className="spinner" aria-hidden="true" />{t.verifying}</> : done ? <><Icon name="checkCircle" size={18} />{t.ok.split(' — ')[0]}</> : t.verify}
        </button>

        <div className="otp-foot">
          <button type="button" className="btn btn-ghost btn-sm" onClick={pasteFromClipboard} disabled={blocked || done}><Icon name="file" size={15} />{t.paste}</button>
          <div className="otp-resend">
            <span className="muted">{t.didnt}</span>{' '}
            {resendLeft > 0 && !blocked
              ? <span className="strong tabular">{t.resendIn(clock(resendLeft))}</span>
              : <button type="button" className="link otp-resend-btn" onClick={resend} disabled={done}>{t.resend}</button>}
            <span className="otp-resend-bar" aria-hidden="true"><span style={{ width: `${(1 - resendLeft / info.resendIn) * 100}%` }} /></span>
          </div>
        </div>
      </div>

      {(info.demoCode || onRestart) && (
        <div className="otp-demo">
          {info.demoCode && <span className="badge badge-info">{t.demo}</span>}
          {info.demoCode && <button type="button" className="btn btn-ghost btn-sm" onClick={() => fill(0, info.demoCode)} disabled={blocked || done}>{t.autofill} <strong className="tabular">{info.demoCode}</strong></button>}
          {info.demoCode && <Link className="btn btn-ghost btn-sm" href="/dev/mailbox" target="_blank"><Icon name="mail" size={14} />{t.inbox}</Link>}
          {onRestart && <button type="button" className="btn btn-ghost btn-sm" onClick={onRestart}><Icon name="refresh" size={14} />{t.restart}</button>}
        </div>
      )}
    </div>
  );
}
