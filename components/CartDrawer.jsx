'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';

// Right-side slide-in shopping cart (e-commerce style). Driven by cart state in
// AppContext; opens whenever a course is added or the navbar cart button is clicked.
export default function CartDrawer() {
  const { t, cart, cartOpen, setCartOpen, removeFromCart, clearCart, cartTotal, auth, batches, api, showToast } = useApp();
  const router = useRouter();

  const fmt = (n) => (n === 0 ? t.cdFree : `৳${Number(n).toLocaleString('en-IN')}`);

  const checkout = async () => {
    if (!cart.length) return;
    // guests must sign in first; return to the courses page afterwards
    if (auth?.role !== 'student') {
      setCartOpen(false);
      showToast(t.cartLoginFirst, 'info');
      router.push('/login?returnTo=/courses');
      return;
    }
    // best-effort enrol the student into each course's batch + record the purchase
    let ok = 0;
    for (const item of cart) {
      const batch = batches.find((b) => b.courseId === item.id);
      if (!batch) continue;
      try {
        await api.enroll(auth.studentId, batch.id);
        if (item.price > 0) {
          await api.recordPayment({ studentId: auth.studentId, studentName: auth.name, courseId: item.id, batchId: batch.id, amount: item.price, method: 'bkash', type: 'enrollment' });
        }
        ok++;
      } catch { /* already enrolled / ignore */ }
    }
    clearCart();
    setCartOpen(false);
    showToast(t.cartOrderPlaced, 'success');
    router.push('/student');
  };

  return (
    <>
      {cartOpen && <div onClick={() => setCartOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,12,.45)', zIndex: 95 }} />}
      <aside
        aria-hidden={!cartOpen}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 96,
          width: 380, maxWidth: '90vw', background: '#fff',
          boxShadow: cartOpen ? 'var(--shadow-pop)' : 'none',
          transform: cartOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .26s ease',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: '1.5px solid var(--line)' }}>
          <Icon name="cart" size={19} />
          <div style={{ fontWeight: 800, fontSize: 16, flex: 1 }}>{t.cartTitle} {cart.length > 0 && <span style={{ color: 'var(--faint)', fontWeight: 600 }}>({cart.length})</span>}</div>
          <button onClick={() => setCartOpen(false)} aria-label={t.cartClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'grid', placeItems: 'center', padding: 4 }}>
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: cart.length ? '10px 12px' : 0 }}>
          {cart.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ color: 'var(--line)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Icon name="cart" size={44} stroke={1.5} /></div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{t.cartEmpty}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{t.cartEmptyHint}</div>
              <button onClick={() => { setCartOpen(false); router.push('/courses'); }} className="btn-primary" style={{ marginTop: 18, borderRadius: 10 }}>{t.cartBrowse}</button>
            </div>
          ) : cart.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', gap: 12, padding: 12, marginBottom: 10, alignItems: 'center' }}>
              <div className="placeholder-art" style={{ width: 64, height: 48, flex: 'none', borderRadius: 8, fontSize: 9 }}>{item.thumb || 'course'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.35 }}>{item.title}</div>
                {item.instructor && <div style={{ fontSize: 12, color: 'var(--faint)' }}>{item.instructor}</div>}
                <div className="display" style={{ fontSize: 15, marginTop: 3 }}>{fmt(item.price)}</div>
              </div>
              <button onClick={() => removeFromCart(item.id)} aria-label={t.cartRemove} style={{ border: '1.5px solid var(--line)', background: '#fff', borderRadius: 8, cursor: 'pointer', color: '#B91C1C', padding: 7, display: 'grid', placeItems: 'center' }}>
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </div>

        {/* footer / checkout */}
        {cart.length > 0 && (
          <div style={{ borderTop: '1.5px solid var(--line)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--muted)' }}>{t.cartSubtotal}</span>
              <span className="display" style={{ fontSize: 22 }}>{fmt(cartTotal)}</span>
            </div>
            <button onClick={checkout} className="btn btn-primary-lg" style={{ borderRadius: 12 }}>{t.cartCheckout} →</button>
            <button onClick={clearCart} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--muted)', fontSize: 12.5, fontWeight: 600 }}>{t.cartClear}</button>
          </div>
        )}
      </aside>
    </>
  );
}
