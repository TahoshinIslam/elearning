'use client';

import { useId, useState } from 'react';
import Icon from '@/components/Icon';

const RULES = [
  { key: 'len', test: (v) => v.length >= 8, label: { en: '8+ chars', bn: '৮+ অক্ষর' } },
  { key: 'up', test: (v) => /[A-Z]/.test(v), label: { en: 'A-Z', bn: 'A-Z' } },
  { key: 'low', test: (v) => /[a-z]/.test(v), label: { en: 'a-z', bn: 'a-z' } },
  { key: 'num', test: (v) => /\d/.test(v), label: { en: '123', bn: '123' } },
  { key: 'sym', test: (v) => /[^A-Za-z0-9\s]/.test(v), label: { en: '@#$', bn: '@#$' } }
];
// A few passwords that pass the character rules but are guessed first.
const COMMON = /^(password|passw0rd|qwerty|letmein|welcome|admin|iloveyou|12345678|abc12345|bangladesh)/i;

const LEVELS = {
  en: ['Too short', 'Weak', 'Fair', 'Good', 'Strong'],
  bn: ['খুব ছোট', 'দুর্বল', 'মাঝারি', 'ভালো', 'শক্তিশালী']
};

// 0 = empty/too short, 1 weak, 2 fair, 3 good, 4 strong
export function passwordStrength(v = '') {
  const passed = RULES.map((r) => r.test(v));
  if (!v) return { level: 0, passed };
  if (v.length < 8) return { level: 0, passed };
  const n = passed.filter(Boolean).length;
  let level = n <= 2 ? 1 : n === 3 ? 2 : n === 4 ? 3 : 4;
  if (v.length >= 14 && level < 4) level += 1; // long passphrases earn a step
  if (COMMON.test(v) || /^(.)\1+$/.test(v)) level = 1;
  return { level, passed };
}

// Password input with show/hide and, for new passwords, a live strength
// meter: rule chips (8 chars, A-Z, a-z, 123, @#$) and a 4-step bar.
export default function PasswordInput({ id, label, value, onChange, autoComplete = 'new-password', lang = 'bn', meter = false, error, hint, required = true, extra, ...rest }) {
  const auto = useId();
  const fid = id || auto;
  const [show, setShow] = useState(false);
  const en = lang === 'en';
  const { level, passed } = passwordStrength(value || '');
  const lv = (en ? LEVELS.en : LEVELS.bn)[level];
  const describedBy = [hint && `${fid}-hint`, meter && `${fid}-meter`, error && `${fid}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      {label && <label htmlFor={fid} className={required ? 'req' : undefined}>{label}</label>}
      <div className="pw-wrap">
        <div className="pw-box">
          <input id={fid} className="input" type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} required={required}
            aria-invalid={!!error} aria-describedby={describedBy} spellCheck={false} autoCapitalize="off" {...rest} />
          <button type="button" className="pw-eye" data-confirm="off" onClick={() => setShow((s) => !s)} aria-label={show ? (en ? 'Hide password' : 'পাসওয়ার্ড লুকান') : (en ? 'Show password' : 'পাসওয়ার্ড দেখান')} aria-pressed={show}>
            <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
          </button>
        </div>
        {extra}
      </div>
      {meter && (
        <div id={`${fid}-meter`} className={`pw-meter lv-${level} ${value ? 'has-value' : ''}`}>
          <div className="pw-meter-head">
            <span className="pw-meter-title">{en ? 'Password strength' : 'পাসওয়ার্ডের শক্তি'}</span>
            <strong className="pw-meter-level" aria-live="polite">{value ? lv : '—'}</strong>
          </div>
          <div className="pw-bars" aria-hidden="true">{[1, 2, 3, 4].map((i) => <i key={i} className={level >= i ? 'on' : ''} />)}</div>
          <ul className="pw-rules">
            {RULES.map((r, i) => (
              <li key={r.key} className={passed[i] ? 'ok' : ''}>
                <Icon name={passed[i] ? 'check' : 'x'} size={12} />
                <span>{r.label[en ? 'en' : 'bn']}</span>
                <span className="sr-only">{passed[i] ? (en ? ' met' : ' পূরণ হয়েছে') : (en ? ' missing' : ' বাকি')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {hint && <p id={`${fid}-hint`} className="help">{hint}</p>}
      {error && <p id={`${fid}-err`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}
