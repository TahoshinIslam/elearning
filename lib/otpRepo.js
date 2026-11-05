// ============================================================
// Email one-time codes: passwordless login and password recovery.
// - 6 digits from crypto.randomInt; only SHA-256(code + email + secret) is stored
// - expires after 3 minutes; 3 wrong tries lock that code
// - a new request replaces the previous code; resend allowed every 30 s
// - unknown emails get the same response as known ones (no enumeration)
// Ready to be swapped for Clerk: the routes only call request/verify here.
// ============================================================

import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';
import { sendMail, demoMailEnabled } from '@/lib/mailer';

export const OTP_TTL_SEC = 180;
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_RESEND_SEC = 30;
const PURPOSES = ['login', 'reset'];

const secret = () => process.env.AUTH_SECRET || 'leo-dev-secret-change-in-production';
const hashCode = (email, code) => createHash('sha256').update(`${email}:${code}:${secret()}`).digest('hex');
const normEmail = (e) => String(e || '').trim().toLowerCase();

export function maskEmail(email) {
  const [user, domain] = normEmail(email).split('@');
  if (!domain) return '';
  return `${user.slice(0, 1)}${'•'.repeat(Math.max(2, Math.min(5, user.length - 1)))}@${domain}`;
}

export async function requestOtp(emailRaw, purpose) {
  const email = normEmail(emailRaw);
  if (!PURPOSES.includes(purpose)) throw new HttpError(400, { error: 'invalid_purpose' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, { error: 'invalid_email' });

  const [last] = await q('SELECT TIMESTAMPDIFF(SECOND, created_at, NOW()) AS age FROM otp_codes WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1', [email, purpose]);
  if (last && Number(last.age) < OTP_RESEND_SEC) {
    throw new HttpError(429, { error: 'otp_resend_wait', retryAfter: OTP_RESEND_SEC - Number(last.age) });
  }

  const [user] = await q("SELECT id, name, status FROM users WHERE email = ? LIMIT 1", [email]);
  const base = { ok: true, masked: maskEmail(email), expiresIn: OTP_TTL_SEC, resendIn: OTP_RESEND_SEC, attemptsLeft: OTP_MAX_ATTEMPTS };
  // Same answer for unknown / disabled accounts, but nothing is sent.
  if (!user || user.status === 'disabled') {
    await q('INSERT INTO otp_codes (email, purpose, code_hash, attempts, expires_at, used_at) VALUES (?,?,?,?, NOW(), NOW())', [email, purpose, '-'.repeat(64), OTP_MAX_ATTEMPTS]);
    return base;
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await q('UPDATE otp_codes SET used_at = NOW() WHERE email = ? AND purpose = ? AND used_at IS NULL', [email, purpose]);
  await q('INSERT INTO otp_codes (email, purpose, code_hash, expires_at) VALUES (?,?,?, NOW() + INTERVAL ? SECOND)', [email, purpose, hashCode(email, code), OTP_TTL_SEC]);
  const what = purpose === 'login' ? 'sign in' : 'reset your password';
  await sendMail({
    to: email,
    subject: `${code} is your Leo Learning code`,
    text: `Hi ${user.name || ''},\n\nUse this code to ${what}: ${code}\n\nIt expires in ${OTP_TTL_SEC / 60} minutes. If you didn't ask for it, you can ignore this email.\n\n— Leo Learning\n\n${code} — আপনার লিও লার্নিং কোড। ${OTP_TTL_SEC / 60} মিনিটের মধ্যে ব্যবহার করুন।`
  });
  return { ...base, ...(demoMailEnabled() ? { demoCode: code } : {}) };
}

// Check a code. Returns { userId } on success; throws with attemptsLeft otherwise.
export async function verifyOtp(emailRaw, purpose, codeRaw) {
  const email = normEmail(emailRaw);
  const code = String(codeRaw || '').replace(/\D/g, '');
  if (code.length !== 6) throw new HttpError(400, { error: 'otp_invalid', attemptsLeft: null });
  const [row] = await q(
    `SELECT id, code_hash, attempts, expires_at > NOW() AS live FROM otp_codes
     WHERE email = ? AND purpose = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1`, [email, purpose]);
  if (!row) throw new HttpError(400, { error: 'otp_expired', attemptsLeft: 0 });
  if (!Number(row.live)) throw new HttpError(400, { error: 'otp_expired', attemptsLeft: 0 });
  if (row.attempts >= OTP_MAX_ATTEMPTS) throw new HttpError(429, { error: 'otp_locked', attemptsLeft: 0 });

  const a = Buffer.from(row.code_hash);
  const b = Buffer.from(hashCode(email, code));
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await q('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [row.id]);
    const left = OTP_MAX_ATTEMPTS - row.attempts - 1;
    if (left <= 0) await q('UPDATE otp_codes SET used_at = NOW() WHERE id = ?', [row.id]);
    throw new HttpError(400, { error: left <= 0 ? 'otp_locked' : 'otp_wrong', attemptsLeft: Math.max(0, left) });
  }
  await q('UPDATE otp_codes SET used_at = NOW() WHERE id = ?', [row.id]);
  const [user] = await q("SELECT * FROM users WHERE email = ? AND status = 'active' LIMIT 1", [email]);
  if (!user) throw new HttpError(400, { error: 'otp_expired', attemptsLeft: 0 });
  return user;
}
