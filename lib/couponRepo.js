// ============================================================
// Coupon data-access + validation. Validation is pure (no side effects);
// redemption (used_count++) is called separately at payment time.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

const map = (r) => ({
  id: r.id, code: r.code, type: r.type, value: r.value,
  expiresAt: r.expires_at, usageLimit: r.usage_limit, usedCount: r.used_count,
  tenantId: r.tenant_id, isActive: !!r.is_active
});

// Admin list — owner sees their tenant's + global; superadmin sees all.
export async function getCoupons(session) {
  const rows = session.role === 'superadmin'
    ? await q('SELECT * FROM coupons ORDER BY id DESC')
    : await q('SELECT * FROM coupons WHERE tenant_id = ? OR tenant_id IS NULL ORDER BY id DESC', [session.tenantId ?? -1]);
  return rows.map(map);
}

export async function createCoupon(session, body) {
  const code = String(body.code || '').trim().toUpperCase();
  const type = body.type === 'fixed' ? 'fixed' : 'percent';
  const value = Number(body.value);
  if (!/^[A-Z0-9]{3,64}$/.test(code)) throw new HttpError(400, { error: 'invalid_code' });
  if (!value || value <= 0 || (type === 'percent' && value > 100)) throw new HttpError(400, { error: 'invalid_value' });
  if (await q('SELECT id FROM coupons WHERE code = ? LIMIT 1', [code]).then((r) => r[0])) {
    throw new HttpError(409, { error: 'code_taken' });
  }
  // owner-created coupons are scoped to their tenant; superadmin may make them global
  const tenantId = session.role === 'superadmin' ? (body.tenantId ?? null) : (session.tenantId ?? null);
  const res = await q(
    'INSERT INTO coupons (code, type, value, expires_at, usage_limit, tenant_id) VALUES (?,?,?,?,?,?)',
    [code, type, value, body.expiresAt || null, body.usageLimit ? Number(body.usageLimit) : null, tenantId]
  );
  return (await q('SELECT * FROM coupons WHERE id = ?', [res.insertId])).map(map)[0];
}

export async function setCouponActive(session, body) {
  await q('UPDATE coupons SET is_active = ? WHERE id = ?', [body.active ? 1 : 0, body.id]);
  return getCoupons(session);
}

export async function deleteCoupon(session, body) {
  await q('DELETE FROM coupons WHERE id = ?', [body.id]);
  return getCoupons(session);
}

// Pure validation → discount for a given amount. Throws HttpError on failure.
export async function validateCoupon(code, amount, session) {
  const normalized = String(code || '').trim().toUpperCase();
  const rows = await q('SELECT * FROM coupons WHERE code = ? LIMIT 1', [normalized]);
  const c = rows[0];
  if (!c || !c.is_active) throw new HttpError(404, { error: 'coupon_invalid' });
  if (c.expires_at && String(c.expires_at) < new Date().toISOString().slice(0, 10)) throw new HttpError(400, { error: 'coupon_expired' });
  if (c.usage_limit != null && c.used_count >= c.usage_limit) throw new HttpError(400, { error: 'coupon_exhausted' });
  if (c.tenant_id != null && session?.tenantId != null && c.tenant_id !== session.tenantId) {
    throw new HttpError(400, { error: 'coupon_wrong_center' });
  }
  const amt = Number(amount) || 0;
  const rawDiscount = c.type === 'percent' ? Math.round(amt * c.value / 100) : c.value;
  const discount = Math.min(rawDiscount, amt); // never below zero
  return { code: c.code, type: c.type, value: c.value, discount, finalAmount: amt - discount };
}

// Redeem (increment usage). Called after a successful payment.
export async function redeemCoupon(code) {
  const normalized = String(code || '').trim().toUpperCase();
  await q('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?', [normalized]);
}
