'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { useAdminData } from '@/components/owner/useAdminData';
import { ColumnChart, BarList, Funnel, Delta } from '@/components/admin/Charts';
import { num, taka } from '@/lib/copy';

const RANGES = [7, 30, 90, 365];

const L = {
  bn: {
    overview: 'ওভারভিউ', traffic: 'ট্রাফিক ও বিজ্ঞাপন', learning: 'শেখা', quizzes: 'কুইজ', days: (d) => `${d} দিন`, export: 'CSV ডাউনলোড',
    revenue: 'আয়', orders: 'পরিশোধিত অর্ডার', aov: 'গড় অর্ডার', enrollments: 'নতুন ভর্তি', newStudents: 'নতুন শিক্ষার্থী', activeLearners: 'সক্রিয় শিক্ষার্থী', conversion: 'পেমেন্ট সফলতা', refunds: 'রিফান্ড',
    dailyRevenue: 'দৈনিক আয়', dailyEnroll: 'দৈনিক ভর্তি', dailyActive: 'দৈনিক সক্রিয় শিক্ষার্থী', topRevenue: 'সবচেয়ে বেশি আয়', topEnroll: 'সবচেয়ে বেশি ভর্তি', buyers: (n) => `${n} ক্রেতা`,
    sources: 'অর্ডার কোথা থেকে', direct: 'সরাসরি', coupon: 'কুপন', affiliate: 'অ্যাফিলিয়েট', free: 'ফ্রি', ratings: 'রিভিউ রেটিং',
    funnel: 'শেখার ফানেল (কোর্স অনুযায়ী)', enrolled: 'ভর্তি', started: 'শুরু করেছে', halfway: 'অর্ধেক', completed: 'সম্পন্ন', rate: 'সম্পন্নের হার',
    quizPerf: 'কুইজ ফলাফল', attempts: 'চেষ্টা', avg: 'গড় নম্বর', pass: 'পাসের হার',
    visitors: 'ভিজিটর', pageviews: 'পেজ ভিউ', courseViews: 'কোর্স ভিউ', newV: 'নতুন', returning: 'ফিরে আসা',
    channels: 'কোথা থেকে আসছে (সোর্স / ক্যাম্পেইন)', source: 'সোর্স', medium: 'মাধ্যম', campaign: 'ক্যাম্পেইন', signups: 'সাইন-আপ', convRate: 'কেনার হার', rpv: 'প্রতি ভিজিটরে আয়',
    best: 'সেরা বিজ্ঞাপন ক্যাম্পেইন', bestWhy: 'প্রতি ভিজিটরে সবচেয়ে বেশি আয় (কমপক্ষে ৫ ভিজিটর)', noAds: 'এখনো কোনো বিজ্ঞাপন ক্যাম্পেইনের ট্রাফিক নেই। বিজ্ঞাপনের লিংকে utm_source, utm_medium ও utm_campaign যোগ করুন।',
    popups: 'পপআপ / ক্যাম্পেইন পারফরম্যান্স', impressions: 'দেখানো', clicks: 'ক্লিক', ctr: 'CTR', dismiss: 'বন্ধ', conv: 'বিক্রি (৭ দিনে)',
    landing: 'যে পেজে প্রথম আসে', devices: 'ডিভাইস', utmHelp: 'লিংক বানান', loading: 'লোড হচ্ছে…', error: 'লোড করা যায়নি', retry: 'আবার চেষ্টা', none: 'এই সময়ে কোনো ডেটা নেই'
  },
  en: {
    overview: 'Overview', traffic: 'Traffic & ads', learning: 'Learning', quizzes: 'Quizzes', days: (d) => `${d} days`, export: 'Download CSV',
    revenue: 'Revenue', orders: 'Paid orders', aov: 'Average order', enrollments: 'New enrollments', newStudents: 'New students', activeLearners: 'Active learners', conversion: 'Payment success', refunds: 'Refunds',
    dailyRevenue: 'Daily revenue', dailyEnroll: 'Daily enrollments', dailyActive: 'Daily active learners', topRevenue: 'Top by revenue', topEnroll: 'Top by enrollments', buyers: (n) => `${n} buyers`,
    sources: 'Where orders came from', direct: 'Direct', coupon: 'Coupon', affiliate: 'Affiliate', free: 'Free', ratings: 'Review ratings',
    funnel: 'Learning funnel by course', enrolled: 'Enrolled', started: 'Started', halfway: 'Halfway', completed: 'Completed', rate: 'Completion rate',
    quizPerf: 'Quiz results', attempts: 'Attempts', avg: 'Average score', pass: 'Pass rate',
    visitors: 'Visitors', pageviews: 'Page views', courseViews: 'Course views', newV: 'New', returning: 'Returning',
    channels: 'Where visitors come from (source / campaign)', source: 'Source', medium: 'Medium', campaign: 'Campaign', signups: 'Sign-ups', convRate: 'Purchase rate', rpv: 'Revenue / visitor',
    best: 'Best ad campaign', bestWhy: 'Highest revenue per visitor (min. 5 visitors)', noAds: 'No ad-campaign traffic yet. Add utm_source, utm_medium and utm_campaign to your ad links.',
    popups: 'Popup / campaign performance', impressions: 'Shown', clicks: 'Clicks', ctr: 'CTR', dismiss: 'Closed', conv: 'Sales (7 days)',
    landing: 'Landing pages', devices: 'Devices', utmHelp: 'Build a link', loading: 'Loading…', error: 'Couldn’t load', retry: 'Retry', none: 'No data in this period'
  }
};

