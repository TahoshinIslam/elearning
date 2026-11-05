'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Dialog from '@/components/ui/Dialog';
import Icon from '@/components/Icon';

// Destructive wording on a button (English + Bangla). A button can also opt in
// with data-confirm="message" or opt out with data-confirm="off".
const DESTRUCTIVE = /\b(delete|remove|disable|refund|revoke|suspend|unenroll|discard)\b|মুছ|সরান|নিষ্ক্রিয়|রিফান্ড|স্থগিত|বাতিল করুন/i;
const MUTATING = ['POST', 'PUT', 'PATCH', 'DELETE'];
// Requests that are not admin actions (beacons, file bytes, auth, previews).
const QUIET = /\/api\/(track|storage\/upload|auth\/|orders\/quote|coupons\/validate)|upload-url|\/captions$|playback-error|\/progress$/;

const T = {
  bn: { title: 'আপনি কি নিশ্চিত?', body: 'এই কাজটি ফেরানো নাও যেতে পারে।', yes: 'হ্যাঁ, করুন', no: 'না, বাতিল', created: 'যোগ করা হয়েছে', updated: 'আপডেট হয়েছে', deleted: 'মুছে ফেলা হয়েছে', failed: 'কাজটি সম্পন্ন হয়নি', forbidden: 'এই কাজের অনুমতি আপনার নেই' },
  en: { title: 'Are you sure?', body: 'This may not be undoable.', yes: 'Yes, continue', no: 'No, cancel', created: 'Added', updated: 'Updated', deleted: 'Deleted', failed: 'That didn’t work', forbidden: 'You don’t have permission for this' }
};

function labelOf(btn) {
  return `${btn.getAttribute('aria-label') || ''} ${btn.getAttribute('title') || ''} ${btn.textContent || ''}`.trim();
}

// Admin-console safety net, mounted once around the workspace:
//  1. Any destructive button (delete / remove / disable / refund …) asks
//     "Are you sure?" with Yes / No before its click handler runs. On "No"
//     nothing is sent.
//  2. Every add / update / delete request gets a toast: success, or the
//     server's reason on failure — unless the screen already showed its own
//     toast for it, so messages are never doubled.
export default function ActionFeedback({ children }) {
  const { lang, showToast, toast } = useApp();
  const t = T[lang === 'en' ? 'en' : 'bn'];
  const [ask, setAsk] = useState(null); // { message, button }
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const tRef = useRef(t);
  tRef.current = t;

  // 1. confirm before destructive clicks (capture phase: runs before React)
  useEffect(() => {
    const onClick = (e) => {
      const btn = e.target.closest?.('button, [role="button"], a[data-confirm]');
      if (!btn || btn.disabled) return;
      if (btn.dataset.confirmed === '1') { delete btn.dataset.confirmed; return; }
      const opt = btn.getAttribute('data-confirm');
      if (opt === 'off') return;
      if (!opt && !DESTRUCTIVE.test(labelOf(btn))) return;
      if (btn.closest('.dialog')) return; // already inside a confirmation dialog
      e.preventDefault();
      e.stopPropagation();
      setAsk({ message: opt && opt !== 'on' ? opt : labelOf(btn), button: btn });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // 2. toast on every admin mutation
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = String(init.method || (typeof input !== 'string' && input?.method) || 'GET').toUpperCase();
      const watch = url.includes('/api/') && MUTATING.includes(method) && !QUIET.test(url.split('?')[0]);
      const before = toastRef.current;
      const res = await original(input, init);
      if (watch) {
        const copy = res.clone();
        setTimeout(async () => {
          if (toastRef.current !== before) return; // the screen already said something
          const tt = tRef.current;
          if (res.ok) {
            showToast(method === 'DELETE' ? tt.deleted : method === 'POST' && res.status === 201 ? tt.created : tt.updated, method === 'DELETE' ? 'info' : 'success');
          } else {
            const data = await copy.json().catch(() => ({}));
            const reason = res.status === 403 ? tt.forbidden : data?.error ? `${tt.failed}: ${String(data.error).replace(/_/g, ' ')}` : tt.failed;
            showToast(reason, 'error');
          }
        }, 450);
      }
      return res;
    };
    return () => { window.fetch = original; };
  }, [showToast]);

  const answer = (yes) => {
    const btn = ask?.button;
    setAsk(null);
    if (yes && btn && document.contains(btn)) {
      btn.dataset.confirmed = '1';
      btn.click();
    }
  };

  return (
    <>
      {children}
      <Dialog open={!!ask} onClose={() => answer(false)} title={t.title} closeLabel={t.no} initialFocus=".confirm-no"
        footer={(
          <>
            <button type="button" className="btn btn-secondary confirm-no" data-confirm="off" onClick={() => answer(false)}>{t.no}</button>
            <button type="button" className="btn btn-danger" data-confirm="off" onClick={() => answer(true)}><Icon name="trash" size={16} />{t.yes}</button>
          </>
        )}>
        <div className="confirm-body">
          <span className="confirm-icon" aria-hidden="true"><Icon name="alert" size={26} /></span>
          <div>
            {ask?.message && <p className="strong" style={{ marginBottom: 6 }}>{ask.message}</p>}
            <p className="muted">{t.body}</p>
          </div>
        </div>
      </Dialog>
    </>
  );
}
