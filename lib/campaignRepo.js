// ============================================================
// Promotional campaigns: homepage carousel slides and popups.
// Every campaign resolves to a real destination in this app (a course, a
// filtered catalog, a collection, its own campaign page, or an upcoming
// announcement). A campaign tied to an offer is only shown while that offer
// is live, so nothing advertises a discount checkout won't honour.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';
import { recordAudit } from '@/lib/auditLog';
import { publicThumbnailUrl, getPresignedUploadUrl, statObject, storageConfigured, ALLOWED_TYPES, MAX_UPLOAD_BYTES } from '@/lib/storage';
import { getOffer } from '@/lib/offerRepo';

const KINDS = ['popup', 'slide'];
const TARGETS = ['course', 'subject', 'class', 'collection', 'campaign', 'upcoming'];
const AUDIENCES = ['all', 'guests', 'students', 'new_visitors', 'returning', 'from_campaign', 'interested'];
const PAGES = ['home', 'catalog', 'course', 'all'];
const TRIGGERS = ['delay', 'scroll', 'exit', 'pageviews'];
const COLLECTIONS = ['featured', 'new', 'upcoming'];
const dt = (v) => (v ? String(v).replace('T', ' ').slice(0, 16) + ':00' : null);
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);
const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);

// → { href, label? } or null when the destination no longer exists.
export async function resolveTarget(c) {
  const v = c.target_value;
  switch (c.target_type) {
    case 'course': {
      const [row] = await q('SELECT slug, title FROM courses WHERE slug = ? AND published = 1', [v]);
      return row ? { href: `/course/${row.slug}`, label: row.title } : null;
    }
    case 'upcoming': {
      const [row] = await q('SELECT slug, title FROM courses WHERE slug = ? AND published = 0 AND is_upcoming = 1', [v]);
      return row ? { href: `/course/${row.slug}`, label: row.title } : null;
    }
    case 'subject': {
      const [row] = await q('SELECT slug, name FROM categories WHERE slug = ?', [v]);
      return row ? { href: `/courses?category=${encodeURIComponent(row.slug)}`, label: row.name } : null;
    }
    case 'class': {
      const [row] = await q('SELECT slug, name FROM class_levels WHERE slug = ?', [v]);
      return row ? { href: `/courses?class=${encodeURIComponent(row.slug)}`, label: row.name } : null;
    }
    case 'collection':
      return COLLECTIONS.includes(v) ? { href: `/courses?collection=${v}` } : null;
    case 'campaign':
      return { href: `/campaign/${c.slug}` };
    default:
      return null;
  }
}

function mapRow(r) {
  return {
    id: r.id, kind: r.kind, status: r.status, enabled: !!r.enabled, slug: r.slug, title: r.title, body: r.body || '',
    imageKey: r.image_key || null, imageUrl: publicThumbnailUrl(r.image_key), imageAlt: r.image_alt || '',
    ctaLabel: r.cta_label, targetType: r.target_type, targetValue: r.target_value || '', offerId: r.offer_id || null,
    startsAt: r.starts_at || null, endsAt: r.ends_at || null, audience: r.audience, pages: String(r.pages || '').split(',').filter(Boolean),
    frequencyHours: r.frequency_hours, position: r.position, updatedAt: r.updated_at,
    triggerType: r.trigger_type || 'delay', triggerValue: Number(r.trigger_value ?? 3), utmCampaign: r.utm_campaign || '', interestCategory: r.interest_category || ''
  };
}

// ---------- staff ----------
export async function listCampaigns() {
  const rows = await q('SELECT * FROM campaigns ORDER BY kind, position, id');
  const out = [];
  for (const r of rows) {
    const target = await resolveTarget(r);
    const offer = r.offer_id ? await getOffer(r.offer_id) : null;
    out.push({ ...mapRow(r), targetHref: target?.href || null, targetLabel: target?.label || null, offer, live: isLive(r, offer) });
  }
  return out;
}

function isLive(r, offer) {
  const now = Date.now();
  const t = (x) => (x ? new Date(String(x).replace(' ', 'T')).getTime() : null);
  if (r.status !== 'published' || !r.enabled) return false;
  if (r.starts_at && t(r.starts_at) > now) return false;
  if (r.ends_at && t(r.ends_at) <= now) return false;
  if (r.offer_id && (!offer || offer.state !== 'live')) return false;
  return true;
}