function State({ q, l }) {
  if (q.loading && !q.data) return <div className="kpi-grid">{[0, 1, 2, 3].map((i) => <div key={i} className="sk-card"><div className="skeleton sk-yellow" style={{ height: 30, width: '50%', margin: 0, border: 0 }} /><div className="skeleton" style={{ height: 12 }} /></div>)}</div>;
  if (q.error) return <div className="surface state"><p>{l.error}</p><button type="button" className="btn btn-secondary" onClick={q.reload}><Icon name="refresh" size={16} />{l.retry}</button></div>;
  return null;
}

function UtmBuilder({ l, lang }) {
  const [f, setF] = useState({ url: typeof window !== 'undefined' ? `${window.location.origin}/` : '', source: 'facebook', medium: 'paid-social', campaign: '' });
  const link = (() => {
    try {
      const u = new URL(f.url);
      if (f.source) u.searchParams.set('utm_source', f.source.trim().toLowerCase());
      if (f.medium) u.searchParams.set('utm_medium', f.medium.trim().toLowerCase());
      if (f.campaign) u.searchParams.set('utm_campaign', f.campaign.trim().toLowerCase().replace(/\s+/g, '-'));
      return u.toString();
    } catch { return ''; }
  })();
  return (
    <details className="surface surface-pad">
      <summary className="strong" style={{ cursor: 'pointer' }}><Icon name="link" size={16} /> {l.utmHelp} (UTM)</summary>
      <div className="form-grid" style={{ marginTop: 12 }}>
        <div className="field"><label htmlFor="utm-url">URL</label><input id="utm-url" className="input" type="url" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
        <div className="field"><label htmlFor="utm-src">{l.source}</label><input id="utm-src" className="input" list="utm-sources" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} /></div>
        <div className="field"><label htmlFor="utm-med">{l.medium}</label><input id="utm-med" className="input" list="utm-media" value={f.medium} onChange={(e) => setF({ ...f, medium: e.target.value })} /></div>
        <div className="field"><label htmlFor="utm-camp">{l.campaign}</label><input id="utm-camp" className="input" placeholder="eid-offer-2026" value={f.campaign} onChange={(e) => setF({ ...f, campaign: e.target.value })} /></div>
      </div>
      <datalist id="utm-sources"><option value="facebook" /><option value="google" /><option value="youtube" /><option value="instagram" /><option value="tiktok" /><option value="newsletter" /></datalist>
      <datalist id="utm-media"><option value="paid-social" /><option value="cpc" /><option value="email" /><option value="social" /><option value="video" /></datalist>
      {link && (
        <div className="row" style={{ marginTop: 12, flexWrap: 'wrap', '--gap': '8px' }}>
          <code className="grow" style={{ wordBreak: 'break-all', padding: 8, border: '2px solid var(--ink)', background: 'var(--surface-2)' }}>{link}</code>
          <button type="button" className="btn btn-secondary btn-sm" data-confirm="off" onClick={() => navigator.clipboard?.writeText(link)}><Icon name="file" size={14} />{lang === 'en' ? 'Copy' : 'কপি'}</button>
        </div>
      )}
    </details>
  );
}

