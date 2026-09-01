// ============================================================
// Referral system. Codes are generated lazily so both existing and new
// users get one. New signups may credit a referrer by code.
// ============================================================

import { randomBytes } from 'crypto';
import { q } from '@/lib/mysql';

function genCode() {
  return 'LEO' + randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
}

// Ensure the user has a referral code (generate + persist if missing).
export async function ensureReferralCode(userId) {
  const rows = await q('SELECT referral_code FROM users WHERE id = ? LIMIT 1', [userId]);
  if (rows[0]?.referral_code) return rows[0].referral_code;
  // retry a few times on the (unlikely) unique collision
  for (let i = 0; i < 5; i++) {
    const code = genCode();
    try {
      await q('UPDATE users SET referral_code = ? WHERE id = ?', [code, userId]);
      return code;
    } catch (e) { if (i === 4) throw e; }
  }
}

// The signed-in user's referral summary.
export async function getMyReferral(userId) {
  const code = await ensureReferralCode(userId);
  const referred = await q(
    `SELECT u.name, r.created_at AS createdAt
     FROM referrals r JOIN users u ON r.referred_user_id = u.id
     WHERE r.referrer_user_id = ? ORDER BY r.id DESC`, [userId]);
  return { code, count: referred.length, referred };
}

// Credit a referrer when a new user signs up with their code (best-effort).
export async function recordReferral(referrerCode, newUserId) {
  const code = String(referrerCode || '').trim().toUpperCase();
  if (!code) return;
  const rows = await q('SELECT id FROM users WHERE referral_code = ? LIMIT 1', [code]);
  const referrer = rows[0];
  if (!referrer || referrer.id === newUserId) return;
  await q('INSERT IGNORE INTO referrals (referrer_user_id, referred_user_id) VALUES (?,?)', [referrer.id, newUserId]);
}
