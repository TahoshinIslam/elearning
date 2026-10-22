// ============================================================
// Site settings key/value store (admin write, public read).
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

const ALLOWED = ['siteTitle', 'supportPhone', 'supportEmail', 'seoDescription', 'maintenance', 'maintenanceMsg', 'badgeTopRatedMin', 'badgeTopRatedReviews', 'badgeNewDays'];

export async function getSettings() {
  const rows = await q('SELECT skey, svalue FROM site_settings');
  const out = {};
  for (const r of rows) out[r.skey] = r.svalue;
  return out;
}

// Numeric settings must stay in range; anything else is rejected, not stored.
const NUMERIC = { badgeTopRatedMin: [1, 5], badgeTopRatedReviews: [1, 100000], badgeNewDays: [1, 365] };

export async function saveSettings(patch) {
  for (const [k, v] of Object.entries(patch || {})) {
    if (!NUMERIC[k]) continue;
    const n = Number(v);
    if (!Number.isFinite(n) || n < NUMERIC[k][0] || n > NUMERIC[k][1]) throw new HttpError(400, { error: 'invalid_setting', key: k });
  }
  for (const [k, v] of Object.entries(patch || {})) {
    if (!ALLOWED.includes(k)) continue;
    await q('INSERT INTO site_settings (skey, svalue) VALUES (?,?) ON DUPLICATE KEY UPDATE svalue = VALUES(svalue)',
      [k, v == null ? '' : String(v)]);
  }
  return getSettings();
}
