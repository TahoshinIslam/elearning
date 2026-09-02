'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

// Platform-level course approval — every course an owner has submitted for
// review (draft → pending_review → published, see lib/courseReviewRepo.js).
// Real data via GET /api/courses/review-queue (superadmin-only).
export default function CourseReviewQueue() {
  const { lang, showToast, api } = useApp();
  const bn = lang === 'bn';
  const [queue, setQueue] = useState(null);
  const [noteDraft, setNoteDraft] = useState({}); // { [courseId]: text }

  const load = () => api.getReviewQueue().then(setQueue);
  useEffect(() => { load(); }, []);

  const approve = async (c) => {
    try {
      await api.courseReviewAction(c.id, 'approve');
      showToast(bn ? `"${c.title}" প্রকাশিত হয়েছে` : `"${c.title}" published`);
      load();
    } catch { showToast(bn ? 'কিছু একটা ভুল হয়েছে' : 'Something went wrong'); }
  };
  const reject = async (c) => {
    try {
      await api.courseReviewAction(c.id, 'reject', noteDraft[c.id] || '');
      showToast(bn ? `"${c.title}" ড্রাফটে ফেরত পাঠানো হয়েছে` : `"${c.title}" sent back to draft`);
      load();
    } catch { showToast(bn ? 'কিছু একটা ভুল হয়েছে' : 'Something went wrong'); }
  };

  if (queue === null) return null;

  return (
    <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, overflow: 'hidden', marginTop: 22 }}>
      <div style={{ padding: '14px 20px', fontWeight: 700, fontSize: 15, borderBottom: '1px solid rgba(255,255,255,.1)', color: '#fff' }}>
        {bn ? 'কোর্স রিভিউ কিউ' : 'Course review queue'}
        <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>({queue.length})</span>
      </div>
      {queue.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'rgba(255,255,255,.5)', fontSize: 13.5 }}>
          {bn ? 'রিভিউর জন্য অপেক্ষমাণ কোনো কোর্স নেই।' : 'No courses waiting for review.'}
        </div>
      ) : queue.map((c) => (
        <div key={c.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>{c.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{c.instructor || '—'} · ৳{c.price ?? 0}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => approve(c)} style={{ border: 'none', background: 'var(--green,#16a34a)', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 700 }}>
                {bn ? 'অনুমোদন' : 'Approve'}
              </button>
              <button onClick={() => reject(c)} style={{ border: '1px solid rgba(255,255,255,.25)', background: 'none', color: 'rgba(255,255,255,.85)', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 700 }}>
                {bn ? 'ফেরত পাঠান' : 'Send back'}
              </button>
            </div>
          </div>
          <input
            value={noteDraft[c.id] || ''}
            onChange={(e) => setNoteDraft((d) => ({ ...d, [c.id]: e.target.value }))}
            placeholder={bn ? 'ফেরত পাঠানোর কারণ (ঐচ্ছিক)' : 'Reason for sending back (optional)'}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, color: '#fff', fontFamily: 'inherit' }}
          />
        </div>
      ))}
    </div>
  );
}
