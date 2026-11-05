// Outgoing mail. DEMO transport: messages are stored in `demo_mail` and shown
// in the demo inbox (/dev/mailbox) instead of being delivered. To go live,
// replace sendMail's body with your provider (or hand auth to Clerk) — every
// caller already goes through this one function.
import 'server-only';
import { q } from '@/lib/mysql';
import { logger } from '@/lib/logger';

export async function sendMail({ to, subject, text }) {
  await q('INSERT INTO demo_mail (to_email, subject, body_text) VALUES (?,?,?)', [String(to).toLowerCase(), String(subject).slice(0, 255), String(text)]);
  logger.info('mail_queued_demo', { to: String(to).replace(/(.).+(@.+)/, '$1***$2'), subject });
}

export async function listDemoMail({ to, limit = 30 } = {}) {
  const rows = to
    ? await q('SELECT id, to_email AS toEmail, subject, body_text AS body, created_at AS createdAt FROM demo_mail WHERE to_email = ? ORDER BY id DESC LIMIT ?', [String(to).toLowerCase(), limit])
    : await q('SELECT id, to_email AS toEmail, subject, body_text AS body, created_at AS createdAt FROM demo_mail ORDER BY id DESC LIMIT ?', [limit]);
  return rows;
}

// Demo features (inbox page, code autofill) are on in development and only
// in production when OTP_DEMO=true is set deliberately.
export const demoMailEnabled = () => process.env.NODE_ENV !== 'production' || process.env.OTP_DEMO === 'true';
