'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { useAdminData, send } from '@/components/owner/useAdminData';
import { num } from '@/lib/copy';

const TONES = ['yellow', 'cyan', 'pink', 'lime', 'violet', 'orange', 'blue'];
const ICONS = ['book', 'cap', 'flag', 'calendar', 'code', 'star', 'globe', 'video', 'broadcast', 'layers', 'compass'];
const HOME_LIMIT = 4;
const L = {
  bn: {
    intro: 'সেকশনগুলো কোর্সকে ভাগ করে — স্কুল, কলেজ, ভর্তি, আসন্ন ব্যাচ ইত্যাদি। বন্ধ করলে সেকশনটি হোমপেজ ও কোর্স ফিল্টার থেকে সরে যায়। হোমপেজে সর্বোচ্চ ৪টি সেকশন দেখায় — উপরের ক্রম অনুযায়ী, যেগুলোতে কোর্স আছে।',
    add: 'নতুন সেকশন', nameBn: 'নাম (বাংলা)', nameEn: 'নাম (English)', blurbBn: 'বিবরণ (বাংলা)', blurbEn: 'বিবরণ (English)', badgeBn: 'ব্যাজ (বাংলা)', badgeEn: 'ব্যাজ (English)', badgeHint: 'যেমন “ভর্তি চলছে” — খালি রাখলে ব্যাজ দেখাবে না',
    icon: 'আইকন', tone: 'রং', save: 'সংরক্ষণ', create: 'সেকশন তৈরি করুন', cancel: 'বাতিল', edit: 'সম্পাদনা', del: 'মুছুন', up: 'উপরে', down: 'নিচে',
    enabled: 'চালু', home: 'হোমপেজে', courses: (n) => `${num('bn', n)}টি কোর্স`, onHome: 'হোমপেজে দেখাচ্ছে', overLimit: 'হোমপেজ পূর্ণ (৪টি) — দেখাবে না', noCourses: 'কোর্স নেই — হোমপেজে দেখাবে না', off: 'বন্ধ',
    assignHint: 'কোর্স যোগ করতে: কোর্স → কোর্স খুলুন → বিবরণ → “কোন সেকশনে দেখাবে”।', saved: 'সেকশন সংরক্ষণ হয়েছে', deleted: 'সেকশন মুছে ফেলা হয়েছে', name_required: 'দুই ভাষাতেই নাম দিন',
    view: 'পেজ দেখুন', delConfirm: (n) => `“${n}” সেকশন মুছবেন? কোর্সগুলো মুছবে না, শুধু এই সেকশন থেকে সরবে।`
  },
  en: {
    intro: 'Sections group your courses — School, College, Admission, Upcoming batches and so on. Turning one off removes it from the home page and the course filters. The home page shows at most 4 sections — the first ones in this order that have courses.',
    add: 'New section', nameBn: 'Name (Bangla)', nameEn: 'Name (English)', blurbBn: 'Description (Bangla)', blurbEn: 'Description (English)', badgeBn: 'Badge (Bangla)', badgeEn: 'Badge (English)', badgeHint: 'e.g. “Admission open” — leave empty for no badge',
    icon: 'Icon', tone: 'Colour', save: 'Save', create: 'Create section', cancel: 'Cancel', edit: 'Edit', del: 'Delete', up: 'Move up', down: 'Move down',
    enabled: 'On', home: 'On home page', courses: (n) => `${n} course${n === 1 ? '' : 's'}`, onHome: 'Showing on home page', overLimit: 'Home page full (4) — not shown', noCourses: 'No courses — not shown on home', off: 'Off',
    assignHint: 'To add courses: Courses → open a course → Details → “Show in sections”.', saved: 'Section saved', deleted: 'Section deleted', name_required: 'Enter the name in both languages',
    view: 'View page', delConfirm: (n) => `Delete the “${n}” section? Its courses stay; they just leave this section.`
  }
};
const EMPTY = { nameBn: '', nameEn: '', blurbBn: '', blurbEn: '', badgeBn: '', badgeEn: '', icon: 'book', tone: 'yellow' };

