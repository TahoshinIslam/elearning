'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

const fieldStyle = {
  border: '1px solid var(--field-line)', background: '#fff', borderRadius: 8,
  padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', width: '100%'
};
const Section = ({ title, children }) => (
  <div className="panel" style={{ padding: 22, marginBottom: 18 }}>
    <div style={{ fontWeight: 700, marginBottom: 14 }}>{title}</div>
    {children}
  </div>
);

export default function HomepageTab() {
  const { t, api, showToast } = useApp();
  const [hero, setHero] = useState({ badge: '', title: '', highlight: '', subtitle: '' });
  const [testimonials, setTestimonials] = useState([]);
  const [partners, setPartners] = useState('');
  const [stats, setStats] = useState([]);
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    api.getHomepage().then((c) => {
      if (c.hero) setHero({ badge: c.hero.badge || '', title: c.hero.title || '', highlight: c.hero.highlight || '', subtitle: c.hero.subtitle || '' });
      setTestimonials(c.testimonials?.length ? c.testimonials : [{ name: '', batch: '', quote: '' }]);
      setPartners((c.partners || []).join(', '));
      setStats(c.stats?.length ? c.stats : [{ v: '', l: '' }, { v: '', l: '' }, { v: '', l: '' }, { v: '', l: '' }]);
      setFaqs(c.faqs?.length ? c.faqs : [{ q: '', a: '' }]);
    }).catch(() => {});
  }, []);

  const save = async (section, data) => {
    try { await api.saveHomepage(section, data); showToast(t.cmsSaved); }
    catch { showToast(t.errGeneric); }
  };
  const reset = async (section) => {
    try { await api.saveHomepage(section, null); showToast(t.cmsResetDone); }
    catch { showToast(t.errGeneric); }
  };

  const setTesti = (i, k, v) => setTestimonials((ts) => ts.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const setStat = (i, k, v) => setStats((s) => s.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const setFaq = (i, k, v) => setFaqs((fq) => fq.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.cmsTitle}</div>

      {/* HERO */}
      <Section title={t.cmsHero}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label className="label">{t.cmsBadge}</label><input value={hero.badge} onChange={(e) => setHero({ ...hero, badge: e.target.value })} style={fieldStyle} /></div>
          <div><label className="label">{t.cmsHighlight}</label><input value={hero.highlight} onChange={(e) => setHero({ ...hero, highlight: e.target.value })} style={fieldStyle} /></div>
        </div>
        <label className="label" style={{ marginTop: 12 }}>{t.cmsHeadline}</label>
        <input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} style={fieldStyle} />
        <label className="label" style={{ marginTop: 12 }}>{t.cmsSubtitle}</label>
        <textarea value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} rows={2} style={{ ...fieldStyle, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button className="btn-primary" style={{ borderRadius: 10 }} onClick={() => save('hero', hero)}>{t.cmsSave}</button>
          <button className="btn-ghost-sm" onClick={() => reset('hero')}>{t.cmsReset}</button>
        </div>
      </Section>

      {/* PARTNERS */}
      <Section title={t.cmsPartners}>
        <label className="label">{t.cmsPartnersHint}</label>
        <input value={partners} onChange={(e) => setPartners(e.target.value)} style={fieldStyle} placeholder="সিটি কলেজ, মডেল হাই স্কুল, …" />
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button className="btn-primary" style={{ borderRadius: 10 }} onClick={() => save('partners', partners.split(',').map((s) => s.trim()).filter(Boolean))}>{t.cmsSave}</button>
          <button className="btn-ghost-sm" onClick={() => reset('partners')}>{t.cmsReset}</button>
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section title={t.cmsTestimonials}>
        {testimonials.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 8, alignItems: 'start' }}>
            <input value={r.name} onChange={(e) => setTesti(i, 'name', e.target.value)} placeholder={t.cmsName} style={fieldStyle} />
            <input value={r.batch} onChange={(e) => setTesti(i, 'batch', e.target.value)} placeholder={t.cmsBatch} style={fieldStyle} />
            <button onClick={() => setTestimonials((ts) => ts.filter((_, idx) => idx !== i))} style={{ border: '1.5px solid var(--line)', background: '#fff', borderRadius: 8, padding: '0 12px', color: 'var(--danger,#c92a2a)', cursor: 'pointer' }}>✕</button>
            <textarea value={r.quote} onChange={(e) => setTesti(i, 'quote', e.target.value)} placeholder={t.cmsQuote} rows={2} style={{ ...fieldStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button onClick={() => setTestimonials((ts) => [...ts, { name: '', batch: '', quote: '' }])} style={{ border: '1.5px dashed var(--line)', background: '#fff', borderRadius: 10, padding: '9px 14px', fontWeight: 700, cursor: 'pointer', color: 'var(--ink-soft)' }}>{t.cmsAdd}</button>
          <button className="btn-primary" style={{ borderRadius: 10 }} onClick={() => save('testimonials', testimonials.filter((r) => r.name.trim() && r.quote.trim()))}>{t.cmsSave}</button>
          <button className="btn-ghost-sm" onClick={() => reset('testimonials')}>{t.cmsReset}</button>
        </div>
      </Section>

      {/* STATS */}
      <Section title={t.cmsStats}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap: 10 }}>
          {stats.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input value={r.v} onChange={(e) => setStat(i, 'v', e.target.value)} placeholder={t.cmsValue} style={{ ...fieldStyle, width: 90 }} />
              <input value={r.l} onChange={(e) => setStat(i, 'l', e.target.value)} placeholder={t.cmsLabel} style={fieldStyle} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button className="btn-primary" style={{ borderRadius: 10 }} onClick={() => save('stats', stats.filter((r) => r.v.trim() && r.l.trim()))}>{t.cmsSave}</button>
          <button className="btn-ghost-sm" onClick={() => reset('stats')}>{t.cmsReset}</button>
        </div>
      </Section>

      {/* FAQ */}
      <Section title={t.cdFaq}>
        {faqs.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 8, alignItems: 'start' }}>
            <input value={r.q} onChange={(e) => setFaq(i, 'q', e.target.value)} placeholder={t.cmsFaqQ} style={fieldStyle} />
            <button onClick={() => setFaqs((fq) => fq.filter((_, idx) => idx !== i))} style={{ border: '1.5px solid var(--line)', background: '#fff', borderRadius: 8, padding: '0 12px', color: 'var(--danger,#c92a2a)', cursor: 'pointer' }}>✕</button>
            <textarea value={r.a} onChange={(e) => setFaq(i, 'a', e.target.value)} placeholder={t.cmsFaqA} rows={2} style={{ ...fieldStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button onClick={() => setFaqs((fq) => [...fq, { q: '', a: '' }])} style={{ border: '1.5px dashed var(--line)', background: '#fff', borderRadius: 10, padding: '9px 14px', fontWeight: 700, cursor: 'pointer', color: 'var(--ink-soft)' }}>{t.cmsAdd}</button>
          <button className="btn-primary" style={{ borderRadius: 10 }} onClick={() => save('faqs', faqs.filter((r) => r.q.trim() && r.a.trim()))}>{t.cmsSave}</button>
          <button className="btn-ghost-sm" onClick={() => reset('faqs')}>{t.cmsReset}</button>
        </div>
      </Section>
    </div>
  );
}
