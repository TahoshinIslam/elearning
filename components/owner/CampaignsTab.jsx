'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import DataTable from '@/components/ui/DataTable';
import Dialog from '@/components/ui/Dialog';
import { useAdminData, send } from '@/components/owner/useAdminData';
import { putFile } from '@/components/owner/builder/upload';
import ImageDropzone from '@/components/ui/ImageDropzone';
import { IMAGE_SPECS } from '@/lib/imageSpecs';
import { num, taka, dateLabel } from '@/lib/copy';

const local = (v) => (v ? String(v).replace(' ', 'T').slice(0, 16) : '');
const BLANK = { kind: 'slide', title: '', body: '', ctaLabel: '', targetType: 'course', targetValue: '', offerId: '', startsAt: '', endsAt: '', audience: 'all', pages: ['home'], frequencyHours: 24, imageAlt: '', triggerType: 'delay', triggerValue: 3, utmCampaign: '', interestCategory: '' };

const ERR = {
  bn: { title_required: 'শিরোনাম দিন।', cta_required: 'বোতামের লেখা দিন।', target_required: 'গন্তব্য বেছে নিন।', target_not_found: 'গন্তব্যটি আর নেই বা প্রকাশিত নয়।', end_before_start: 'শেষের সময় শুরুর পরে হতে হবে।', invalid_offer: 'অফারটি পাওয়া যায়নি।', campaign_page_needs_content: 'ক্যাম্পেইন পেজের জন্য বিবরণ বা অফার দরকার।', needs_image_or_body: 'পপআপ প্রকাশের আগে ছবি বা বিবরণ যোগ করুন।', unsupported_image_type: 'শুধু JPG, PNG বা WebP ছবি।', file_too_large: 'ছবিটি অনেক বড়।', storage_not_configured: 'ফাইল স্টোরেজ কনফিগার করা নেই।' },
  en: { title_required: 'Enter a heading.', cta_required: 'Enter the button label.', target_required: 'Choose a destination.', target_not_found: 'That destination no longer exists or isn’t published.', end_before_start: 'End must be after start.', invalid_offer: 'Offer not found.', campaign_page_needs_content: 'A campaign page needs a description or an offer.', needs_image_or_body: 'Add an image or description before publishing a popup.', unsupported_image_type: 'JPG, PNG or WebP only.', file_too_large: 'Image is too large.', storage_not_configured: 'File storage isn’t configured.' }
};