function SectionForm({ l, value, onChange, onSubmit, onCancel, busy, submitLabel }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <form className="stack" style={{ '--gap': '12px' }} onSubmit={(e) => { e.preventDefault(); if (e.currentTarget.reportValidity()) onSubmit(); }}>
      <div className="form-grid">
        <div className="field"><label className="req" htmlFor="sf-nbn">{l.nameBn}</label><input id="sf-nbn" className="input" required maxLength={120} value={value.nameBn} onChange={set('nameBn')} /></div>
        <div className="field"><label className="req" htmlFor="sf-nen">{l.nameEn}</label><input id="sf-nen" className="input" required maxLength={120} value={value.nameEn} onChange={set('nameEn')} /></div>
        <div className="field"><label htmlFor="sf-bbn">{l.blurbBn}</label><input id="sf-bbn" className="input" maxLength={255} value={value.blurbBn || ''} onChange={set('blurbBn')} /></div>
        <div className="field"><label htmlFor="sf-ben">{l.blurbEn}</label><input id="sf-ben" className="input" maxLength={255} value={value.blurbEn || ''} onChange={set('blurbEn')} /></div>
        <div className="field"><label htmlFor="sf-gbn">{l.badgeBn}</label><input id="sf-gbn" className="input" maxLength={60} value={value.badgeBn || ''} onChange={set('badgeBn')} aria-describedby="sf-gh" /></div>
        <div className="field"><label htmlFor="sf-gen">{l.badgeEn}</label><input id="sf-gen" className="input" maxLength={60} value={value.badgeEn || ''} onChange={set('badgeEn')} aria-describedby="sf-gh" /></div>
      </div>
      <p id="sf-gh" className="help" style={{ marginTop: -4 }}>{l.badgeHint}</p>
      <fieldset className="field"><legend className="label">{l.icon}</legend>
        <div className="cluster" style={{ '--gap': '6px' }}>{ICONS.map((ic) => (
          <button key={ic} type="button" data-confirm="off" className={`sec-pick ${value.icon === ic ? 'on' : ''}`} aria-pressed={value.icon === ic} aria-label={ic} onClick={() => onChange({ ...value, icon: ic })}><Icon name={ic} size={18} /></button>
        ))}</div>
      </fieldset>
      <fieldset className="field"><legend className="label">{l.tone}</legend>
        <div className="cluster" style={{ '--gap': '6px' }}>{TONES.map((t) => (
          <button key={t} type="button" data-confirm="off" className={`sec-pick sec-swatch ${value.tone === t ? 'on' : ''}`} style={{ background: `var(--c-${t})` }} aria-pressed={value.tone === t} aria-label={t} onClick={() => onChange({ ...value, tone: t })} />
        ))}</div>
      </fieldset>
      <div className="cluster" style={{ '--gap': '8px' }}>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy && <span className="spinner" aria-hidden="true" />}{submitLabel}</button>
        <button type="button" className="btn btn-ghost" data-confirm="off" onClick={onCancel}>{l.cancel}</button>
      </div>
    </form>
  );
}

