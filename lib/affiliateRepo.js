// ============================================================
// Affiliate program. Partners earn a % commission on purchases made with
// their code. Commission is recorded server-side at payment time.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

const map = (r) => ({ id: r.id, name: r.name, code: r.code, commissionPct: r.commission_pct, earnings: r.earnings, isActive: !!r.is_active, sales: r.sales });

export async function getAffiliates() {
  return q(
    `SELECT a.*, (SELECT COUNT(*) FROM affiliate_sales s WHERE s.affiliate_id = a.id) AS sales
     FROM affiliates a ORDER BY a.id DESC`
  ).then((rows) => rows.map(map));
}

export async function createAffiliate(body) {
  const name = String(body.name || '').trim();
  const code = String(body.code || '').trim().toUpperCase();
  const pct = Number(body.commissionPct);
  if (!name) throw new HttpError(400, { error: 'name_required' });
  if (!/^[A-Z0-9]{3,32}$/.test(code)) throw new HttpError(400, { error: 'invalid_code' });
  if (!pct || pct <= 0 || pct > 100) throw new HttpError(400, { error: 'invalid_pct' });
  if (await q('SELECT id FROM affiliates WHERE code = ? LIMIT 1', [code]).then((r) => r[0])) throw new HttpError(409, { error: 'code_taken' });
  await q('INSERT INTO affiliates (name, code, commission_pct) VALUES (?,?,?)', [name, code, pct]);
  return getAffiliates();
}

export async function setAffiliateActive(body) {
  await q('UPDATE affiliates SET is_active = ? WHERE id = ?', [body.active ? 1 : 0, body.id]);
  return getAffiliates();
}

export async function deleteAffiliate(body) {
  await q('DELETE FROM affiliates WHERE id = ?', [body.id]);
  return getAffiliates();
}

// Record a commissioned sale for an affiliate code (best-effort, at payment time).
export async function recordAffiliateSale(code, amount, courseId) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return;
  const rows = await q('SELECT id, commission_pct FROM affiliates WHERE code = ? AND is_active = 1 LIMIT 1', [normalized]);
  const aff = rows[0];
  if (!aff) return;
  const amt = Number(amount) || 0;
  const commission = Math.round(amt * aff.commission_pct / 100);
  await q('INSERT INTO affiliate_sales (affiliate_id, amount, commission, course_id) VALUES (?,?,?,?)',
    [aff.id, amt, commission, courseId ?? null]);
  await q('UPDATE affiliates SET earnings = earnings + ? WHERE id = ?', [commission, aff.id]);
}
