'use client';

import { useApp } from '@/context/AppContext';

export default function RecordingsTab() {
  const { t, lang, showToast } = useApp();

  const modules = [
    {
      name: lang === 'bn' ? 'মডিউল ৮' : 'Module 8',
      rows: [
        { title: 'নিউটনিয়ান বলবিদ্যা | কাজ, শক্তি ও ক্ষমতা', dur: lang === 'bn' ? '১ ঘণ্টা ৩৫ মিনিট' : '1 hr 35 min', date: lang === 'bn' ? 'বৃহ ২রা জুলাই · রাত ৯:০০' : 'Thu, Jul 2 · 9:00 PM' },
        { title: 'ভেক্টর রিভিশন | ডট ও ক্রস প্রোডাক্ট', dur: lang === 'bn' ? '১ ঘণ্টা ১২ মিনিট' : '1 hr 12 min', date: lang === 'bn' ? 'সোম ২৯শে জুন · রাত ৯:০০' : 'Mon, Jun 29 · 9:00 PM' }
      ]
    },
    {
      name: lang === 'bn' ? 'মডিউল ৭' : 'Module 7',
      rows: [
        { title: 'মহাকর্ষ ও অভিকর্ষ | কেপলারের সূত্র', dur: lang === 'bn' ? '১ ঘণ্টা ৪৮ মিনিট' : '1 hr 48 min', date: lang === 'bn' ? 'বুধ ২৪শে জুন · রাত ৯:০০' : 'Wed, Jun 24 · 9:00 PM' },
        { title: 'গতির সমীকরণ | প্রজেক্টাইল মোশন', dur: lang === 'bn' ? '২ ঘণ্টা ৫ মিনিট' : '2 hr 5 min', date: lang === 'bn' ? 'শনি ২০শে জুন · রাত ৯:০০' : 'Sat, Jun 20 · 9:00 PM' }
      ]
    }
  ];

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.sRecordings}</div>
      {modules.map((m) => (
        <div key={m.name} className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ padding: '14px 20px', fontWeight: 700, fontSize: 15, borderBottom: '1.5px solid var(--line)' }}>{m.name}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px 92px', gap: 12, padding: '10px 20px', background: 'var(--paper)', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
            <div>{t.thTitle}</div><div>{t.thDur}</div><div>{t.thTime}</div><div style={{ textAlign: 'right' }}>{t.thAction}</div>
          </div>
          {m.rows.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px 92px', gap: 12, padding: '14px 20px', borderTop: '1px solid var(--line-softer)', alignItems: 'center', fontSize: 13.5 }}>
              <div style={{ fontWeight: 600, lineHeight: 1.5 }}>{r.title}</div>
              <div style={{ color: 'var(--muted)' }}>{r.dur}</div>
              <div style={{ color: 'var(--muted)' }}>{r.date}</div>
              <div style={{ textAlign: 'right' }}>
                <button className="btn-ghost-sm" onClick={() => showToast(t.playRec)}>▶ {t.watch}</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
