// ============================================================
// Site settings key/value store (admin write, public read).
// ============================================================

import { q } from '@/lib/mysql';

const ALLOWED = ['siteTitle', 'supportPhone', 'supportEmail', 'seoDescription', 'maintenance', 'maintenanceMsg'];

export async function getSettings() {
  const rows = await q('SELECT skey, svalue FROM site_settings');
  const out = {};
  for (const r of rows) out[r.skey] = r.svalue;
  return out;
}

export async function saveSettings(patch) {
  for (const [k, v] of Object.entries(patch || {})) {
    if (!ALLOWED.includes(k)) continue;
    await q('INSERT INTO site_settings (skey, svalue) VALUES (?,?) ON DUPLICATE KEY UPDATE svalue = VALUES(svalue)',
      [k, v == null ? '' : String(v)]);
  }
  return getSettings();
}
