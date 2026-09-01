'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';
import { catLabel, catMeta, courseCategories } from '@/lib/catalog';
import Icon from '@/components/Icon';

// deterministic pseudo values so cards look "live" (seats left / days left) for the demo
const seatsOf = (id) => 3 + ((id * 17) % 63);
const daysOf = (id) => 9 + ((id * 7) % 56);

function Catalog() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, courses, batches, addToCart, isInCart, setCartOpen } = useApp();

  const [q, setQ] = useState(params.get('q') || '');
  const [activeCat, setActiveCat] = useState(params.get('cat') || 'all');
  const [level, setLevel] = useState('all');
  const [instructor, setInstructor] = useState('all');
  const [price, setPrice] = useState('all');
  const [sort, setSort] = useState('popular');

  const published = useMemo(() => courses.filter((c) => c.published), [courses]);
  const levels = useMemo(() => [...new Set(published.map((c) => c.level).filter(Boolean))], [published]);
  const instructors = useMemo(() => [...new Set(published.map((c) => c.instructor).filter(Boolean))], [published]);

  const groups = useMemo(() => courseCategories(published).filter((g) => g.key !== 'all'), [published]);
  const tabs = ['all', ...groups.map((g) => g.key)];

  // apply every active filter, then sort
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = published.filter((c) => {
      if (term && !`${c.title} ${c.tagline || ''} ${c.instructor || ''}`.toLowerCase().includes(term)) return false;
      if (activeCat !== 'all' && (c.category || 'skills') !== activeCat) return false;
      if (level !== 'all' && c.level !== level) return false;
      if (instructor !== 'all' && c.instructor !== instructor) return false;
      if (price === 'free' && c.price !== 0) return false;
      if (price === 'paid' && c.price === 0) return false;
      return true;
    });
    const by = {
      popular: (a, b) => (b.ratingCount || 0) - (a.ratingCount || 0),
      latest: (a, b) => b.id - a.id,
      priceLow: (a, b) => a.price - b.price,
      priceHigh: (a, b) => b.price - a.price
    }[sort];
    return [...list].sort(by);
  }, [published, q, activeCat, level, instructor, price, sort]);

  const featured = useMemo(() => published.filter((c) => c.featured), [published]);
  const filtersActive = activeCat !== 'all' || level !== 'all' || instructor !== 'all' || price !== 'all' || q.trim();
  const resetFilters = () => { setQ(''); setActiveCat('all'); setLevel('all'); setInstructor('all'); setPrice('all'); setSort('popular'); };

  const batchFor = (courseId) => batches.find((b) => b.courseId === courseId);
  const selectStyle = { border: '1.5px solid var(--line)', borderRadius: 10, padding: '9px 12px', fontSize: 13.5, fontFamily: 'inherit', background: '#fff', cursor: 'pointer' };

  const Chip = ({ children }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', background: 'var(--line-softer)', borderRadius: 7, padding: '4px 9px' }}>
      {children}
    </span>
  );

  const Card = ({ c }) => {
    const b = batchFor(c.id);
    return (
      <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="placeholder-art" style={{ height: 150, fontSize: 11 }}>{c.thumb || 'course'} · banner</div>
        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {c.featured && <Chip><Icon name="star" size={11} /> {t.courseFeatured}</Chip>}
            <Chip>{t.batchLabel} {b ? b.name.replace(/[^0-9০-৯]/g, '') || b.name : c.id}</Chip>
            <Chip><Icon name="users" size={11} /> {seatsOf(c.id)} {t.seatsLeft}</Chip>
            <Chip><Icon name="clock" size={11} /> {daysOf(c.id)} {t.daysLeft}</Chip>
          </div>
          <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.4, flex: 1 }}>{c.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span className="display" style={{ fontSize: 18 }}>{c.price === 0 ? t.cdFree : `৳${c.price}`}</span>
            <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="star" size={13} /> {c.rating}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => router.push(`/course/${c.slug}`)}
              style={{ flex: 1, border: '1.5px solid var(--line)', background: 'var(--paper)', borderRadius: 10, padding: '12px', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              {t.cdViewDetails}
            </button>
            {isInCart(c.id) ? (
              <button
                onClick={() => setCartOpen(true)}
                style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'var(--green-chip-bg)', color: 'var(--green-chip-fg)', borderRadius: 10, padding: '12px 14px', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <Icon name="check" size={15} /> {t.cartInCart}
              </button>
            ) : (
              <button
                onClick={() => addToCart(c)}
                aria-label={t.cartAdd}
                style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'var(--brand)', color: '#fff', borderRadius: 10, padding: '12px 14px', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <Icon name="cartPlus" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <SiteNav />

      {/* sticky category tab bar */}
      <div style={{ position: 'sticky', top: 61, zIndex: 30, background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 20px', display: 'flex', gap: 10, overflowX: 'auto' }}>
          {tabs.map((key) => {
            const on = activeCat === key;
            const meta = key === 'all' ? { icon: 'cap' } : catMeta(key);
            return (
              <button
                key={key}
                onClick={() => setActiveCat(key)}
                style={{
                  flex: 'none', display: 'flex', alignItems: 'center', gap: 8,
                  border: `1.5px solid ${on ? 'var(--coal)' : 'var(--line)'}`,
                  background: on ? 'var(--coal)' : '#fff', color: on ? '#fff' : 'var(--ink)',
                  borderRadius: 12, padding: '11px 18px', fontSize: 14, fontWeight: 700,
                  fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                <span style={{ display: 'inline-flex' }}><Icon name={meta.icon} size={15} /></span>{key === 'all' ? t.catAllCourses : catLabel(t, key)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="anim-in" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 20px 80px' }}>
        {/* search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F4EE', border: '1.5px solid var(--line)', borderRadius: 12, padding: '10px 16px', margin: '4px auto 16px', maxWidth: 460 }}>
          <span style={{ color: 'var(--brand)' }}>⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.navSearch}
            style={{ border: 'none', outline: 'none', background: 'none', fontSize: 14, width: '100%', color: 'var(--ink)' }}
          />
        </div>

        {/* filter + sort controls */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
          <select value={level} onChange={(e) => setLevel(e.target.value)} style={selectStyle}>
            <option value="all">{t.mAllLevels}</option>
            {levels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={instructor} onChange={(e) => setInstructor(e.target.value)} style={selectStyle}>
            <option value="all">{t.mAllInstructors}</option>
            {instructors.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={price} onChange={(e) => setPrice(e.target.value)} style={selectStyle}>
            <option value="all">{t.mPriceAll}</option>
            <option value="free">{t.mPriceFree}</option>
            <option value="paid">{t.mPricePaid}</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={selectStyle}>
            <option value="popular">{t.mSort}: {t.mSortPopular}</option>
            <option value="latest">{t.mSort}: {t.mSortLatest}</option>
            <option value="priceLow">{t.mSortPriceLow}</option>
            <option value="priceHigh">{t.mSortPriceHigh}</option>
          </select>
          {filtersActive && <button onClick={resetFilters} className="chip" style={{ cursor: 'pointer', border: '1.5px solid var(--line)' }}>✕ {t.mReset}</button>}
        </div>

        {/* featured (only when browsing unfiltered) */}
        {!filtersActive && featured.length > 0 && (
          <div className="panel" style={{ padding: '26px 28px', marginBottom: 26, background: 'linear-gradient(180deg,#FFFDFB,#FFF6EE)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 800 }}>★ {t.mFeatured}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(250px,100%),1fr))', gap: 18 }}>
              {featured.map((c) => <Card key={c.id} c={c} />)}
            </div>
          </div>
        )}

        {/* results */}
        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, marginBottom: 14 }}>{filtered.length} {t.mResults}</div>
        {filtered.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--faint)' }}>{t.catNoResults}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(250px,100%),1fr))', gap: 18 }}>
            {filtered.map((c) => <Card key={c.id} c={c} />)}
          </div>
        )}
      </div>
    </>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<SiteNav />}>
      <Catalog />
    </Suspense>
  );
}
