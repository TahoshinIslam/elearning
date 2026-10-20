// Pure offer arithmetic, shared by server pricing (lib/pricing.js) and admin
// previews so both compute the same number.
export function discounted(listPrice, offer) {
  const v = Number(offer.value) || 0;
  if (offer.type === 'percent') return Math.max(0, Math.round(listPrice * (100 - Math.min(100, v)) / 100));
  return Math.max(0, listPrice - v);
}

// offer: { scope, scope_value | scopeValue }; course: { id, category, classSlug }
export function offerMatches(offer, course) {
  const sv = offer.scope_value ?? offer.scopeValue;
  if (offer.scope === 'all') return true;
  if (offer.scope === 'course') return String(sv) === String(course.id);
  if (offer.scope === 'subject') return !!course.category && sv === course.category;
  if (offer.scope === 'class') return !!course.classSlug && sv === course.classSlug;
  return false;
}
