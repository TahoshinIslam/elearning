'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { copy } from '@/lib/copy';

// "Notify me" for an announced upcoming course — stored in course_waitlist.
export default function WaitlistForm({ courseId, lang, signedInEmail }) {
  const c = copy(lang);
  const [email, setEmail] = useState('');
  const [state, setState] = useState(null); // 'busy' | 'done' | error text
  const submit = async (e) => {
    e.preventDefault();
    setState('busy');
    try {
      const res = await fetch(`/api/courses/${courseId}/waitlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setState('done');
    } catch (err) {
      setState(err.message === 'invalid_email' ? c.err_invalid_email || (lang === 'en' ? 'Enter a valid email.' : 'সঠিক ইমেইল দিন।') : err.message === 'rate_limited' ? (lang === 'en' ? 'Too many attempts — try later.' : 'অনেকবার চেষ্টা হয়েছে — পরে চেষ্টা করুন।') : c.err_generic);
    }
  };
  if (state === 'done') return <div className="notice notice-success" role="status"><Icon name="checkCircle" size={18} />{c.notifyDone}</div>;
  return (
    <form className="stack" style={{ '--gap': '10px' }} onSubmit={submit} noValidate>
      {!signedInEmail && (
        <div className="field"><label htmlFor="wl-email">{c.notifyEmail}</label><input id="wl-email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      )}
      {state && state !== 'busy' && <p className="field-error" role="alert">{state}</p>}
      <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={state === 'busy'}>{state === 'busy' ? <span className="spinner" aria-hidden="true" /> : <Icon name="bell" size={17} />}{c.notifyMe}</button>
    </form>
  );
}
