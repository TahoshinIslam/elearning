// ============================================================
// In-app notification data-access.
// Notifications are stored per recipient user; announcements fan out to
// one row per targeted student.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

export async function getMyNotifications(userId, limit = 30) {
  if (!userId) return [];
  return q(
    `SELECT id, title, body, kind, is_read AS isRead, created_at AS createdAt
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?`,
    [userId, limit]
  ).then((rows) => rows.map((r) => ({ ...r, isRead: !!r.isRead })));
}

export async function markRead(userId, body) {
  if (!userId) throw new HttpError(401, { error: 'auth_required' });
  if (body.all) {
    await q('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  } else if (body.id) {
    await q('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id = ?', [userId, body.id]);
  }
  return getMyNotifications(userId);
}

// Direct notification to one user (used by grading, scheduling, etc.).
export async function notifyUser(userId, { title, body, kind = 'system' }) {
  if (!userId) return;
  await q('INSERT INTO notifications (user_id, title, body, kind) VALUES (?,?,?,?)',
    [userId, title, body || null, kind]);
}

// Notify the user account linked to a given student row (may not exist).
export async function notifyStudent(studentId, payload) {
  const rows = await q('SELECT id FROM users WHERE student_id = ? LIMIT 1', [studentId]);
  if (rows[0]) await notifyUser(rows[0].id, payload);
}

// Fan an announcement out to student accounts. Owner/teacher → their tenant;
// superadmin → all tenants. Returns how many recipients were notified.
export async function announce(session, body) {
  const title = String(body.title || '').trim();
  if (!title) throw new HttpError(400, { error: 'title_required' });
  const message = body.body ? String(body.body).trim() : null;

  let recipients;
  if (session.role === 'superadmin') {
    recipients = await q("SELECT id FROM users WHERE role = 'student'");
  } else {
    recipients = await q("SELECT id FROM users WHERE role = 'student' AND tenant_id = ?", [session.tenantId ?? -1]);
  }
  for (const r of recipients) {
    await q('INSERT INTO notifications (user_id, title, body, kind) VALUES (?,?,?,?)',
      [r.id, title, message, 'announcement']);
  }
  return { sent: recipients.length };
}
