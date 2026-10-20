'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import DataTable from '@/components/ui/DataTable';
import Dialog from '@/components/ui/Dialog';
import { useAdminData, send } from '@/components/owner/useAdminData';
import { taka, num, dateLabel } from '@/lib/copy';
import { discounted } from '@/lib/offerMath';

const local = (v) => (v ? String(v).replace(' ', 'T').slice(0, 16) : '');
const nowLocal = () => { const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };
const BLANK = { name: '', type: 'percent', value: 10, scope: 'course', scopeValue: '', startsAt: '', endsAt: '' };

const ERR = {
  bn: { name_required: 'নাম দিন।', invalid_value: 'ছাড়ের পরিমাণ সঠিক নয় (শতাংশ হলে ১–৯০)।', scope_required: 'কোন কোর্সে প্রযোজ্য তা বেছে নিন।', start_required: 'শুরুর সময় দিন।', end_before_start: 'শেষের সময় শুরুর পরে হতে হবে।' },
  en: { name_required: 'Enter a name.', invalid_value: 'Invalid amount (percent must be 1–90).', scope_required: 'Choose what the offer applies to.', start_required: 'Set a start time.', end_before_start: 'End must be after start.' }
};

// Automatic discounts. The same rule (lib/pricing.js) prices the catalog,
// the course page, checkout and the order, so what's shown here is charged.
export default function OffersTab() {
  const { lang, courses, showToast } = useApp();
  const en = lang === 'en';
  const { data, loading, error, reload, setData } = useAdminData('/api/offers');
  const [cats, setCats] = useState([]);
  const [classes, setClasses] = useState([]);
  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then((d) => setCats(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/classes').then((r) => r.json()).then((d) => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const STATE = {
    live: ['badge-success', en ? 'Live' : 'চলমান'],
    scheduled: ['badge-info', en ? 'Scheduled' : 'নির্ধারিত'],
    ended: ['', en ? 'Ended' : 'শেষ'],
    disabled: ['badge-warning', en ? 'Disabled' : 'বন্ধ']
  };
  const SCOPE = { course: en ? 'Course' : 'কোর্স', subject: en ? 'Subject' : 'বিষয়', class: en ? 'Class' : 'শ্রেণি', all: en ? 'All paid courses' : 'সব পেইড কোর্স' };
  const scopeLabel = (o) => {
    if (o.scope === 'all') return SCOPE.all;
    if (o.scope === 'course') return courses.find((c) => String(c.id) === String(o.scopeValue))?.title || `#${o.scopeValue}`;
    if (o.scope === 'subject') return cats.find((c) => c.slug === o.scopeValue)?.name || o.scopeValue;
    return classes.find((c) => c.slug === o.scopeValue)?.name || o.scopeValue;
  };
  const amount = (o) => (o.type === 'percent' ? `${num(lang, o.value)}%` : taka(lang, o.value));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setFormErr('');
    try {
      setData(await send('/api/offers', 'POST', { ...form, value: Number(form.value), endsAt: form.endsAt || null }));
      showToast(en ? 'Offer saved' : 'অফার সংরক্ষিত', 'success');
      setForm(null);
    } catch (err) { setFormErr(ERR[en ? 'en' : 'bn'][err.message] || (en ? 'Couldn’t save.' : 'সংরক্ষণ করা যায়নি।')); }
    finally { setBusy(false); }
  };
  const toggle = async (o) => {
    try { setData(await send('/api/offers', 'PATCH', { id: o.id, isActive: !o.isActive })); }
    catch { showToast(en ? 'That didn’t work' : 'কাজটি করা যায়নি', 'error'); }
  };

  // Live example so the admin sees the exact price customers will pay.
  const sample = form && form.scope === 'course' ? courses.find((c) => String(c.id) === String(form.scopeValue)) : null;
  const samplePrice = sample && Number(form.value) > 0
    ? discounted(sample.price, { type: form.type, value: Number(form.value) })
    : null;

  const list = data || [];
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="stat-tiles">
        <div className="surface stat-tile"><div className="v">{num(lang, list.filter((o) => o.state === 'live').length)}</div><div className="l">{STATE.live[1]}</div></div>
        <div className="surface stat-tile"><div className="v">{num(lang, list.filter((o) => o.state === 'scheduled').length)}</div><div className="l">{STATE.scheduled[1]}</div></div>
        <div className="surface stat-tile"><div className="v">{num(lang, list.length)}</div><div className="l">{en ? 'All offers' : 'মোট অফার'}</div></div>
      </div>
      <DataTable lang={lang} caption={en ? 'Offers' : 'অফার'} rows={list} loading={loading} error={error ? true : null} onRetry={reload}
        searchText={(o) => `${o.name} ${scopeLabel(o)}`}
        filters={[{ key: 'state', label: en ? 'State' : 'অবস্থা', options: Object.entries(STATE).map(([value, [, label]]) => ({ value, label })), test: (o, v) => o.state === v }]}
        initialSort={{ key: 'id', dir: 'desc' }}
        toolbar={<button type="button" className="btn btn-primary btn-sm" onClick={() => { setFormErr(''); setForm({ ...BLANK, startsAt: nowLocal() }); }}><Icon name="plus" size={15} />{en ? 'New offer' : 'নতুন অফার'}</button>}
        emptyState={<p>{en ? 'No offers yet. Offers apply automatically at checkout — no code needed.' : 'এখনও কোনো অফার নেই। অফার চেকআউটে নিজে থেকেই প্রযোজ্য হয় — কোনো কোড লাগে না।'}</p>}
        columns={[
          { key: 'name', label: en ? 'Offer' : 'অফার', render: (o) => <span className="strong">{o.name}</span> },
          { key: 'value', label: en ? 'Discount' : 'ছাড়', align: 'right', render: (o) => <span className="tabular strong">{amount(o)}</span> },
          { key: 'scope', label: en ? 'Applies to' : 'প্রযোজ্য', sort: scopeLabel, render: (o) => <span className="small"><span className="muted">{SCOPE[o.scope]}{o.scope !== 'all' ? ': ' : ''}</span>{o.scope !== 'all' ? scopeLabel(o) : ''}</span> },
          { key: 'startsAt', label: en ? 'Valid' : 'মেয়াদ', render: (o) => <span className="small muted nowrap">{dateLabel(lang, o.startsAt)} – {o.endsAt ? dateLabel(lang, o.endsAt) : (en ? 'no end' : 'শেষ নেই')}</span> },
          { key: 'state', label: en ? 'State' : 'অবস্থা', render: (o) => <span className={`badge ${STATE[o.state][0]}`}>{STATE[o.state][1]}</span> }
        ]}
        rowActions={(o) => (<>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setFormErr(''); setForm({ ...o, startsAt: local(o.startsAt), endsAt: local(o.endsAt) }); }}><Icon name="edit" size={14} />{en ? 'Edit' : 'সম্পাদনা'}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggle(o)} aria-pressed={o.isActive}>{o.isActive ? (en ? 'Disable' : 'বন্ধ করুন') : (en ? 'Enable' : 'চালু করুন')}</button>
        </>)}
      />

      <Dialog open={!!form} onClose={() => setForm(null)} title={form?.id ? (en ? 'Edit offer' : 'অফার সম্পাদনা') : (en ? 'New offer' : 'নতুন অফার')} closeLabel={en ? 'Close' : 'বন্ধ'} wide>
        {form && (
          <form className="stack" style={{ '--gap': '14px' }} onSubmit={save} noValidate>
            <div className="field"><label htmlFor="of-name">{en ? 'Internal name' : 'অভ্যন্তরীণ নাম'}</label><input id="of-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={191} /></div>
            <div className="form-grid">
              <div className="field"><label htmlFor="of-type">{en ? 'Type' : 'ধরন'}</label>
                <select id="of-type" className="select" value={form.type} onChange={(e) => set('type', e.target.value)}>
                  <option value="percent">{en ? 'Percent off' : 'শতাংশ ছাড়'}</option>
                  <option value="fixed">{en ? 'Fixed amount off (৳)' : 'নির্দিষ্ট টাকা ছাড় (৳)'}</option>
                </select></div>
              <div className="field"><label htmlFor="of-value">{form.type === 'percent' ? (en ? 'Percent (1–90)' : 'শতাংশ (১–৯০)') : (en ? 'Amount (৳)' : 'পরিমাণ (৳)')}</label>
                <input id="of-value" className="input" type="number" min={1} max={form.type === 'percent' ? 90 : undefined} step={1} value={form.value} onChange={(e) => set('value', e.target.value)} required /></div>
            </div>
            <div className="form-grid">
              <div className="field"><label htmlFor="of-scope">{en ? 'Applies to' : 'প্রযোজ্য'}</label>
                <select id="of-scope" className="select" value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value, scopeValue: '' }))}>
                  {Object.entries(SCOPE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select></div>
              {form.scope !== 'all' && (
                <div className="field"><label htmlFor="of-sv">{SCOPE[form.scope]}</label>
                  <select id="of-sv" className="select" value={form.scopeValue} onChange={(e) => set('scopeValue', e.target.value)} required>
                    <option value="">{en ? 'Choose…' : 'বেছে নিন…'}</option>
                    {form.scope === 'course' && courses.filter((c) => c.price > 0).map((c) => <option key={c.id} value={String(c.id)}>{c.title} — {taka(lang, c.price)}</option>)}
                    {form.scope === 'subject' && cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                    {form.scope === 'class' && classes.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select></div>
              )}
            </div>
            <div className="form-grid">
              <div className="field"><label htmlFor="of-start">{en ? 'Starts' : 'শুরু'}</label><input id="of-start" className="input" type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} required /></div>
              <div className="field"><label htmlFor="of-end">{en ? 'Ends (optional)' : 'শেষ (ঐচ্ছিক)'}</label><input id="of-end" className="input" type="datetime-local" value={form.endsAt || ''} onChange={(e) => set('endsAt', e.target.value)} /></div>
            </div>
            {sample && samplePrice != null && (
              <p className="small surface-sunken" style={{ padding: '10px 12px', borderRadius: 'var(--r-md)' }}>
                {en ? 'Customers will pay ' : 'শিক্ষার্থী পরিশোধ করবেন '}<strong className="tabular">{taka(lang, samplePrice)}</strong>{en ? ' instead of ' : ', মূল দাম '}<s className="tabular">{taka(lang, sample.price)}</s>.
              </p>
            )}
            <p className="xsmall muted">{en ? 'When several offers match a course, the one giving the lowest price applies. Coupons are applied on top at checkout.' : 'একাধিক অফার মিললে যেটিতে দাম সবচেয়ে কম হয় সেটিই প্রযোজ্য। কুপন চেকআউটে এর পরে প্রযোজ্য হয়।'}</p>
            {formErr && <p className="field-error" role="alert">{formErr}</p>}
            <div className="row" style={{ justifyContent: 'flex-end', '--gap': '8px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>{en ? 'Cancel' : 'বাতিল'}</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy && <span className="spinner" aria-hidden="true" />}{en ? 'Save offer' : 'অফার সংরক্ষণ'}</button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
