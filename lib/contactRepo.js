// ============================================================
// Contact-form messages: public create, admin read/mark-read.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

export async function createMessage(body) {
  const name = String(body.name || '').trim();
  const message = String(body.message || '').trim();
  if (!name) throw new HttpError(400, { error: 'name_required' });
  if (!message) throw new HttpError(400, { error: 'message_required' });
  await q('INSERT INTO contact_messages (name, email, subject, message) VALUES (?,?,?,?)',
    [name, body.email ? String(body.email).trim() : null, body.subject ? String(body.subject).trim() : null, message]);
  return { ok: true };
}

export async function getMessages() {
  return q(
    `SELECT id, name, email, subject, message, is_read AS isRead, created_at AS createdAt
     FROM contact_messages ORDER BY (is_read=0) DESC, id DESC`
  ).then((rows) => rows.map((r) => ({ ...r, isRead: !!r.isRead })));
}

export async function markMessageRead(body) {
  if (body.all) await q('UPDATE contact_messages SET is_read = 1');
  else if (body.id) await q('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [body.id]);
  return getMessages();
}