// Admin → Course sections.
export default function SectionsTab({ readOnly }) {
  const { lang, showToast } = useApp();
  const en = lang === 'en';
  const l = L[en ? 'en' : 'bn'];
  const q = useAdminData('/api/course-sections?all=1');
  const [editing, setEditing] = useState(null); // id | 'new'
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const list = q.data || [];

  const run = async (method, body, ok) => {
    setBusy(true);
    try { q.setData(await send('/api/course-sections', method, body)); if (ok) showToast(ok, 'success'); return true; }
    catch (e) { showToast(l[e.message] || e.message, 'error'); return false; }
    finally { setBusy(false); }
  };

  // which sections the home page will actually show
  let shown = 0;
  const homeState = (s) => {
    if (!s.enabled) return 'off';
    if (!s.showOnHome) return null;
    if (!s.courseCount) return 'empty';
    shown += 1;
    return shown <= HOME_LIMIT ? 'home' : 'over';
  };

  if (q.loading && !q.data) return <div className="stack">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 84 }} />)}</div>;
  if (q.error) return <div className="surface state"><p>{String(q.error)}</p><button type="button" className="btn btn-secondary" onClick={q.reload}><Icon name="refresh" size={16} /></button></div>;

  return (
    <div className="stack" style={{ '--gap': '18px' }}>
      <p className="notice notice-info"><Icon name="layers" size={18} />{l.intro}</p>
      {!readOnly && editing !== 'new' && <div><button type="button" className="btn btn-primary" data-confirm="off" onClick={() => { setForm(EMPTY); setEditing('new'); }}><Icon name="plus" size={16} />{l.add}</button></div>}
      {editing === 'new' && (
        <section className="surface surface-pad"><SectionForm l={l} value={form} onChange={setForm} busy={busy} submitLabel={l.create} onCancel={() => setEditing(null)}
          onSubmit={async () => { if (await run('POST', form, l.saved)) setEditing(null); }} /></section>
      )}
      <ol className="sec-list">
        {list.map((s, i) => {
          const hs = homeState(s);
          return (
            <li key={s.id} className={`sec-item ${s.enabled ? '' : 'is-off'}`} style={{ '--tone': `var(--c-${s.tone})` }}>
              <div className="sec-row">
                <span className="sec-icon" aria-hidden="true"><Icon name={s.icon} size={22} /></span>
                <div className="sec-body">
                  <div className="sec-title"><strong>{en ? s.nameEn : s.nameBn}</strong>{(en ? s.badgeEn : s.badgeBn) && <span className="badge badge-warning">{en ? s.badgeEn : s.badgeBn}</span>}</div>
                  <p className="small muted">{en ? s.blurbEn : s.blurbBn}</p>
                  <div className="cluster small" style={{ '--gap': '8px' }}>
                    <span className="badge">{l.courses(s.courseCount)}</span>
                    {hs === 'home' && <span className="badge badge-success"><Icon name="home" size={12} />{l.onHome}</span>}
                    {hs === 'over' && <span className="badge badge-warning">{l.overLimit}</span>}
                    {hs === 'empty' && <span className="badge badge-warning">{l.noCourses}</span>}
                    {hs === 'off' && <span className="badge badge-danger">{l.off}</span>}
                    <a className="link small" href={`/courses?section=${s.slug}`} target="_blank" rel="noreferrer">{l.view}</a>
                  </div>
                </div>
                <div className="sec-controls">
                  <label className="switch"><input type="checkbox" role="switch" checked={s.enabled} disabled={readOnly || busy} onChange={(e) => run('PATCH', { id: s.id, enabled: e.target.checked }, l.saved)} /><span aria-hidden="true" />{l.enabled}</label>
                  <label className="switch"><input type="checkbox" role="switch" checked={s.showOnHome} disabled={readOnly || busy || !s.enabled} onChange={(e) => run('PATCH', { id: s.id, showOnHome: e.target.checked }, l.saved)} /><span aria-hidden="true" />{l.home}</label>
                  {!readOnly && (
                    <div className="cluster" style={{ '--gap': '4px' }}>
                      <button type="button" className="btn btn-ghost btn-icon btn-sm" data-confirm="off" disabled={busy || i === 0} aria-label={l.up} onClick={() => run('PATCH', { id: s.id, move: 'up' })}><Icon name="arrowUp" size={15} /></button>
                      <button type="button" className="btn btn-ghost btn-icon btn-sm" data-confirm="off" disabled={busy || i === list.length - 1} aria-label={l.down} onClick={() => run('PATCH', { id: s.id, move: 'down' })}><Icon name="arrowDown" size={15} /></button>
                      <button type="button" className="btn btn-secondary btn-sm" data-confirm="off" onClick={() => { setForm({ ...EMPTY, ...s }); setEditing(s.id); }}><Icon name="edit" size={14} />{l.edit}</button>
                      <button type="button" className="btn btn-ghost btn-icon btn-sm" data-confirm={l.delConfirm(en ? s.nameEn : s.nameBn)} aria-label={l.del} onClick={() => run('DELETE', { id: s.id }, l.deleted)}><Icon name="trash" size={15} /></button>
                    </div>
                  )}
                </div>
              </div>
              {editing === s.id && (
                <div className="sec-edit"><SectionForm l={l} value={form} onChange={setForm} busy={busy} submitLabel={l.save} onCancel={() => setEditing(null)}
                  onSubmit={async () => { if (await run('PATCH', { id: s.id, nameBn: form.nameBn, nameEn: form.nameEn, blurbBn: form.blurbBn, blurbEn: form.blurbEn, badgeBn: form.badgeBn, badgeEn: form.badgeEn, icon: form.icon, tone: form.tone }, l.saved)) setEditing(null); }} /></div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="help"><Icon name="info" size={14} /> {l.assignHint}</p>
    </div>
  );
}
