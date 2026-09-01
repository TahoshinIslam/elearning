// ============================================================
// Data-access for auth accounts (the `users` table).
// Mirrors the style of lib/repo.js — thin functions over lib/mysql `q()`.
// ============================================================

import { randomBytes } from 'crypto';
import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';
import { hashPassword } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';

const PUBLIC_COLS =
  'id, name, email, phone, role, tenant_id, student_id, teacher_id, status, sections, created_at';

export async function findUserByEmail(email) {
  const rows = await q('SELECT * FROM users WHERE email = ? LIMIT 1', [String(email || '').trim().toLowerCase()]);
  return rows[0] || null;
}

export async function getUserById(id) {
  const rows = await q(`SELECT ${PUBLIC_COLS} FROM users WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

// Self-service registration only creates students; staff (teacher/owner) are
// provisioned by an admin.
const SELF_SIGNUP_ROLES = ['student'];

export async function createUser(body) {
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const role = SELF_SIGNUP_ROLES.includes(body.role) ? body.role : 'student';

  if (!name) throw new HttpError(400, { error: 'name_required' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, { error: 'invalid_email' });
  if (password.length < 6) throw new HttpError(400, { error: 'weak_password' });

  const existing = await findUserByEmail(email);
  if (existing) throw new HttpError(409, { error: 'email_taken' });

  const res = await q(
    'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?,?,?,?,?)',
    [name, email, body.phone ? String(body.phone).trim() : null, hashPassword(password), role]
  );
  // credit a referrer if a referral code was supplied (best-effort)
  if (body.referralCode) {
    try { const { recordReferral } = await import('@/lib/referralRepo'); await recordReferral(body.referralCode, res.insertId); }
    catch { /* ignore referral failures */ }
  }
  return getUserById(res.insertId);
}

// Admin-provisioned account (any role, optional links). Used by owner/superadmin.
export async function provisionUser(body) {
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const role = ROLES.includes(body.role) ? body.role : 'student';
  if (!name || !email || password.length < 6) throw new HttpError(400, { error: 'invalid_user' });
  if (await findUserByEmail(email)) throw new HttpError(409, { error: 'email_taken' });

  const sections = Array.isArray(body.sections) ? body.sections.filter(Boolean).join(',') : (body.sections || null);
  const res = await q(
    `INSERT INTO users (name, email, phone, password_hash, role, tenant_id, student_id, teacher_id, sections)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [name, email, body.phone || null, hashPassword(password), role,
     body.tenantId ?? null, body.studentId ?? null, body.teacherId ?? null, sections]
  );
  return getUserById(res.insertId);
}

// ---------- admin user management ----------
export async function listUsers() {
  return q(`SELECT ${PUBLIC_COLS} FROM users ORDER BY FIELD(role,'superadmin','owner','teacher','student'), id`);
}

export async function setUserRole(body) {
  if (!ROLES.includes(body.role)) throw new HttpError(400, { error: 'invalid_role' });
  if (!body.id) throw new HttpError(400, { error: 'id_required' });
  await q('UPDATE users SET role = ? WHERE id = ?', [body.role, body.id]);
  return listUsers();
}

// Replace a staff member's granted dashboard sections (comma-separated store).
export async function setUserSections(body) {
  if (!body.id) throw new HttpError(400, { error: 'id_required' });
  const list = Array.isArray(body.sections) ? body.sections.filter(Boolean).join(',') : '';
  await q('UPDATE users SET sections = ? WHERE id = ?', [list, body.id]);
  return listUsers();
}

// Owner creates a teacher (staff) account: a login + a linked teachers row +
// the dashboard sections they may open.
export async function createStaff(body) {
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!name) throw new HttpError(400, { error: 'name_required' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, { error: 'invalid_email' });
  if (password.length < 6) throw new HttpError(400, { error: 'weak_password' });
  if (await findUserByEmail(email)) throw new HttpError(409, { error: 'email_taken' });

  const sections = Array.isArray(body.sections) ? body.sections.filter(Boolean).join(',') : '';
  const tRes = await q('INSERT INTO teachers (name, subject, phone) VALUES (?,?,?)',
    [name, body.subject ? String(body.subject).trim() : null, body.phone ? String(body.phone).trim() : null]);
  const res = await q(
    'INSERT INTO users (name, email, phone, password_hash, role, teacher_id, sections) VALUES (?,?,?,?,?,?,?)',
    [name, email, body.phone || null, hashPassword(password), 'teacher', tRes.insertId, sections]
  );
  return getUserById(res.insertId);
}

export async function setUserStatus(body) {
  const status = body.status === 'disabled' ? 'disabled' : 'active';
  if (!body.id) throw new HttpError(400, { error: 'id_required' });
  await q('UPDATE users SET status = ? WHERE id = ?', [status, body.id]);
  return listUsers();
}

// ---------- self-service password change ----------
export async function changePassword(userId, oldPassword, newPassword) {
  const { verifyPassword } = await import('@/lib/auth');
  const rows = await q('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [userId]);
  if (!rows[0]) throw new HttpError(404, { error: 'not_found' });
  if (!verifyPassword(oldPassword, rows[0].password_hash)) throw new HttpError(400, { error: 'wrong_password' });
  if (String(newPassword || '').length < 6) throw new HttpError(400, { error: 'weak_password' });
  await q('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(newPassword), userId]);
  return { ok: true };
}

// ---------- password reset ----------
export async function createResetToken(email) {
  const user = await findUserByEmail(email);
  if (!user) return null; // caller must not reveal whether the email exists
  const token = randomBytes(24).toString('hex');
  await q('UPDATE users SET reset_token = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
    [token, user.id]);
  return token;
}

export async function resetPasswordWithToken(token, newPassword) {
  if (!token) throw new HttpError(400, { error: 'invalid_token' });
  if (String(newPassword || '').length < 6) throw new HttpError(400, { error: 'weak_password' });
  const rows = await q(
    'SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW() LIMIT 1', [token]);
  if (!rows[0]) throw new HttpError(400, { error: 'invalid_or_expired_token' });
  await q('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
    [hashPassword(newPassword), rows[0].id]);
  return true;
}
