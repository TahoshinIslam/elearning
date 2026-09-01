'use client';

import { useState } from 'react';

// Category-tabbed card grid (Ostad-style). Generic over items so it can render
// course cards (learner + price + দেখুন) or live-class cards (LIVE badge + date + বিস্তারিত দেখি).
// items: [{ id, category, thumb, title, subtitle?, learners?, price?, free?, date?, onClick }]
export default function CourseCategoryGrid({
  t, title, subtitle, icon, items = [], catLabel, allLabel,
  variant = 'course', footerMore = false, onMore
}) {
  const cats = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const tabs = ['all', ...cats];
  const [tab, setTab] = useState('all');

  const shown = tab === 'all' ? items : items.filter((i) => i.category === tab);
  const label = (key) => (key === 'all' ? (allLabel || t.catAllCourses) : (catLabel ? catLabel(key) : key));

  const Card = ({ item }) => (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* thumbnail with play overlay */}
      <div style={{ position: 'relative' }}>
        <div
          className="placeholder-art"
          style={{
            height: 150, fontSize: 11,
            background: variant === 'live'
              ? 'repeating-linear-gradient(45deg,#2a2620,#2a2620 10px,#3b352c 10px,#3b352c 20px)'
              : undefined,
            color: variant === 'live' ? 'rgba(255,255,255,.55)' : undefined
          }}
        >
          {item.thumb || 'course'} · banner
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <span style={{ width: 48, height: 48, borderRadius: '50%', background: '#DC2626', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18, boxShadow: '0 4px 14px rgba(220,38,38,.5)' }}>▶</span>
        </div>
        <span style={{ position: 'absolute', top: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, background: '#fff', color: '#b91c1c', borderRadius: 99, padding: '4px 10px' }}>
          {variant === 'live' ? <><span className="live-dot" />{t.liveWord}</> : t.mode_free}
        </span>
      </div>

      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
        {variant === 'live' ? (
          <>
            {item.subtitle && <div style={{ fontSize: 11.5, color: 'var(--faint)', fontWeight: 600 }}>{item.subtitle}</div>}
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4, flex: 1 }}>{item.title}</div>
            {item.date && <div style={{ fontSize: 12, color: 'var(--brand-deep)', fontWeight: 700 }}>📅 {item.date}</div>}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
              <span>👥 {(item.learners || 0).toLocaleString('en-IN')} {t.cdEnrolledN}</span>
              <span style={{ color: 'var(--brand-deep)' }}>⚡ {item.free ? t.cdFree : `৳${item.price}`}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.4, flex: 1 }}>{item.title}</div>
          </>
        )}
        <button
          onClick={item.onClick}
          style={{ width: '100%', border: '1.5px solid var(--line)', background: 'var(--paper)', borderRadius: 10, padding: '11px', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
        >
          {variant === 'live' ? `${t.seeDetails} →` : `▶ ${t.cdViewDetails}`}
        </button>
      </div>
    </div>
  );

  return (
    <div className="panel" style={{ padding: '30px 28px' }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>{icon} {title}</h2>
        {subtitle && <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{subtitle}</p>}
      </div>

      {/* category tabs */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, marginBottom: 22 }}>
        {tabs.map((key) => {
          const on = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 'none', border: `1.5px solid ${on ? 'var(--coal)' : 'var(--line)'}`,
                background: on ? 'var(--coal)' : '#fff', color: on ? '#fff' : 'var(--ink)',
                borderRadius: 12, padding: '11px 20px', fontSize: 14, fontWeight: 700,
                fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              {label(key)}
            </button>
          );
        })}
      </div>

      {/* cards */}
      {shown.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--faint)' }}>{t.catNoResults}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(250px,100%),1fr))', gap: 18 }}>
          {shown.map((item) => <Card key={item.id} item={item} />)}
        </div>
      )}

      {footerMore && (
        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <button onClick={onMore} style={{ border: '1.5px solid var(--line)', background: '#fff', borderRadius: 10, padding: '11px 26px', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
            {t.seeMore} ⌄
          </button>
        </div>
      )}
    </div>
  );
}
