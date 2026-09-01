'use client';

import { useState } from 'react';
import { catLabel, catMeta, courseCategories } from '@/lib/catalog';
import Icon from '@/components/Icon';

// Two-panel course browser (Ostad-style): categories on the left, courses on the right.
// variant 'dropdown' → floating mega-menu in the navbar. variant 'section' → inline on a page.
export default function CourseMenu({ t, lang, courses, onNavigate, onClose, variant = 'section' }) {
  const published = (courses || []).filter((c) => c.published);
  const groups = courseCategories(published);
  const [active, setActive] = useState('all');

  const activeGroup = groups.find((g) => g.key === active) || groups[0];
  const go = (path) => { onNavigate?.(path); onClose?.(); };

  const catName = (key) => (key === 'all' ? t.catAllCourses : catLabel(t, key));

  const CategoryCard = ({ g }) => {
    const meta = g.key === 'all' ? { icon: 'cap', color: 'var(--brand)' } : catMeta(g.key);
    const on = active === g.key;
    return (
      <button
        onMouseEnter={() => setActive(g.key)}
        onClick={() => go(g.key === 'all' ? '/courses' : `/courses?cat=${g.key}`)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%',
          border: `1.5px solid ${on ? 'var(--coal)' : 'var(--line)'}`,
          background: on ? 'var(--coal)' : '#fff', color: on ? '#fff' : 'var(--ink)',
          borderRadius: 14, padding: '13px 16px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s'
        }}
      >
        <span style={{
          width: 38, height: 38, flex: 'none', borderRadius: 10, display: 'grid', placeItems: 'center',
          color: on ? '#fff' : meta.color,
          background: on ? 'rgba(255,255,255,.12)' : `${meta.color}14`
        }}><Icon name={meta.icon} size={19} /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5 }}>{catName(g.key)}</span>
          <span style={{ display: 'block', fontSize: 12, marginTop: 2, color: on ? 'rgba(255,255,255,.6)' : 'var(--faint)' }}>
            {g.courses.length} {t.courseUnit}
          </span>
        </span>
        <span style={{ fontSize: 15, color: on ? 'rgba(255,255,255,.7)' : 'var(--faint)' }}>›</span>
      </button>
    );
  };

  const CourseRow = ({ c }) => (
    <button
      onClick={() => go(`/course/${c.slug}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%',
        border: '1px solid var(--line-soft)', background: '#fff', borderRadius: 14, padding: 12,
        cursor: 'pointer', fontFamily: 'inherit'
      }}
    >
      <div className="placeholder-art" style={{ width: 92, height: 58, flex: 'none', borderRadius: 9, fontSize: 9 }}>{c.thumb || 'course'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.title}</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--muted)', marginTop: 5 }}>
          <span>📅 {t.startsLabel} · {c.duration || '—'}</span>
          <span>💺 {c.level || '—'}</span>
          <span style={{ fontWeight: 700, color: 'var(--brand-deep)' }}>{c.price === 0 ? t.cdFree : `৳${c.price}`}</span>
        </div>
      </div>
    </button>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px,1.1fr) minmax(min(300px,100%),1fr)', gap: 30 }}>
      {/* left: categories */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{t.courseCategory}</span>
          <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: variant === 'dropdown' ? '1fr 1fr' : 'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap: 12 }}>
          {groups.filter((g) => g.key !== 'all').map((g) => <CategoryCard key={g.key} g={g} />)}
        </div>
        <button
          onClick={() => go('/courses')}
          style={{ marginTop: 18, width: '100%', border: 'none', background: 'var(--coal)', color: '#fff', borderRadius: 14, padding: '15px', fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
        >
          {t.allCoursesBtn} →
        </button>
      </div>

      {/* right: courses of the active category */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{t.coursesLabel}</span>
          <button onClick={() => go(active === 'all' ? '/courses' : `/courses?cat=${active}`)} style={{ border: 'none', background: 'var(--line-softer)', borderRadius: 8, padding: '6px 12px', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)', fontFamily: 'inherit', cursor: 'pointer' }}>
            {t.seeAll}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: variant === 'dropdown' ? 300 : 'none', overflowY: variant === 'dropdown' ? 'auto' : 'visible' }}>
          {activeGroup.courses.slice(0, variant === 'dropdown' ? 4 : 6).map((c) => <CourseRow key={c.id} c={c} />)}
          {activeGroup.courses.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>{t.catNoResults}</div>
          )}
        </div>
      </div>
    </div>
  );
}
