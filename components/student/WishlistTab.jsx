'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { modeLabel, modeChip } from '@/lib/catalog';

export default function WishlistTab() {
  const { t, wishlist, toggleWishlist, courses } = useApp();
  const router = useRouter();
  const saved = courses.filter((c) => wishlist.includes(c.id));

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.wishlist}</div>

      {saved.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>♡</div>
          {t.wishlistEmpty}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(260px,100%),1fr))', gap: 14 }}>
          {saved.map((c) => (
            <div key={c.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <button onClick={() => router.push(`/course/${c.slug}`)} className="placeholder-art" style={{ height: 110, fontSize: 11, border: 'none', cursor: 'pointer' }}>{c.thumb}</button>
              <div style={{ padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {c.mode && <span className={`tag ${modeChip(c.mode)}`} style={{ alignSelf: 'flex-start' }}>{modeLabel(t, c.mode)}</span>}
                <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.35 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{c.instructor}</div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span className="display" style={{ fontSize: 18 }}>{c.price === 0 ? t.cdFree : `৳${c.price}`}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => toggleWishlist(c.id)} title={t.wishlistRemove} style={{ border: '1.5px solid var(--line)', background: '#fff', borderRadius: 9, padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}>🗑</button>
                    <button className="btn-primary" style={{ borderRadius: 9, fontSize: 13 }} onClick={() => router.push(`/course/${c.slug}`)}>{t.cdEnrollNow}</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
