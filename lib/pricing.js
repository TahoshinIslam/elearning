// ============================================================
// Offer pricing — the single rule set used by the catalog, course page,
// checkout preview and order creation, so an advertised offer, the price
// shown and the amount charged always agree. Offers are automatic (no code):
// a course gets the best currently-active offer whose scope matches it.
// ============================================================
import { q } from '@/lib/mysql';
import { discounted, offerMatches } from '@/lib/offerMath';

export { discounted };

export async function getActiveOffers() {
  return q(
    `SELECT id, name, type, value, scope, scope_value, starts_at, ends_at FROM offers
     WHERE is_active = 1 AND starts_at <= NOW() AND (ends_at IS NULL OR ends_at > NOW())`
  );
}

// course: { id, price, category, classSlug } → { listPrice, price, offer | null }
export function priceWithOffers(course, offers) {
  const listPrice = Number(course.price) || 0;
  if (!listPrice || !offers?.length) return { listPrice, price: listPrice, offer: null };
  let best = null;
  for (const o of offers) {
    if (!offerMatches(o, course)) continue;
    const p = discounted(listPrice, o);
    if (p < listPrice && (!best || p < best.price)) best = { price: p, offer: o };
  }
  if (!best) return { listPrice, price: listPrice, offer: null };
  return {
    listPrice, price: best.price,
    offer: { id: best.offer.id, name: best.offer.name, type: best.offer.type, value: Number(best.offer.value), endsAt: best.offer.ends_at || null }
  };
}