function Traffic({ days, l, lang }) {
  const q = useAdminData(`/api/admin/traffic?days=${days}`);
  const d = q.data;
  const st = State({ q, l });
  if (st) return st;
  const pct = (v) => `${num(lang, v)}%`;
  return (
    <div className="stack" style={{ '--gap': '22px' }}>
      <div className="kpi-grid">
        <div className="kpi"><span className="kpi-label">{l.visitors}</span><span className="kpi-value">{num(lang, d.totals.visitors)}</span></div>
        <div className="kpi"><span className="kpi-label">{l.pageviews}</span><span className="kpi-value">{num(lang, d.totals.pageviews)}</span></div>
        <div className="kpi"><span className="kpi-label">{l.courseViews}</span><span className="kpi-value">{num(lang, d.totals.courseViews)}</span></div>
        <div className="kpi"><span className="kpi-label">{l.newV} / {l.returning}</span><span className="kpi-value">{num(lang, d.totals.newVisitors)} / {num(lang, d.totals.returning)}</span></div>
      </div>

      {d.bestAd ? (
        <div className="best-ad">
          <span className="sticker sticker-pink">{l.best}</span>
          <strong className="h3">{d.bestAd.campaign || `${d.bestAd.source} / ${d.bestAd.medium}`}</strong>
          <span className="small">{d.bestAd.source} · {d.bestAd.medium} — {l.bestWhy}</span>
          <span className="strong">{num(lang, d.bestAd.visitors)} {l.visitors} · {num(lang, d.bestAd.signups)} {l.signups} · {num(lang, d.bestAd.orders)} {l.orders} · {taka(lang, d.bestAd.revenue)} · {taka(lang, d.bestAd.revenuePerVisitor)} / {lang === 'en' ? 'visitor' : 'ভিজিটর'}</span>
        </div>
      ) : <div className="notice notice-info"><Icon name="info" size={18} />{l.noAds}</div>}

      <section className="surface surface-pad stack">
        <ColumnChart data={d.daily} valueKey="visitors" label={l.visitors} format={(v) => num(lang, v)} color="var(--c-cyan)" lang={lang} />
      </section>

      <section className="stack" style={{ '--gap': '10px' }}>
        <h2 className="h4">{l.channels}</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{l.source}</th><th>{l.medium}</th><th>{l.campaign}</th><th>{l.visitors}</th><th>{l.signups}</th><th>{l.orders}</th><th>{l.revenue}</th><th>{l.convRate}</th><th>{l.rpv}</th></tr></thead>
            <tbody>
              {!d.channels.length ? <tr><td colSpan={9} className="muted">{l.none}</td></tr> : d.channels.map((r) => (
                <tr key={`${r.source}|${r.medium}|${r.campaign}`}>
                  <td className="strong">{r.source}</td><td>{r.medium || '—'}</td><td>{r.campaign ? <span className="badge badge-brand">{r.campaign}</span> : '—'}</td>
                  <td className="tabular">{num(lang, r.visitors)}</td><td className="tabular">{num(lang, r.signups)} <span className="muted xsmall">({pct(r.signupRate)})</span></td>
                  <td className="tabular">{num(lang, r.orders)}</td><td className="tabular strong">{taka(lang, r.revenue)}</td><td className="tabular">{pct(r.purchaseRate)}</td><td className="tabular">{taka(lang, r.revenuePerVisitor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stack" style={{ '--gap': '10px' }}>
        <h2 className="h4">{l.popups}</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{l.campaign}</th><th>{l.impressions}</th><th>{l.clicks}</th><th>{l.ctr}</th><th>{l.dismiss}</th><th>{l.conv}</th></tr></thead>
            <tbody>
              {!d.popups.length ? <tr><td colSpan={6} className="muted">{l.none}</td></tr> : d.popups.map((p) => (
                <tr key={p.id}><td className="strong">{p.title}<div className="xsmall muted">{p.audience} · {p.triggerType}</div></td>
                  <td className="tabular">{num(lang, p.impressions)}</td><td className="tabular">{num(lang, p.clicks)}</td><td className="tabular strong">{pct(p.ctr)}</td>
                  <td className="tabular">{num(lang, p.dismissals)}</td><td className="tabular">{num(lang, p.orders)} · {taka(lang, p.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="panel-grid">
        <section className="surface surface-pad stack"><h2 className="h4">{l.landing}</h2><BarList rows={d.landing} valueKey="visitors" labelKey="path" format={(v) => num(lang, v)} empty={l.none} /></section>
        <section className="surface surface-pad stack"><h2 className="h4">{l.devices}</h2><BarList rows={d.devices} valueKey="visitors" labelKey="device" format={(v) => num(lang, v)} color="var(--c-violet)" empty={l.none} /></section>
      </div>
      <UtmBuilder l={l} lang={lang} />
    </div>
  );
}

function Overview({ days, l, lang, part }) {
  const q = useAdminData(`/api/admin/analytics?days=${days}`);
  const d = q.data;
  const st = State({ q, l });
  if (st) return st;
  if (part === 'learning') {
    return (
      <div className="stack" style={{ '--gap': '18px' }}>
        <section className="surface surface-pad"><ColumnChart data={d.series} valueKey="active" label={l.dailyActive} format={(v) => num(lang, v)} color="var(--c-lime)" lang={lang} /></section>
        <h2 className="h4">{l.funnel}</h2>
        {!d.funnel.length ? <p className="muted">{l.none}</p> : (
          <div className="panel-grid">
            {d.funnel.map((f) => (
              <section key={f.id} className="surface surface-pad stack" style={{ '--gap': '10px' }}>
                <div className="row between"><strong className="clamp-1">{f.title}</strong><span className="badge badge-success">{l.rate}: {num(lang, f.completionRate)}%</span></div>
                <Funnel row={f} labels={l} />
              </section>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (part === 'quizzes') {
    return (
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>{l.quizzes}</th><th>{l.attempts}</th><th>{l.avg}</th><th>{l.pass}</th></tr></thead>
          <tbody>
            {!d.quizzes.length ? <tr><td colSpan={4} className="muted">{l.none}</td></tr> : d.quizzes.map((x) => (
              <tr key={x.id}><td className="strong">{x.title}<div className="xsmall muted">{x.course}</div></td><td className="tabular">{num(lang, x.attempts)}</td>
                <td><div className="progress progress-sm" style={{ width: 120 }}><span style={{ width: `${x.avgPercent}%` }} /></div><span className="xsmall tabular">{num(lang, x.avgPercent)}%</span></td>
                <td className="tabular">{x.passRate == null ? '—' : `${num(lang, x.passRate)}%`}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  const k = d.kpis;
  const money = (v) => taka(lang, v);
  const kpis = [['revenue', money], ['orders', (v) => num(lang, v)], ['aov', money], ['enrollments', (v) => num(lang, v)], ['newStudents', (v) => num(lang, v)], ['activeLearners', (v) => num(lang, v)], ['conversion', (v) => `${num(lang, v)}%`], ['refunds', (v) => num(lang, v)]];
  return (
    <div className="stack" style={{ '--gap': '22px' }}>
      <div className="kpi-grid">
        {kpis.map(([key, f]) => (
          <div key={key} className="kpi"><span className="kpi-label">{l[key]}</span><span className="kpi-value tabular">{f(k[key].value)}</span>{k[key].delta !== undefined && key !== 'conversion' && key !== 'refunds' && <Delta value={k[key].delta} lang={lang} />}</div>
        ))}
      </div>
      <div className="panel-grid">
        <section className="surface surface-pad"><ColumnChart data={d.series} valueKey="revenue" label={l.dailyRevenue} format={money} color="var(--c-yellow)" lang={lang} /></section>
        <section className="surface surface-pad"><ColumnChart data={d.series} valueKey="enrollments" label={l.dailyEnroll} format={(v) => num(lang, v)} color="var(--c-pink)" lang={lang} /></section>
      </div>
      <div className="panel-grid">
        <section className="surface surface-pad stack"><h2 className="h4">{l.topRevenue}</h2><BarList rows={d.topRevenue} valueKey="revenue" format={money} sub={(r) => l.buyers(num(lang, r.buyers))} empty={l.none} /></section>
        <section className="surface surface-pad stack"><h2 className="h4">{l.topEnroll}</h2><BarList rows={d.topEnrollments} valueKey="enrollments" format={(v) => num(lang, v)} color="var(--c-lime)" empty={l.none} /></section>
        <section className="surface surface-pad stack"><h2 className="h4">{l.sources}</h2><BarList rows={d.sources.map((s) => ({ ...s, title: l[s.source] }))} valueKey="revenue" format={money} sub={(r) => `${num(lang, r.orders)} ${l.orders}`} color="var(--c-violet)" empty={l.none} /></section>
        <section className="surface surface-pad stack"><h2 className="h4">{l.ratings}{d.ratings.average ? ` · ★ ${num(lang, d.ratings.average)}` : ''}</h2><BarList rows={d.ratings.distribution.map((r) => ({ ...r, title: `${r.rating} ★` }))} valueKey="count" format={(v) => num(lang, v)} color="var(--c-orange)" empty={l.none} /></section>
      </div>
    </div>
  );
}

// Admin → Analytics. Business KPIs with period-over-period change, daily
// charts, learning funnels, quiz results, and Traffic & ads (sources, UTM
// campaigns, the best-performing ad, popup CTR and sales).
export default function AnalyticsTab() {
  const { lang } = useApp();
  const l = L[lang === 'en' ? 'en' : 'bn'];
  const [days, setDays] = useState(30);
  const [part, setPart] = useState('overview');
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="row between" style={{ flexWrap: 'wrap', '--gap': '12px' }}>
        <div className="tabs" role="tablist" style={{ flex: '1 1 auto' }}>
          {['overview', 'traffic', 'learning', 'quizzes'].map((p) => (
            <button key={p} type="button" role="tab" className="tab" aria-selected={part === p} onClick={() => setPart(p)}>{l[p]}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Range">
          {RANGES.map((r) => <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}>{l.days(num(lang, r))}</button>)}
        </div>
        <a className="btn btn-secondary btn-sm" href={`/api/admin/analytics?days=${days}&format=csv`} download><Icon name="download" size={14} />{l.export}</a>
      </div>
      {part === 'traffic' ? <Traffic days={days} l={l} lang={lang} /> : <Overview days={days} l={l} lang={lang} part={part} />}
    </div>
  );
}