async function validate(body) {
  const v = {
    kind: KINDS.includes(body.kind) ? body.kind : 'slide',
    title: clean(body.title, 191),
    body: clean(body.body, 600) || null,
    imageAlt: clean(body.imageAlt, 255) || null,
    ctaLabel: clean(body.ctaLabel, 80),
    targetType: TARGETS.includes(body.targetType) ? body.targetType : null,
    targetValue: clean(body.targetValue, 191) || null,
    offerId: body.offerId ? Number(body.offerId) : null,
    startsAt: dt(body.startsAt),
    endsAt: dt(body.endsAt),
    audience: AUDIENCES.includes(body.audience) ? body.audience : 'all',
    pages: (Array.isArray(body.pages) ? body.pages : String(body.pages || 'home').split(',')).filter((p) => PAGES.includes(p)),
    frequencyHours: Math.max(0, Math.min(24 * 30, Math.round(Number(body.frequencyHours ?? 24)) || 0)),
    triggerType: TRIGGERS.includes(body.triggerType) ? body.triggerType : 'delay',
    triggerValue: Math.max(0, Math.min(600, Math.round(Number(body.triggerValue ?? 3)) || 0)),
    utmCampaign: clean(body.utmCampaign, 150) || null,
    interestCategory: clean(body.interestCategory, 100) || null
  };
  if (v.triggerType === 'scroll') v.triggerValue = Math.min(100, Math.max(10, v.triggerValue || 50));
  if (v.triggerType === 'pageviews') v.triggerValue = Math.max(1, v.triggerValue || 2);
  if (v.audience === 'from_campaign' && !v.utmCampaign) throw new HttpError(400, { error: 'utm_campaign_required' });
  if (v.audience === 'interested' && !v.interestCategory) throw new HttpError(400, { error: 'interest_required' });
  if (!v.title) throw new HttpError(400, { error: 'title_required' });
  if (!v.ctaLabel) throw new HttpError(400, { error: 'cta_required' });
  if (!v.targetType) throw new HttpError(400, { error: 'target_required' });
  if (v.targetType !== 'campaign' && !v.targetValue) throw new HttpError(400, { error: 'target_required' });
  if (v.endsAt && v.startsAt && v.endsAt <= v.startsAt) throw new HttpError(400, { error: 'end_before_start' });
  if (!v.pages.length) v.pages = ['home'];
  if (v.offerId && !(await getOffer(v.offerId))) throw new HttpError(400, { error: 'invalid_offer' });
  if (v.targetType !== 'campaign' && !(await resolveTarget({ target_type: v.targetType, target_value: v.targetValue }))) throw new HttpError(400, { error: 'target_not_found' });
  if (v.targetType === 'campaign' && !v.offerId && !v.body) throw new HttpError(400, { error: 'campaign_page_needs_content' });
  return v;
}

