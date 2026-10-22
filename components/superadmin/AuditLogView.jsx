'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

const ACTION_LABEL = {
  login_failed: { bn: 'লগইন ব্যর্থ', en: 'Login failed' },
  login_blocked_disabled: { bn: 'নিষ্ক্রিয় অ্যাকাউন্টে লগইন চেষ্টা', en: 'Login blocked (disabled account)' },
  role_changed: { bn: 'রোল পরিবর্তন', en: 'Role changed' },
  role_change_blocked: { bn: 'রোল পরিবর্তন প্রত্যাখ্যাত (সন্দেহজনক)', en: 'Role change blocked (suspicious)' },
  status_change_blocked: { bn: 'স্ট্যাটাস পরিবর্তন প্রত্যাখ্যাত (সন্দেহজনক)', en: 'Status change blocked (suspicious)' },
  user_disabled: { bn: 'অ্যাকাউন্ট নিষ্ক্রিয়', en: 'User disabled' },
  user_enabled: { bn: 'অ্যাকাউন্ট সক্রিয়', en: 'User enabled' },
  order_refunded: { bn: 'অর্ডার রিফান্ড', en: 'Order refunded' },
  payment_refunded: { bn: 'পেমেন্ট রিফান্ড', en: 'Payment refunded' },
  course_submitted_for_review: { bn: 'কোর্স রিভিউতে জমা', en: 'Course submitted for review' },
  course_approved: { bn: 'কোর্স অনুমোদিত', en: 'Course approved' },
  course_rejected: { bn: 'কোর্স প্রত্যাখ্যাত', en: 'Course rejected' }
};

const SEVERITY = {
  login_failed: 'warn', login_blocked_disabled: 'warn',
  role_changed: 'high', user_disabled: 'high', user_enabled: 'high',
  role_change_blocked: 'high', status_change_blocked: 'high',
  order_refunded: 'high', payment_refunded: 'high', course_rejected: 'warn'
};

// Platform-wide security/audit trail — real, persisted events (see
// database/migrations/027_audit_log.sql + lib/auditLog.js), not console-only
// logging that never surfaces in any dashboard.
export default function AuditLogView() {
  const { lang, api } = useApp();
  const bn = lang === 'bn';
  const [log, setLog] = useState(null);

  useEffect(() => { api.getAuditLog().then(setLog); }, []);

  const sevStyle = (action) => {
    const sev = SEVERITY[action];
    if (sev === 'high') return { background: 'var(--danger-tint)', color: '#7F1D1D' };
    if (sev === 'warn') return { background: 'var(--warning-tint)', color: '#713F12' };
    return { background: 'var(--surface)', color: 'var(--muted)' };
  };

  if (log === null) return null;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginTop: 22 }}>
      <div style={{ padding: '14px 20px', fontWeight: 700, fontSize: 15, borderBottom: '1px solid var(--border)', color: 'var(--ink)' }}>
        {bn ? 'সিকিউরিটি লগ' : 'Security log'}
        <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>({log.length})</span>
      </div>
      {log.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted)', fontSize: 13.5 }}>
          {bn ? 'এখনো কোনো ইভেন্ট রেকর্ড হয়নি।' : 'No events recorded yet.'}
        </div>
      ) : (
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {log.map((e) => (
            <div key={e.id} style={{ padding: '11px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
              <span style={{ ...sevStyle(e.action), borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, flex: 'none' }}>
                {(ACTION_LABEL[e.action] || { bn: e.action, en: e.action })[bn ? 'bn' : 'en']}
              </span>
              <span style={{ color: 'var(--muted)', flex: 1, minWidth: 0 }}>
                {e.actorName ? `${e.actorName} (${e.actorRole})` : bn ? 'অজ্ঞাত' : 'unknown'}
                {e.targetType && <span style={{ color: 'var(--muted)' }}> · {e.targetType}#{e.targetId}</span>}
                {e.detail && <span style={{ color: 'var(--muted)' }}> · {e.detail}</span>}
              </span>
              <span className="mono" style={{ color: 'var(--muted)', fontSize: 11, flex: 'none' }}>
                {new Date(e.createdAt).toLocaleString(bn ? 'bn-BD' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