// Homepage carousel slides and promotional popups, stored in `campaigns`.
// Every campaign points at a real destination, and one tied to an offer is
// only shown while that offer is live (lib/campaignRepo.js).
export default function CampaignsTab() {
  const { lang, courses, showToast } = useApp();
  const en = lang === 'en';
  const E = ERR[en ? 'en' : 'bn'];
  const { data, loading, error, reload, setData } = useAdminData('/api/campaigns');
  const offers = useAdminData('/api/offers');
  const [cats, setCats] = useState([]);
  const [classes, setClasses] = useState([]);
  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then((d) => setCats(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/classes').then((r) => r.json()).then((d) => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  const [kind, setKind] = useState('slide');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [upload, setUpload] = useState(null); // percent | null
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const TARGET = {
    course: en ? 'Course' : 'কোর্স', upcoming: en ? 'Upcoming announcement' : 'আসন্ন কোর্সের ঘোষণা', subject: en ? 'Subject catalog' : 'বিষয়ের ক্যাটালগ',
    class: en ? 'Class catalog' : 'শ্রেণির ক্যাটালগ', collection: en ? 'Collection' : 'সংগ্রহ', campaign: en ? 'Campaign page' : 'ক্যাম্পেইন পেজ'
  };
  const COLLECTION = { featured: en ? 'Featured' : 'নির্বাচিত কোর্স', new: en ? 'New arrivals' : 'নতুন কোর্স', upcoming: en ? 'Upcoming' : 'আসন্ন কোর্স' };
  const PAGES = { all: en ? 'Every public page' : 'সব পাবলিক পেজ', home: en ? 'Homepage' : 'হোমপেজ', catalog: en ? 'Catalog' : 'ক্যাটালগ', course: en ? 'Course pages' : 'কোর্স পেজ' };
  const AUD = {
    all: en ? 'Everyone' : 'সবাই', guests: en ? 'Signed-out visitors' : 'লগইন ছাড়া দর্শক', students: en ? 'Signed-in students' : 'লগইন করা শিক্ষার্থী',
    new_visitors: en ? 'First-time visitors' : 'প্রথমবার আসা দর্শক', returning: en ? 'Returning visitors' : 'ফিরে আসা দর্শক',
    from_campaign: en ? 'Visitors from an ad campaign' : 'নির্দিষ্ট বিজ্ঞাপন থেকে আসা দর্শক', interested: en ? 'Visitors interested in a subject' : 'নির্দিষ্ট বিষয়ে আগ্রহী দর্শক'
  };
  const TRIG = {
    delay: en ? 'After a delay (seconds)' : 'কিছুক্ষণ পর (সেকেন্ড)', scroll: en ? 'After scrolling (% of page)' : 'স্ক্রল করার পর (% পেজ)',
    exit: en ? 'When leaving (exit intent)' : 'চলে যাওয়ার মুহূর্তে (এক্সিট ইনটেন্ট)', pageviews: en ? 'After N pages this visit' : 'এই ভিজিটে N টি পেজ দেখার পর'
  };

  const targetOptions = () => {
    switch (form?.targetType) {
      case 'course': return courses.filter((c) => c.published).map((c) => ({ value: c.slug, label: c.title }));
      case 'upcoming': return courses.filter((c) => !c.published && c.isUpcoming).map((c) => ({ value: c.slug, label: c.title }));
      case 'subject': return cats.map((c) => ({ value: c.slug, label: c.name }));
      case 'class': return classes.map((c) => ({ value: c.slug, label: c.name }));
      case 'collection': return Object.entries(COLLECTION).map(([value, label]) => ({ value, label }));
      default: return [];
    }
  };
  const offerText = (o) => (o ? `${o.name} · ${o.type === 'percent' ? `${num(lang, o.value)}%` : taka(lang, o.value)}` : '');

  const statusOf = (c) => {
    if (c.status !== 'published') return ['', en ? 'Draft' : 'খসড়া'];
    if (!c.enabled) return ['badge-warning', en ? 'Disabled' : 'বন্ধ'];
    if (!c.targetHref) return ['badge-danger', en ? 'Destination missing' : 'গন্তব্য নেই'];
    if (c.offerId && c.offer?.state !== 'live') return ['badge-warning', en ? 'Offer not live' : 'অফার চালু নেই'];
    if (c.live) return ['badge-success', en ? 'Live' : 'চলমান'];
    return ['badge-info', en ? 'Scheduled / ended' : 'নির্ধারিত / শেষ'];
  };

  const save = async (e) => {
    e?.preventDefault();
    setBusy(true); setFormErr('');
    try {
      const body = { ...form, offerId: form.offerId || null, startsAt: form.startsAt || null, endsAt: form.endsAt || null, frequencyHours: Number(form.frequencyHours) };
      const list = await send('/api/campaigns', 'POST', body);
      setData(list);
      showToast(en ? 'Campaign saved' : 'ক্যাম্পেইন সংরক্ষিত', 'success');
      if (form.id) setForm(null);
      else {
        // keep the dialog open on the new record so an image can be added
        const created = list.filter((c) => c.kind === form.kind).sort((a, b) => b.id - a.id)[0];
        if (created) setForm(toForm(created)); else setForm(null);
      }
    } catch (err) { setFormErr(E[err.message] || (en ? 'Couldn’t save.' : 'সংরক্ষণ করা যায়নি।')); }
    finally { setBusy(false); }
  };
  const act = async (c, action, extra) => {
    if (action === 'delete' && !window.confirm(en ? `Delete “${c.title}”?` : `“${c.title}” মুছে ফেলবেন?`)) return;
    try { setData(await send('/api/campaigns', 'PATCH', { id: c.id, action, ...extra })); }
    catch (err) { showToast(E[err.message] || (en ? 'That didn’t work' : 'কাজটি করা যায়নি'), 'error'); }
  };
  const uploadImage = async (file) => {
    if (!file || !form?.id) return;
    setFormErr(''); setUpload(0);
    try {
      const { uploadUrl, key } = await send(`/api/campaigns/${form.id}/image`, 'POST', { fileName: file.name, contentType: file.type, size: file.size });
      await putFile(uploadUrl, file, file.type, setUpload);
      const list = await send(`/api/campaigns/${form.id}/image`, 'PATCH', { key });
      setData(list);
      const fresh = list.find((c) => c.id === form.id);
      if (fresh) setForm((f) => ({ ...f, imageUrl: fresh.imageUrl, imageKey: fresh.imageKey }));
    } catch (err) { setFormErr(E[err.message] || (en ? 'Upload failed.' : 'আপলোড ব্যর্থ হয়েছে।')); }
    finally { setUpload(null); }
  };

  const all = data || [];
  const rows = all.filter((c) => c.kind === kind);
  const liveOffers = (offers.data || []).filter((o) => o.state !== 'ended');
  const selOffer = form?.offerId ? (offers.data || []).find((o) => String(o.id) === String(form.offerId)) : null;

  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="seg" role="group" aria-label={en ? 'Campaign type' : 'ক্যাম্পেইনের ধরন'}>
        {[['slide', en ? 'Homepage carousel' : 'হোমপেজ ক্যারোসেল'], ['popup', en ? 'Popups' : 'পপআপ']].map(([k, l]) => (
          <button key={k} type="button" className="seg-btn" aria-pressed={kind === k} onClick={() => setKind(k)}>
            {l} <span className="badge">{num(lang, all.filter((c) => c.kind === k).length)}</span>
          </button>
        ))}
      </div>

      <DataTable key={kind} lang={lang} caption={kind === 'slide' ? 'slides' : 'popups'} rows={rows} loading={loading} error={error ? true : null} onRetry={reload}
        searchText={(c) => `${c.title} ${c.targetLabel || ''}`}
        initialSort={{ key: 'position', dir: 'asc' }}
        toolbar={<button type="button" className="btn btn-primary btn-sm" onClick={() => { setFormErr(''); setForm({ ...BLANK, kind, pages: kind === 'popup' ? ['home', 'catalog'] : ['home'] }); }}><Icon name="plus" size={15} />{kind === 'slide' ? (en ? 'New slide' : 'নতুন স্লাইড') : (en ? 'New popup' : 'নতুন পপআপ')}</button>}
        emptyState={<p>{kind === 'slide' ? (en ? 'No slides — the homepage shows its regular hero instead.' : 'কোনো স্লাইড নেই — হোমপেজে সাধারণ হিরো দেখানো হচ্ছে।') : (en ? 'No popups.' : 'কোনো পপআপ নেই।')}</p>}
        columns={[
          { key: 'position', label: '#', render: (c) => <span className="tabular small muted">{num(lang, rows.filter((x) => x.position <= c.position).length)}</span> },
          { key: 'title', label: en ? 'Campaign' : 'ক্যাম্পেইন', minWidth: 260, render: (c) => (
            <div className="row" style={{ '--gap': '10px' }}>
              <div className="camp-thumb">{c.imageUrl ? <img src={c.imageUrl} alt="" /> : <Icon name="image" size={18} />}</div>
              <div style={{ minWidth: 0 }}><div className="strong">{c.title}</div><div className="xsmall muted">{c.ctaLabel} → {c.targetHref ? <span className="mono">{c.targetHref}</span> : '—'}</div></div>
            </div>) },
          { key: 'offer', label: en ? 'Discount' : 'ছাড়', sortable: false, render: (c) => (c.offer ? <span className="small">{offerText(c.offer)}</span> : <span className="xsmall muted">—</span>) },
          { key: 'startsAt', label: en ? 'Schedule' : 'সময়সূচি', render: (c) => <span className="small muted nowrap">{c.startsAt ? dateLabel(lang, c.startsAt) : (en ? 'Now' : 'এখন')} – {c.endsAt ? dateLabel(lang, c.endsAt) : (en ? 'no end' : 'শেষ নেই')}</span> },
          { key: 'audience', label: en ? 'Shown to' : 'দর্শক', render: (c) => <span className="xsmall">{AUD[c.audience]}<br /><span className="muted">{c.pages.map((p) => PAGES[p]).join(', ')}</span></span> },
          { key: 'status', label: en ? 'Status' : 'অবস্থা', sort: (c) => statusOf(c)[1], render: (c) => { const [cls, l] = statusOf(c); return <span className={`badge ${cls}`}>{l}</span>; } }
        ]}
        rowActions={(c) => {
          const i = rows.findIndex((x) => x.id === c.id);
          return (<>
            <button type="button" className="btn btn-ghost btn-icon btn-sm" disabled={i <= 0} onClick={() => act(c, 'move', { dir: 'up' })} aria-label={`${en ? 'Move up' : 'উপরে'}: ${c.title}`} data-tooltip={en ? 'Move up' : 'উপরে'}><Icon name="arrowUp" size={15} /></button>
            <button type="button" className="btn btn-ghost btn-icon btn-sm" disabled={i === rows.length - 1} onClick={() => act(c, 'move', { dir: 'down' })} aria-label={`${en ? 'Move down' : 'নিচে'}: ${c.title}`} data-tooltip={en ? 'Move down' : 'নিচে'}><Icon name="arrowDown" size={15} /></button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setFormErr(''); setForm(toForm(c)); }}><Icon name="edit" size={14} />{en ? 'Edit' : 'সম্পাদনা'}</button>
            {c.status === 'published'
              ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => act(c, c.enabled ? 'disable' : 'enable')}>{c.enabled ? (en ? 'Disable' : 'বন্ধ') : (en ? 'Enable' : 'চালু')}</button>
              : <button type="button" className="btn btn-primary btn-sm" onClick={() => act(c, 'publish')}>{en ? 'Publish' : 'প্রকাশ'}</button>}
          </>);
        }}
      />

      <Dialog open={!!form} onClose={() => setForm(null)} wide closeLabel={en ? 'Close' : 'বন্ধ'}
        title={form?.id ? (en ? 'Edit campaign' : 'ক্যাম্পেইন সম্পাদনা') : form?.kind === 'popup' ? (en ? 'New popup' : 'নতুন পপআপ') : (en ? 'New slide' : 'নতুন স্লাইড')}>
        {form && (
          <form className="camp-editor" onSubmit={save} noValidate>
            <div className="stack" style={{ '--gap': '14px' }}>
              <fieldset className="stack" style={{ '--gap': '12px' }}>
                <legend className="h5">{en ? 'Content' : 'বিষয়বস্তু'}</legend>
                <div className="field"><label htmlFor="cp-title">{en ? 'Heading' : 'শিরোনাম'}</label><input id="cp-title" className="input" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={191} required /></div>
                <div className="field"><label htmlFor="cp-body">{en ? 'Description' : 'বিবরণ'}</label><textarea id="cp-body" className="textarea" rows={3} value={form.body} onChange={(e) => set('body', e.target.value)} maxLength={600} /></div>
                <div className="field"><label htmlFor="cp-cta">{en ? 'Button label' : 'বোতামের লেখা'}</label><input id="cp-cta" className="input" value={form.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} maxLength={80} placeholder={en ? 'e.g. View course' : 'যেমন: কোর্সটি দেখুন'} required /></div>
              </fieldset>

              <fieldset className="stack" style={{ '--gap': '12px' }}>
                <legend className="h5">{en ? 'Image' : 'ছবি'}</legend>
                {!form.id ? <p className="small muted">{en ? 'Save first, then add an image.' : 'আগে সংরক্ষণ করুন, তারপর ছবি যোগ করুন।'}</p> : (<>
                  <ImageDropzone spec={IMAGE_SPECS[form.kind === 'popup' ? 'popup' : 'slide']} imageUrl={form.imageUrl} alt={form.imageAlt} lang={lang} progress={upload} onFile={uploadImage} />
                  <div className="field"><label htmlFor="cp-alt">{en ? 'Image description (alt text)' : 'ছবির বর্ণনা (alt টেক্সট)'}</label><input id="cp-alt" className="input" value={form.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} maxLength={255} /></div>
                </>)}
              </fieldset>

              <fieldset className="stack" style={{ '--gap': '12px' }}>
                <legend className="h5">{en ? 'Destination & discount' : 'গন্তব্য ও ছাড়'}</legend>
                <div className="form-grid">
                  <div className="field"><label htmlFor="cp-tt">{en ? 'Links to' : 'লিংক'}</label>
                    <select id="cp-tt" className="select" value={form.targetType} onChange={(e) => setForm((f) => ({ ...f, targetType: e.target.value, targetValue: '' }))}>
                      {Object.entries(TARGET).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select></div>
                  {form.targetType !== 'campaign' && (
                    <div className="field"><label htmlFor="cp-tv">{TARGET[form.targetType]}</label>
                      <select id="cp-tv" className="select" value={form.targetValue} onChange={(e) => set('targetValue', e.target.value)} required>
                        <option value="">{en ? 'Choose…' : 'বেছে নিন…'}</option>
                        {targetOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select></div>
                  )}
                </div>
                <div className="field"><label htmlFor="cp-offer">{en ? 'Discount offer (optional)' : 'ছাড়ের অফার (ঐচ্ছিক)'}</label>
                  <select id="cp-offer" className="select" value={form.offerId || ''} onChange={(e) => set('offerId', e.target.value)}>
                    <option value="">{en ? 'None' : 'কোনোটি নয়'}</option>
                    {liveOffers.map((o) => <option key={o.id} value={o.id}>{offerText(o)}</option>)}
                  </select>
                  <span className="xsmall muted">{en ? 'The campaign is hidden automatically whenever this offer isn’t live.' : 'অফারটি চালু না থাকলে ক্যাম্পেইন নিজে থেকেই লুকানো থাকবে।'}</span>
                </div>
              </fieldset>

              <fieldset className="stack" style={{ '--gap': '12px' }}>
                <legend className="h5">{en ? 'Schedule & audience' : 'সময়সূচি ও দর্শক'}</legend>
                <div className="form-grid">
                  <div className="field"><label htmlFor="cp-start">{en ? 'Starts (optional)' : 'শুরু (ঐচ্ছিক)'}</label><input id="cp-start" type="datetime-local" className="input" value={form.startsAt || ''} onChange={(e) => set('startsAt', e.target.value)} /></div>
                  <div className="field"><label htmlFor="cp-end">{en ? 'Ends (optional)' : 'শেষ (ঐচ্ছিক)'}</label><input id="cp-end" type="datetime-local" className="input" value={form.endsAt || ''} onChange={(e) => set('endsAt', e.target.value)} /></div>
                  <div className="field"><label htmlFor="cp-aud">{en ? 'Shown to' : 'দর্শক'}</label>
                    <select id="cp-aud" className="select" value={form.audience} onChange={(e) => set('audience', e.target.value)}>
                      {Object.entries(AUD).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select></div>
                  {form.audience === 'from_campaign' && (
                    <div className="field"><label htmlFor="cp-utm" className="req">{en ? 'utm_campaign value' : 'utm_campaign মান'}</label><input id="cp-utm" className="input" required maxLength={150} placeholder="eid-sale-fb" value={form.utmCampaign || ''} onChange={(e) => set('utmCampaign', e.target.value)} /></div>
                  )}
                  {form.audience === 'interested' && (
                    <div className="field"><label htmlFor="cp-int" className="req">{en ? 'Subject (category key)' : 'বিষয় (ক্যাটাগরি কী)'}</label><input id="cp-int" className="input" required maxLength={100} placeholder="physics" value={form.interestCategory || ''} onChange={(e) => set('interestCategory', e.target.value)} /></div>
                  )}
                  {form.kind === 'popup' && (
                    <div className="field"><label htmlFor="cp-trig">{en ? 'Show when' : 'কখন দেখাবে'}</label>
                      <select id="cp-trig" className="select" value={form.triggerType || 'delay'} onChange={(e) => set('triggerType', e.target.value)}>
                        {Object.entries(TRIG).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select></div>
                  )}
                  {form.kind === 'popup' && form.triggerType !== 'exit' && (
                    <div className="field"><label htmlFor="cp-tv">{form.triggerType === 'scroll' ? '%' : form.triggerType === 'pageviews' ? (en ? 'Pages' : 'পেজ') : (en ? 'Seconds' : 'সেকেন্ড')}</label>
                      <input id="cp-tv" type="number" className="input" required min={form.triggerType === 'scroll' ? 10 : form.triggerType === 'pageviews' ? 1 : 0} max={form.triggerType === 'scroll' ? 100 : 600} value={form.triggerValue ?? 3} onChange={(e) => set('triggerValue', e.target.value)} /></div>
                  )}
                  {form.kind === 'popup' && (
                    <div className="field"><label htmlFor="cp-freq">{en ? 'Show again after (hours)' : 'আবার দেখাবে (ঘণ্টা পর)'}</label><input id="cp-freq" type="number" min={1} max={720} className="input" value={form.frequencyHours} onChange={(e) => set('frequencyHours', e.target.value)} /></div>
                  )}
                </div>
                {form.kind === 'popup' && (
                  <div role="group" aria-labelledby="cp-pages-l" className="stack" style={{ '--gap': '6px' }}>
                    <span id="cp-pages-l" className="small strong">{en ? 'Pages' : 'পেজ'}</span>
                    <div className="cluster">
                      {Object.entries(PAGES).map(([p, l]) => (
                        <label key={p} className="check"><input type="checkbox" checked={form.pages.includes(p)} onChange={(e) => set('pages', e.target.checked ? [...form.pages, p] : form.pages.filter((x) => x !== p))} />{l}</label>
                      ))}
                    </div>
                    <span className="xsmall muted">{en ? 'Popups never appear on checkout or while watching lessons.' : 'চেকআউট বা পাঠ দেখার সময় পপআপ কখনো দেখানো হয় না।'}</span>
                  </div>
                )}
              </fieldset>
              {formErr && <p className="field-error" role="alert">{formErr}</p>}
            </div>

            <aside className="stack camp-preview-col" style={{ '--gap': '10px' }} aria-label={en ? 'Preview' : 'প্রিভিউ'}>
              <span className="small strong">{en ? 'Preview' : 'প্রিভিউ'}</span>
              <div className={`camp-preview ${form.kind}`}>
                <div className="camp-preview-img" style={{ aspectRatio: form.kind === 'popup' ? '16 / 9' : '2 / 1' }}>{form.imageUrl ? <img src={form.imageUrl} alt={form.imageAlt || ''} /> : <Icon name="image" size={28} />}</div>
                <div className="camp-preview-text">
                  {selOffer && <span className="badge badge-brand">{selOffer.type === 'percent' ? (en ? `${selOffer.value}% off` : `${num(lang, selOffer.value)}% ছাড়`) : (en ? `${taka(lang, selOffer.value)} off` : `${taka(lang, selOffer.value)} ছাড়`)}</span>}
                  <strong className="clamp-2">{form.title || (en ? 'Heading' : 'শিরোনাম')}</strong>
                  {form.body && <span className="small clamp-2">{form.body}</span>}
                  <span className="btn btn-primary btn-sm" aria-hidden="true">{form.ctaLabel || (en ? 'Button' : 'বোতাম')}</span>
                </div>
              </div>
              {selOffer?.endsAt && <span className="xsmall muted">{en ? 'Offer valid until ' : 'অফারের মেয়াদ '}{dateLabel(lang, selOffer.endsAt)}</span>}
              <div className="row" style={{ justifyContent: 'flex-end', '--gap': '8px', marginTop: 'auto' }}>
                {form.id && <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', marginRight: 'auto' }} onClick={() => { const c = all.find((x) => x.id === form.id); setForm(null); if (c) act(c, 'delete'); }}><Icon name="trash" size={14} />{en ? 'Delete' : 'মুছুন'}</button>}
                <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>{en ? 'Close' : 'বন্ধ'}</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy && <span className="spinner" aria-hidden="true" />}{en ? 'Save' : 'সংরক্ষণ'}</button>
              </div>
            </aside>
          </form>
        )}
      </Dialog>
    </div>
  );
}

function toForm(c) {
  return { ...c, offerId: c.offerId ? String(c.offerId) : '', startsAt: local(c.startsAt), endsAt: local(c.endsAt) };
}
