'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

// Inline "write a review" form shown to logged-in students on a course page.
// Submitted reviews are 'pending' until an admin approves them.
export default function ReviewForm({ courseId }) {
  const { t, api, showToast } = useApp();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!text.trim()) { showToast(t.reviewNeedText); return; }
    setBusy(true);
    try {
      await api.submitReview(courseId, rating, text.trim());
      setDone(true);
      showToast(t.reviewThanks);
    } catch { showToast(t.errGeneric); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="card" style={{ padding: '16px 18px', marginTop: 12, background: 'var(--green-chip-bg)', color: 'var(--green-chip-fg)', fontWeight: 600, fontSize: 13.5 }}>
        ✓ {t.reviewThanks}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '16px 18px', marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>{t.writeReview}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{t.reviewYourRating}:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} star`}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: n <= rating ? '#f59e0b' : 'var(--line)' }}>
            ★
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={t.reviewPlaceholder}
        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', resize: 'vertical', marginBottom: 10 }} />
      <button className="btn-primary" style={{ borderRadius: 10 }} disabled={busy} onClick={submit}>{busy ? '…' : t.reviewSubmit}</button>
    </div>
  );
}
