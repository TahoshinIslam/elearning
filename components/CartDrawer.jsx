'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import Drawer from '@/components/ui/Drawer';
import CourseCover from '@/components/ui/CourseCover';
import { copy, taka } from '@/lib/copy';

// The cart holds course ids for convenience only (localStorage). Prices
// shown here are indicative; checkout re-prices everything on the server
// and drops anything already owned or no longer available.
export default function CartDrawer() {
  const { lang, cart, cartOpen, setCartOpen, removeFromCart, cartTotal } = useApp();
  const c = copy(lang);
  const router = useRouter();
  const goCheckout = () => {
    setCartOpen(false);
    router.push(`/checkout?courses=${cart.map((i) => i.id).join(',')}`);
  };
  return (
    <Drawer
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      title={`${c.cart}${cart.length ? ` (${cart.length})` : ''}`}
      closeLabel={c.close}
      footer={cart.length ? (
        <div className="stack" style={{ '--gap': '12px' }}>
          <div className="summary-line"><span className="muted">{c.subtotal}</span><span className="strong tabular">{cartTotal ? taka(lang, cartTotal) : c.free}</span></div>
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={goCheckout}>{c.checkoutTitle}<Icon name="arrowRight" size={18} /></button>
        </div>
      ) : null}
    >
      {!cart.length ? (
        <div className="state">
          <div className="state-icon"><Icon name="cart" size={24} /></div>
          <p>{lang === 'en' ? 'Your cart is empty.' : 'কার্ট খালি।'}</p>
          <Link href="/courses" className="btn btn-secondary" onClick={() => setCartOpen(false)}>{c.browseCourses}</Link>
        </div>
      ) : (
        <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, '--gap': '12px' }}>
          {cart.map((item) => (
            <li key={item.id} className="row" style={{ alignItems: 'flex-start' }}>
              <div style={{ width: 88, flex: 'none' }}><CourseCover id={item.id} title={item.title} size="sm" /></div>
              <div className="grow">
                <Link href={`/course/${item.slug}`} className="strong clamp-2" style={{ fontSize: 14.5, lineHeight: 1.35 }} onClick={() => setCartOpen(false)}>{item.title}</Link>
                <div className="small muted tabular" style={{ marginTop: 2 }}>{item.price ? taka(lang, item.price) : c.free}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => removeFromCart(item.id)} aria-label={`${c.removeItem}: ${item.title}`}><Icon name="trash" size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
