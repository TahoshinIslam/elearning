'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { copy, dateLabel } from '@/lib/copy';

// One review per verified purchaser (or free-course learner) per course.
// The server decides eligibility and stores it; editing sends the review
// back to moderation, so only checked reviews are ever public.
export default function ReviewForm({ courseId }) {
  const { lang, api, showToast } = useApp();
  const c = copy(lang);
  const en = lang === 'en';
  const [state, setState] = useState(null); // { eligible, review }
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/reviews?mine=1&courseId=${courseId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { eligible: false }))
      .then((d) => { if (!live) return; setState(d); if (d.review) { setRating(d.review.rating); setText(d.review.text || ''); } else setEditing(true); })
      .catch(() => live && setState({ eligible: false }));
    return () => { live = false; };
  }, [courseId]);

  if (!state || !state.eligible) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { setError(en ? 'Choose a rating.' : 'রেটিং বাছাই করুন।'); return; }
    setBusy(true); setError(null);
    try {
      const review = await api.submitReview(courseId, rating, text.trim());
      setState((s) => ({ ...s, review: { ...(s.review || {}), ...review, rating, text: text.trim(), status: 'pending' } }));
      setEditing(false);
      showToast(en ? 'Review submitted for approval.' : 'রিভিউ অনুমোদনের জন্য জমা হয়েছে।', 'success');
    } catch (err) {
      setError(err?.data?.error === 'rate_limited' ? (en ? 'Too many attempts — try later.' : 'অনেকবার চেষ্টা হয়েছে — পরে চেষ্টা করুন।') : (en ? 'Couldn’t submit the review.' : 'রিভিউ জমা দেওয়া যায়নি।'));
    } finally { setBusy(false); }
  };

  const r = state.review;
  if (r && !editing) {
    return (
      <div className="surface surface-pad stack" style={{ '--gap': '10px' }}>
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', '--gap': '8px' }}>
          <h3 className="h4">{c.yourReview}</h3>
          <span className={`badge ${r.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>{r.status === 'approved' ? c.reviewLive : c.reviewPending}</span>
        </div>
        <div className="row" style={{ '--gap': '2px', color: '#B45309' }} role="img" aria-label={`${r.rating} / 5`}>
          {[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" size={18} style={{ opacity: n <= r.rating ? 1 : 0.25 }} />)}
        </div>
        {r.text && <p style={{ color: 'var(--ink-2)' }}>{r.text}</p>}
        {r.updatedAt && <p className="xsmall muted">{dateLabel(lang, r.updatedAt)}</p>}
        <div><button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Icon name="edit" size={14} />{c.editReview}</button></div>
      </div>
    );
  }

  return (
    <form className="surface surface-pad stack" onSubmit={submit} noValidate>
      <h3 className="h4">{r ? c.editReview : (en ? 'Review this course' : 'কোর্সটির রিভিউ দিন')}</h3>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label">{en ? 'Your rating' : 'আপনার রেটিং'}</legend>
        <div className="row star-input" style={{ '--gap': '2px' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} style={{ cursor: 'pointer', color: n <= rating ? '#B45309' : 'var(--border-strong)' }}>
              <input type="radio" name={`rating-${courseId}`} value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
              <Icon name="star" size={28} label={`${n} / 5`} />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor={`review-${courseId}`}>{en ? 'Your review (optional)' : 'আপনার মতামত (ঐচ্ছিক)'}</label>
        <textarea id={`review-${courseId}`} className="textarea" rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
      </div>
      {r && <p className="xsmall muted">{en ? 'Edited reviews are checked again before they appear.' : 'সম্পাদিত রিভিউ আবার যাচাইয়ের পর প্রকাশিত হয়।'}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="row" style={{ '--gap': '8px' }}>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy && <span className="spinner" aria-hidden="true" />}{en ? 'Submit review' : 'রিভিউ জমা দিন'}</button>
        {r && <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); setRating(r.rating); setText(r.text || ''); setError(null); }}>{en ? 'Cancel' : 'বাতিল'}</button>}
      </div>
    </form>
  );
}
