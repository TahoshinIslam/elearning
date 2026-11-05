// ============================================================
// Data-access for auth accounts (the `users` table).
// Mirrors the style of lib/repo.js — thin functions over lib/mysql `q()`.
// ============================================================

import { randomBytes } from 'crypto';
import { q, withTransaction } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';
import { hashPassword } from '@/lib/auth';
import { ROLES, parseGrants, serializeGrants } from '@/lib/rbac';
import { recordAudit } from '@/lib/auditLog';

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
  const phone = body.phone ? String(body.phone).trim() : null;

  if (!name) throw new HttpError(400, { error: 'name_required' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, { error: 'invalid_email' });
  if (password.length < 8) throw new HttpError(400, { error: 'weak_password' });

  const existing = await findUserByEmail(email);
  if (existing) throw new HttpError(409, { error: 'email_taken' });

  const passwordHash = hashPassword(password);

  // A role='student' account is useless without a linked `students` row —
  // enrollments/payments/submissions/attendance/certificates all FK to
  // students.id, not users.id. Create both rows in one transaction so a
  // signup can never end up half-linked.
  const userId = await withTransaction(async (tx) => {
    let studentId = null;
    if (role === 'student') {
      const studentRes = await tx(
        'INSERT INTO students (name, phone, batch_id, amount, paid) VALUES (?,?,NULL,0,0)',
        [name, phone || '—']
      );
      studentId = studentRes.insertId;
    }
    const userRes = await tx(
      'INSERT INTO users (name, email, phone, password_hash, role, student_id) VALUES (?,?,?,?,?,?)',
      [name, email, phone, passwordHash, role, studentId]
    );
    return userRes.insertId;
  });

  // credit a referrer if a referral code was supplied (best-effort)
  if (body.referralCode) {
    try { const { recordReferral } = await import('@/lib/referralRepo'); await recordReferral(body.referralCode, userId); }
    catch { /* ignore referral failures */ }
  }
  return getUserById(userId);
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
  const phone = body.phone || null;

  // Same rule as self-registration: a role='student' account needs a linked
  // students row to be usable. If the admin picked an existing one
  // (body.studentId), honor it; otherwise create one, atomically with the user.
  const userId = await withTransaction(async (tx) => {
    let studentId = body.studentId ?? null;
    if (role === 'student' && studentId == null) {
      const studentRes = await tx(
        'INSERT INTO students (name, phone, batch_id, amount, paid) VALUES (?,?,NULL,0,0)',
        [name, phone || '—']
      );
      studentId = studentRes.insertId;
    }
    const userRes = await tx(
      `INSERT INTO users (name, email, phone, password_hash, role, tenant_id, student_id, teacher_id, sections)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [name, email, phone, hashPassword(password), role, body.tenantId ?? null, studentId, body.teacherId ?? null, sections]
    );
    return userRes.insertId;
  });
  return getUserById(userId);
}

// ---------- admin user management ----------
export async function listUsers() {
  return q(`SELECT ${PUBLIC_COLS} FROM users ORDER BY FIELD(role,'superadmin','owner','teacher','student'), id`);
}

// `session` is the acting user — required so a caller can never grant
// themselves a higher role or touch an account they shouldn't. This closed
// a real hole: PATCH /api/users used to accept any owner/superadmin call
// with no check at all, so any owner could set their own role to
// superadmin, or demote/disable the real superadmin.
export async function setUserRole(session, body) {
  if (!ROLES.includes(body.role)) throw new HttpError(400, { error: 'invalid_role' });
  if (!body.id) throw new HttpError(400, { error: 'id_required' });
  if (Number(body.id) === session.id) {
    await recordAudit({ session, action: 'role_change_blocked', targetType: 'user', targetId: body.id, detail: `self-change to ${body.role} refused` });
    throw new HttpError(403, { error: 'cannot_change_own_role' });
  }
  const [target] = await q('SELECT role FROM users WHERE id = ?', [body.id]);
  if (!target) throw new HttpError(404, { error: 'user_not_found' });
  // Only a superadmin may grant the superadmin role or touch an existing
  // superadmin/owner account's role.
  if (session.role !== 'superadmin' && (body.role === 'superadmin' || target.role === 'superadmin' || target.role === 'owner')) {
    await recordAudit({ session, action: 'role_change_blocked', targetType: 'user', targetId: body.id, detail: `${target.role} -> ${body.role} refused` });
    throw new HttpError(403, { error: 'forbidden' });
  }
  await q('UPDATE users SET role = ? WHERE id = ?', [body.role, body.id]);
  await recordAudit({ session, action: 'role_changed', targetType: 'user', targetId: body.id, detail: `${target.role} -> ${body.role}` });
  return listUsers();
}

// Replace a staff/teacher account's section grants. Accepts either
// { grants: { section: 'view' | 'manage' } } or the older { sections: [] }.
export async function setUserSections(session, body) {
  if (!body.id) throw new HttpError(400, { error: 'id_required' });
  const [target] = await q('SELECT role FROM users WHERE id = ?', [body.id]);
  if (!target) throw new HttpError(404, { error: 'user_not_found' });
  if (!['teacher', 'staff'].includes(target.role)) throw new HttpError(400, { error: 'grants_only_for_staff' });
  const grants = body.grants ? parseGrants(Object.entries(body.grants).map(([k, v]) => `${k}:${v}`)) : parseGrants(body.sections);
  const stored = serializeGrants(grants);
  await q('UPDATE users SET sections = ? WHERE id = ?', [stored, body.id]);
  await recordAudit({ session, action: 'sections_changed', targetType: 'user', targetId: body.id, detail: stored || '(none)' });
  return listUsers();
}

// Create an account from the admin console. Owners create teacher / staff /
// student accounts for their centre; only a superadmin may create owners.
// Teacher accounts get a linked teachers row; student accounts a students row.
export async function createAccount(session, body) {
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const role = String(body.role || 'teacher');
  const allowed = session.role === 'superadmin' ? ['student', 'teacher', 'staff', 'owner'] : ['student', 'teacher', 'staff'];
  if (!allowed.includes(role)) {
    await recordAudit({ session, action: 'role_change_blocked', targetType: 'user', detail: `create ${role} refused` });
    throw new HttpError(403, { error: 'forbidden_role' });
  }
  if (!name) throw new HttpError(400, { error: 'name_required' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, { error: 'invalid_email' });
  if (password.length < 8) throw new HttpError(400, { error: 'weak_password' });
  if (await findUserByEmail(email)) throw new HttpError(409, { error: 'email_taken' });

  const grants = ['teacher', 'staff'].includes(role)
    ? serializeGrants(body.grants ? parseGrants(Object.entries(body.grants).map(([k, v]) => `${k}:${v}`)) : parseGrants(body.sections))
    : '';
  const phone = body.phone ? String(body.phone).trim() : null;
  const userId = await withTransaction(async (tx) => {
    let teacherId = null;
    let studentId = null;
    if (role === 'teacher') {
      const t = await tx('INSERT INTO teachers (name, subject, phone) VALUES (?,?,?)', [name, body.subject ? String(body.subject).trim() : null, phone]);
      teacherId = t.insertId;
    }
    if (role === 'student') {
      const st = await tx('INSERT INTO students (name, phone, amount, paid) VALUES (?,?,0,0)', [name, phone || '']);
      studentId = st.insertId;
    }
    const res = await tx(
      'INSERT INTO users (name, email, phone, password_hash, role, teacher_id, student_id, sections) VALUES (?,?,?,?,?,?,?,?)',
      [name, email, phone, hashPassword(password), role, teacherId, studentId, grants]
    );
    return res.insertId;
  });
  await recordAudit({ session, action: 'staff_created', targetType: 'user', targetId: userId, detail: `${role}${grants ? ` · ${grants}` : ''}` });
  return getUserById(userId);
}

// Older entry point (teacher with plain section list) — kept for callers.
export async function createStaff(body, session = null) {
  return createAccount(session || { role: 'owner' }, { ...body, role: 'teacher' });
}

export async function setUserStatus(session, body) {
  const status = body.status === 'disabled' ? 'disabled' : 'active';
  if (!body.id) throw new HttpError(400, { error: 'id_required' });
  if (Number(body.id) === session.id) {
    await recordAudit({ session, action: 'status_change_blocked', targetType: 'user', targetId: body.id, detail: 'self-disable refused' });
    throw new HttpError(403, { error: 'cannot_disable_self' });
  }
  const [target] = await q('SELECT role FROM users WHERE id = ?', [body.id]);
  if (!target) throw new HttpError(404, { error: 'user_not_found' });
  if (session.role !== 'superadmin' && target.role === 'superadmin') {
    await recordAudit({ session, action: 'status_change_blocked', targetType: 'user', targetId: body.id, detail: `${status} refused (target is superadmin)` });
    throw new HttpError(403, { error: 'forbidden' });
  }
  await q('UPDATE users SET status = ? WHERE id = ?', [status, body.id]);
  await recordAudit({ session, action: status === 'disabled' ? 'user_disabled' : 'user_enabled', targetType: 'user', targetId: body.id });
  return listUsers();
}

// ---------- self-service password change ----------
export async function changePassword(userId, oldPassword, newPassword) {
  const { verifyPassword } = await import('@/lib/auth');
  const rows = await q('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [userId]);
  if (!rows[0]) throw new HttpError(404, { error: 'not_found' });
  if (!verifyPassword(oldPassword, rows[0].password_hash)) throw new HttpError(400, { error: 'wrong_password' });
  if (String(newPassword || '').length < 8) throw new HttpError(400, { error: 'weak_password' });
  // bumping session_version signs every other device out (lib/auth.js)
  await q('UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?', [hashPassword(newPassword), userId]);
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
  if (String(newPassword || '').length < 8) throw new HttpError(400, { error: 'weak_password' });
  const rows = await q(
    'SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW() LIMIT 1', [token]);
  if (!rows[0]) throw new HttpError(400, { error: 'invalid_or_expired_token' });
  await q('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL, session_version = session_version + 1 WHERE id = ?',
    [hashPassword(newPassword), rows[0].id]);
  return true;
}
