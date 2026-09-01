'use client';

import { useApp } from '@/context/AppContext';

export default function ResourcesTab() {
  const { t, lang, showToast } = useApp();

  const modules = [
    {
      name: lang === 'bn' ? 'মডিউল ৮' : 'Module 8',
      rows: [
        { title: 'ক্লাস নোট PDF — কাজ, শক্তি ও ক্ষমতা', date: lang === 'bn' ? 'বৃহ ২রা জুলাই · রাত ১০:১৫' : 'Thu, Jul 2 · 10:15 PM' },
        { title: 'মডেল টেস্ট ৮ — প্রশ্নপত্র', date: lang === 'bn' ? 'সোম ২৯শে জুন · রাত ৯:৪০' : 'Mon, Jun 29 · 9:40 PM' }
      ]
    },
    {
      name: lang === 'bn' ? 'মডিউল ৭' : 'Module 7',
      rows: [
        { title: 'সমাধান শিট — মহাকর্ষ', date: lang === 'bn' ? 'বুধ ২৪শে জুন · রাত ১০:০০' : 'Wed, Jun 24 · 10:00 PM' },
        { title: 'প্র্যাকটিস শিট — গতির সমীকরণ', date: lang === 'bn' ? 'শনি ২০শে জুন · রাত ৯:৩০' : 'Sat, Jun 20 · 9:30 PM' }
      ]
    }
  ];

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.sResources}</div>
      {modules.map((m) => (
        <div key={m.name} className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ padding: '14px 20px', fontWeight: 700, fontSize: 15, borderBottom: '1.5px solid var(--line)' }}>{m.name}</div>
          {m.rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderTop: '1px solid var(--line-softer)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.5 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{r.date}</div>
              </div>
              <button className="btn-ghost-sm" style={{ flex: 'none' }} onClick={() => showToast(t.openRes)}>{t.check}</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
