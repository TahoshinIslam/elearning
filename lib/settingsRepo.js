// ============================================================
// Site settings key/value store (admin write, public read).
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

const ALLOWED = ['siteTitle', 'supportPhone', 'supportEmail', 'seoDescription', 'maintenance', 'maintenanceMsg', 'badgeTopRatedMin', 'badgeTopRatedReviews', 'badgeNewDays', 'footerCopyright', 'footerCopyrightBn', 'poweredByText', 'poweredByTextBn', 'poweredByUrl', 'poweredByLogo',
  // social & chat links (Admin → Settings → Social)
  'socialFacebook', 'socialMessenger', 'socialWhatsapp', 'socialYoutube', 'socialInstagram', 'socialLinkedin', 'socialTiktok', 'socialTelegram', 'chatButton'];

export async function getSettings() {
  const rows = await q('SELECT skey, svalue FROM site_settings');
  const out = {};
  for (const r of rows) out[r.skey] = r.svalue;
  return out;
}

// Numeric settings must stay in range; anything else is rejected, not stored.
const NUMERIC = { badgeTopRatedMin: [1, 5], badgeTopRatedReviews: [1, 100000], badgeNewDays: [1, 365] };

// The logo sits in a TEXT column as a data URI, and a link must really be a web
// address: both reach every visitor's page.
const LOGO_RE = /^data:image\/(png|webp);base64,[a-z0-9+/=]+$/i;
const MAX_LOGO_LENGTH = 60000;

export async function saveSettings(patch) {
  const url = patch?.poweredByUrl;
  if (url && !/^https?:\/\/\S+$/i.test(url)) throw new HttpError(400, { error: 'invalid_setting', key: 'poweredByUrl' });
  // social links must be real https URLs; WhatsApp is a phone number
  for (const k of ['socialFacebook', 'socialMessenger', 'socialYoutube', 'socialInstagram', 'socialLinkedin', 'socialTiktok', 'socialTelegram']) {
    const v = patch?.[k];
    if (v && !/^https:\/\/[^\s<>"']+$/i.test(String(v).trim())) throw new HttpError(400, { error: 'invalid_setting', key: k });
  }
  if (patch?.socialWhatsapp && !/^\+?[0-9][0-9 -]{6,18}$/.test(String(patch.socialWhatsapp).trim())) throw new HttpError(400, { error: 'invalid_setting', key: 'socialWhatsapp' });
  if (patch?.chatButton && !['off', 'whatsapp', 'messenger'].includes(patch.chatButton)) throw new HttpError(400, { error: 'invalid_setting', key: 'chatButton' });
  const logo = patch?.poweredByLogo;
  if (logo && (!LOGO_RE.test(logo) || logo.length > MAX_LOGO_LENGTH)) throw new HttpError(400, { error: 'invalid_setting', key: 'poweredByLogo' });
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
