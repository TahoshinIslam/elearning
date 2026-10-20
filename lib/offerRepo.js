// Automatic discount offers (admin). Pricing math lives in lib/pricing.js.
import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';
import { recordAudit } from '@/lib/auditLog';

const SCOPES = ['course', 'subject', 'class', 'all'];
const dt = (v) => (v ? String(v).replace('T', ' ').slice(0, 16) + ':00' : null);

function mapOffer(r) {
  return {
    id: r.id, name: r.name, type: r.type, value: Number(r.value), scope: r.scope, scopeValue: r.scope_value,
    startsAt: r.starts_at, endsAt: r.ends_at, isActive: !!r.is_active,
    state: !r.is_active ? 'disabled' : r.live ? 'live' : r.ended ? 'ended' : 'scheduled'
  };
}

export async function listOffers() {
  const rows = await q(`SELECT *, (starts_at <= NOW() AND (ends_at IS NULL OR ends_at > NOW())) AS live, (ends_at IS NOT NULL AND ends_at <= NOW()) AS ended FROM offers ORDER BY id DESC`);
  return rows.map(mapOffer);
}

export async function getOffer(id) {
  const [r] = await q(`SELECT *, (starts_at <= NOW() AND (ends_at IS NULL OR ends_at > NOW())) AS live, (ends_at IS NOT NULL AND ends_at <= NOW()) AS ended FROM offers WHERE id = ?`, [Number(id)]);
  return r ? mapOffer(r) : null;
}

function validate(body) {
  const name = String(body.name || '').trim().slice(0, 191);
  const type = body.type === 'fixed' ? 'fixed' : 'percent';
  const value = Number(body.value);
  const scope = SCOPES.includes(body.scope) ? body.scope : 'course';
  const scopeValue = scope === 'all' ? null : String(body.scopeValue || '').trim().slice(0, 191);
  const startsAt = dt(body.startsAt);
  const endsAt = dt(body.endsAt);
  if (!name) throw new HttpError(400, { error: 'name_required' });
  if (!Number.isInteger(value) || value <= 0 || (type === 'percent' && value > 90)) throw new HttpError(400, { error: 'invalid_value' });
  if (scope !== 'all' && !scopeValue) throw new HttpError(400, { error: 'scope_required' });
  if (!startsAt) throw new HttpError(400, { error: 'start_required' });
  if (endsAt && endsAt <= startsAt) throw new HttpError(400, { error: 'end_before_start' });
  return { name, type, value, scope, scopeValue, startsAt, endsAt };
}

export async function saveOffer(session, body) {
  const v = validate(body);
  if (body.id) {
    await q('UPDATE offers SET name=?, type=?, value=?, scope=?, scope_value=?, starts_at=?, ends_at=?, is_active=? WHERE id=?',
      [v.name, v.type, v.value, v.scope, v.scopeValue, v.startsAt, v.endsAt, body.isActive === false ? 0 : 1, Number(body.id)]);
  } else {
    await q('INSERT INTO offers (name, type, value, scope, scope_value, starts_at, ends_at, is_active) VALUES (?,?,?,?,?,?,?,1)',
      [v.name, v.type, v.value, v.scope, v.scopeValue, v.startsAt, v.endsAt]);
  }
  await recordAudit({ session, action: body.id ? 'offer_updated' : 'offer_created', targetType: 'offer', targetId: body.id || null, detail: `${v.type}:${v.value} ${v.scope}:${v.scopeValue || '*'}` });
  return listOffers();
}

export async function setOfferActive(session, { id, isActive }) {
  await q('UPDATE offers SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, Number(id)]);
  return listOffers();
}
