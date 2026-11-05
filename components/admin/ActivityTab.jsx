'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { useAdminData } from '@/components/owner/useAdminData';
import { num, taka } from '@/lib/copy';

export const ACT = {
  order: { icon: 'receipt', tone: 'var(--c-lime)', bn: 'অর্ডার', en: 'Order' },
  refund: { icon: 'refresh', tone: 'var(--c-pink)', bn: 'রিফান্ড', en: 'Refund' },
  enrollment: { icon: 'checkCircle', tone: 'var(--c-cyan)', bn: 'ভর্তি', en: 'Enrollment' },
  signup: { icon: 'user', tone: 'var(--c-yellow)', bn: 'নতুন অ্যাকাউন্ট', en: 'Sign-up' },
  submission: { icon: 'edit', tone: 'var(--c-violet)', bn: 'অ্যাসাইনমেন্ট', en: 'Submission' },
  quiz: { icon: 'help', tone: 'var(--c-blue)', bn: 'কুইজ', en: 'Quiz' },
  review: { icon: 'star', tone: 'var(--c-orange)', bn: 'রিভিউ', en: 'Review' },
  message: { icon: 'mail', tone: 'var(--c-cyan)', bn: 'বার্তা', en: 'Message' },
  admin: { icon: 'settings', tone: 'var(--surface-2)', bn: 'অ্যাডমিন কাজ', en: 'Admin action' },
  security: { icon: 'shield', tone: 'var(--c-pink)', bn: 'নিরাপত্তা', en: 'Security' }
};

export function timeAgo(iso, lang) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const en = lang === 'en';
  const units = [[86400, en ? 'd' : ' দিন'], [3600, en ? 'h' : ' ঘণ্টা'], [60, en ? 'm' : ' মিনিট']];
  for (const [sec, u] of units) if (s >= sec) return `${num(lang, Math.floor(s / sec))}${u}${en ? ' ago' : ' আগে'}`;
  return en ? 'just now' : 'এইমাত্র';
}

export function describe(item, lang) {
  const en = lang === 'en';
  const who = item.actor || (en ? 'Someone' : 'কেউ');
  switch (item.type) {
    case 'order': return en ? `${who} paid ${taka(lang, item.amount || 0)} for ${item.detail}` : `${who} ${item.detail} কিনেছেন — ${taka(lang, item.amount || 0)}`;
    case 'refund': return en ? `Order #${item.id.split('-')[1]} refunded to ${who}` : `${who}-কে রিফান্ড — অর্ডার #${item.id.split('-')[1]}`;
    case 'enrollment': return en ? `${who} enrolled in ${item.detail}` : `${who} ${item.detail}-এ ভর্তি হয়েছেন`;
    case 'signup': return en ? `${who} created a ${item.detail} account` : `${who} নতুন অ্যাকাউন্ট খুলেছেন (${item.detail})`;
    case 'submission': return en ? `${who} submitted “${item.detail}”` : `${who} “${item.detail}” জমা দিয়েছেন`;
    case 'quiz': return en ? `${who} scored ${item.extra} on ${item.detail}` : `${who} ${item.detail} কুইজে পেয়েছেন ${item.extra}`;
    case 'review': return en ? `${who} reviewed ${item.detail} (${item.extra})` : `${who} ${item.detail}-এ রিভিউ দিয়েছেন (${item.extra})`;
    case 'message': return en ? `${who} sent a message: ${item.detail || ''}` : `${who} বার্তা পাঠিয়েছেন: ${item.detail || ''}`;
    default: return `${who}: ${String(item.detail || '').replace(/_/g, ' ')}${item.extra ? ` · ${item.extra}` : ''}`;
  }
}

export function ActivityList({ items, lang, compact = false }) {
  if (!items.length) return <p className="muted small" style={{ padding: 16 }}>{lang === 'en' ? 'Nothing yet.' : 'এখনো কিছু নেই।'}</p>;
  return (
    <ol className={`activity ${compact ? 'is-compact' : ''}`}>
      {items.map((it) => {
        const m = ACT[it.type] || ACT.admin;
        return (
          <li key={it.id} className="activity-item">
            <span className="activity-icon" style={{ background: m.tone }} aria-hidden="true"><Icon name={m.icon} size={16} /></span>
            <div className="activity-body">
              <p className="activity-text">{describe(it, lang)}</p>
              <p className="activity-meta"><span className="badge">{lang === 'en' ? m.en : m.bn}</span><time dateTime={it.at} title={new Date(it.at).toLocaleString()}>{timeAgo(it.at, lang)}</time></p>
            </div>
            {it.link && <Link href={it.link} className="btn btn-ghost btn-icon btn-sm" aria-label={lang === 'en' ? 'Open' : 'খুলুন'}><Icon name="arrowRight" size={14} /></Link>}
          </li>
        );
      })}
    </ol>
  );
}

// Admin → Activity: one live timeline of what happened across the platform.
export default function ActivityTab() {
  const { lang } = useApp();
  const en = lang === 'en';
  const [types, setTypes] = useState([]);
  const [days, setDays] = useState(30);
  const q = useAdminData(`/api/admin/activity?limit=100&days=${days}${types.length ? `&types=${types.join(',')}` : ''}`);
  const toggle = (t) => setTypes((list) => (list.includes(t) ? list.filter((x) => x !== t) : [...list, t]));
  return (
    <div className="stack" style={{ '--gap': '16px' }}>
      <div className="row between" style={{ flexWrap: 'wrap', '--gap': '10px' }}>
        <div className="cluster" role="group" aria-label={en ? 'Filter' : 'ফিল্টার'} style={{ '--gap': '6px' }}>
          <button type="button" className="pill-tab" aria-pressed={!types.length} onClick={() => setTypes([])}>{en ? 'All' : 'সব'}</button>
          {Object.entries(ACT).map(([k, m]) => (
            <button key={k} type="button" className="pill-tab" aria-pressed={types.includes(k)} onClick={() => toggle(k)}><Icon name={m.icon} size={13} /> {en ? m.en : m.bn}</button>
          ))}
        </div>
        <div className="row" style={{ '--gap': '8px' }}>
          <label htmlFor="act-days" className="small strong">{en ? 'Period' : 'সময়'}</label>
          <select id="act-days" className="select" style={{ minHeight: 40, width: 'auto' }} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[1, 7, 30, 90].map((d) => <option key={d} value={d}>{en ? `${d} days` : `${num(lang, d)} দিন`}</option>)}
          </select>
          <button type="button" className="btn btn-secondary btn-sm" onClick={q.reload} aria-label={en ? 'Refresh' : 'রিফ্রেশ'}><Icon name="refresh" size={14} /></button>
        </div>
      </div>
      <div className="surface">
        {q.loading && !q.data ? <div className="stack surface-pad">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 46 }} />)}</div>
          : q.error ? <div className="state"><p>{en ? 'Couldn’t load activity.' : 'অ্যাক্টিভিটি লোড করা যায়নি।'}</p></div>
            : <ActivityList items={q.data} lang={lang} />}
      </div>
    </div>
  );
}
