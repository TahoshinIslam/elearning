// Course badge rules — configurable through site settings, computed from
// real data only. Defaults: Top Rated ≥ 4.5 from ≥ 10 published
// verified-purchase reviews; New = first published within 30 days and on
// sale; Featured = admin-selected; Upcoming = announced, not yet released.
import { getSettings } from '@/lib/settingsRepo';

export const BADGE_DEFAULTS = { badgeTopRatedMin: 4.5, badgeTopRatedReviews: 10, badgeNewDays: 30 };

export async function getBadgeRules() {
  const s = await getSettings().catch(() => ({}));
  const num = (k) => (s[k] !== undefined && s[k] !== '' && Number.isFinite(Number(s[k])) ? Number(s[k]) : BADGE_DEFAULTS[k]);
  return { topRatedMin: num('badgeTopRatedMin'), topRatedReviews: num('badgeTopRatedReviews'), newDays: num('badgeNewDays') };
}

// row fields: published, is_upcoming, featured, first_published_at, verified_avg, verified_review_count
export function badgesFor(row, rules, now = Date.now()) {
  const out = [];
  if (row.is_upcoming && !row.published) return ['upcoming'];
  if (row.featured) out.push('featured');
  if (row.verified_review_count >= rules.topRatedReviews && Number(row.verified_avg) >= rules.topRatedMin) out.push('top_rated');
  const first = row.first_published_at ? new Date(String(row.first_published_at).replace(' ', 'T')).getTime() : null;
  if (row.published && first && now - first <= rules.newDays * 86400000) out.push('new');
  return out;
}
