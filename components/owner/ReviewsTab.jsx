'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

const STATUS_CHIP = { pending: 'chip-orange', approved: 'chip-green', hidden: '' };
const FILTERS = ['all', 'pending', 'approved', 'hidden'];

export default function ReviewsTab() {
  const { t, api } = useApp();
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = () => api.getReviews().then(setReviews).catch(() => {});
  useEffect(() => { load(); }, []);

  const statusLabel = (s) => ({ pending: t.reviewPending, approved: t.reviewApproved, hidden: t.reviewHidden }[s] || s);
  const shown = reviews.filter((r) => filter === 'all' || r.status === filter);

  const setStatus = async (id, status) => setReviews(await api.setReviewStatus(id, status));
  const toggleFeatured = async (r) => setReviews(await api.setReviewFeatured(r.id, !r.featured));

  const Stars = ({ n }) => <span style={{ color: '#f59e0b', fontSize: 13 }}>{'★'.repeat(n)}<span style={{ color: 'var(--line)' }}>{'★'.repeat(5 - n)}</span></span>;

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{t.reviewModeration}</div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? 'chip-orange' : ''}`}
            style={{ cursor: 'pointer', border: filter === f ? 'none' : '1.5px solid var(--line)' }}>
            {f === 'all' ? t.reviewAll : statusLabel(f)}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.reviewNone}</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {shown.map((r) => (
            <div key={r.id} className="card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <Stars n={r.rating} />
                <span className={`chip ${STATUS_CHIP[r.status]}`} style={{ border: r.status === 'hidden' ? '1.5px solid var(--line)' : 'none' }}>{statusLabel(r.status)}</span>
                {r.featured && <span className="chip chip-orange">★ {t.reviewFeatured}</span>}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--faint)' }}>{t.reviewOn}: {r.courseTitle || '—'}</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: '#44403c', margin: '4px 0 8px' }}>&ldquo;{r.text}&rdquo;</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>{r.name}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  {r.status !== 'approved' && <button onClick={() => setStatus(r.id, 'approved')} className="chip chip-green" style={{ cursor: 'pointer', border: 'none' }}>{t.reviewApprove}</button>}
                  {r.status !== 'hidden' && <button onClick={() => setStatus(r.id, 'hidden')} className="chip" style={{ cursor: 'pointer', border: '1.5px solid var(--line)' }}>{t.reviewHide}</button>}
                  <button onClick={() => toggleFeatured(r)} className={`chip ${r.featured ? 'chip-orange' : ''}`} style={{ cursor: 'pointer', border: r.featured ? 'none' : '1.5px solid var(--line)' }}>
                    {t.reviewFeature}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