export async function saveCampaign(session, body) {
  const v = await validate(body);
  if (body.id) {
    await q(`UPDATE campaigns SET kind=?, title=?, body=?, image_alt=?, cta_label=?, target_type=?, target_value=?, offer_id=?,
               starts_at=?, ends_at=?, audience=?, pages=?, frequency_hours=?, trigger_type=?, trigger_value=?, utm_campaign=?, interest_category=? WHERE id=?`,
      [v.kind, v.title, v.body, v.imageAlt, v.ctaLabel, v.targetType, v.targetValue, v.offerId, v.startsAt, v.endsAt, v.audience, v.pages.join(','), v.frequencyHours, v.triggerType, v.triggerValue, v.utmCampaign, v.interestCategory, Number(body.id)]);
  } else {
    let slug = slugify(body.slug || v.title) || `campaign-${Date.now().toString(36)}`;
    if ((await q('SELECT id FROM campaigns WHERE slug = ?', [slug]))[0]) slug = `${slug}-${Date.now().toString(36)}`;
    const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM campaigns WHERE kind = ?', [v.kind]);
    await q(`INSERT INTO campaigns (kind, status, enabled, slug, title, body, image_alt, cta_label, target_type, target_value, offer_id, starts_at, ends_at, audience, pages, frequency_hours, trigger_type, trigger_value, utm_campaign, interest_category, position)
             VALUES (?, 'draft', 1, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [v.kind, slug, v.title, v.body, v.imageAlt, v.ctaLabel, v.targetType, v.targetValue, v.offerId, v.startsAt, v.endsAt, v.audience, v.pages.join(','), v.frequencyHours, v.triggerType, v.triggerValue, v.utmCampaign, v.interestCategory, p]);
  }
  await recordAudit({ session, action: body.id ? 'campaign_updated' : 'campaign_created', targetType: 'campaign', targetId: body.id || null, detail: v.title });
  return listCampaigns();
}

export async function campaignAction(session, { id, action, dir }) {
  const [row] = await q('SELECT * FROM campaigns WHERE id = ?', [Number(id)]);
  if (!row) throw new HttpError(404, { error: 'not_found' });
  if (action === 'publish') {
    if (!row.image_key && row.kind === 'popup' && !row.body) throw new HttpError(400, { error: 'needs_image_or_body' });
    await q("UPDATE campaigns SET status = 'published' WHERE id = ?", [row.id]);
  } else if (action === 'unpublish') await q("UPDATE campaigns SET status = 'draft' WHERE id = ?", [row.id]);
  else if (action === 'enable') await q('UPDATE campaigns SET enabled = 1 WHERE id = ?', [row.id]);
  else if (action === 'disable') await q('UPDATE campaigns SET enabled = 0 WHERE id = ?', [row.id]);
  else if (action === 'delete') await q('DELETE FROM campaigns WHERE id = ?', [row.id]);
  else if (action === 'move') {
    const ids = (await q('SELECT id FROM campaigns WHERE kind = ? ORDER BY position, id', [row.kind])).map((r) => r.id);
    const i = ids.indexOf(row.id), j = dir === 'up' ? i - 1 : i + 1;
    if (j >= 0 && j < ids.length) { [ids[i], ids[j]] = [ids[j], ids[i]]; let p = 1; for (const x of ids) await q('UPDATE campaigns SET position = ? WHERE id = ?', [p++, x]); }
  } else throw new HttpError(400, { error: 'unknown_action' });
  await recordAudit({ session, action: `campaign_${action}`, targetType: 'campaign', targetId: row.id });
  return listCampaigns();
}

export async function requestCampaignImageUpload(id, { fileName, contentType, size }) {
  const [row] = await q('SELECT id FROM campaigns WHERE id = ?', [Number(id)]);
  if (!row) throw new HttpError(404, { error: 'not_found' });
  if (!storageConfigured()) throw new HttpError(503, { error: 'storage_not_configured' });
  const type = String(contentType || '').toLowerCase();
  if (!ALLOWED_TYPES.image.includes(type)) throw new HttpError(415, { error: 'unsupported_image_type' });
  if (Number(size) > MAX_UPLOAD_BYTES.image) throw new HttpError(413, { error: 'file_too_large' });
  const ext = (String(fileName || '').split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
  // Public prefix (thumbnails/) — campaign art is public, like course covers.
  const key = `thumbnails/campaigns/${row.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { url, method, expiresIn } = await getPresignedUploadUrl({ key, contentType: type, maxBytes: MAX_UPLOAD_BYTES.image });
  return { uploadUrl: url, method, expiresIn, key };
}

export async function confirmCampaignImage(id, key) {
  if (typeof key !== 'string' || !key.startsWith(`thumbnails/campaigns/${Number(id)}/`)) throw new HttpError(409, { error: 'upload_mismatch' });
  if (!(await statObject({ key })).exists) throw new HttpError(409, { error: 'upload_not_found' });
  await q('UPDATE campaigns SET image_key = ? WHERE id = ?', [key, Number(id)]);
  return listCampaigns();
}

// Who should see a campaign. `visitor` is the tracked profile (lib/trackingRepo):
//   new_visitors – first visit;  returning – came back at least once;
//   from_campaign – arrived from the ad campaign named in utm_campaign;
//   interested – has viewed courses in interest_category (score ≥ 3).
export function audienceMatches(c, session, visitor) {
  switch (c.audience) {
    case 'guests': return !session;
    case 'students': return session?.role === 'student';
    case 'new_visitors': return !visitor || Number(visitor.visits) <= 1;
    case 'returning': return !!visitor && Number(visitor.visits) > 1;
    case 'from_campaign': {
      const want = String(c.utm_campaign || '').toLowerCase();
      return !!want && !!visitor && [visitor.lt_campaign, visitor.ft_campaign].some((x) => String(x || '').toLowerCase() === want);
    }
    case 'interested': return !!visitor && Number(visitor.interests?.[c.interest_category] || 0) >= 3;
    default: return true;
  }
}

// ---------- public ----------
// Live campaigns of one kind for a page and viewer. Popups also carry their
// display frequency; the client remembers dismissals per campaign.
export async function getActiveCampaigns({ kind, page, session, visitor = null }) {
  const rows = await q(
    `SELECT * FROM campaigns
     WHERE kind = ? AND status = 'published' AND enabled = 1
       AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at > NOW())
     ORDER BY position, id LIMIT 24`,
    [kind]
  );
  const out = [];
  for (const r of rows) {
    const pages = String(r.pages).split(',');
    if (page && page !== 'any' && !pages.includes(page) && !pages.includes('all')) continue;
    if (!audienceMatches(r, session, visitor)) continue;
    const offer = r.offer_id ? await getOffer(r.offer_id) : null;
    if (r.offer_id && (!offer || offer.state !== 'live')) continue; // never advertise an offer checkout won't apply
    const target = await resolveTarget(r);
    if (!target) continue;
    out.push({
      id: r.id, slug: r.slug, kind: r.kind, title: r.title, body: r.body || '', imageUrl: publicThumbnailUrl(r.image_key), imageAlt: r.image_alt || '',
      ctaLabel: r.cta_label, href: target.href, targetType: r.target_type, frequencyHours: r.frequency_hours, updatedAt: r.updated_at,
      audience: r.audience, triggerType: r.trigger_type || 'delay', triggerValue: Number(r.trigger_value ?? 3),
      offer: offer ? { type: offer.type, value: offer.value, endsAt: offer.endsAt, name: offer.name, scope: offer.scope, scopeValue: offer.scopeValue } : null
    });
  }
  return out;
}

export async function getPublicCampaign(slug) {
  const [r] = await q(
    `SELECT * FROM campaigns WHERE slug = ? AND status = 'published' AND enabled = 1
       AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at > NOW())`, [String(slug || '').slice(0, 120)]);
  if (!r) return null;
  const offer = r.offer_id ? await getOffer(r.offer_id) : null;
  return { ...mapRow(r), offer: offer && offer.state === 'live' ? offer : null, offerExpired: !!(r.offer_id && (!offer || offer.state !== 'live')) };
}
