// ============================================================
// Server-side auth primitives: password hashing, stateless session
// tokens (HMAC-signed), and cookie/session helpers for route handlers.
// Uses only Node's built-in `crypto` — no external dependency to install.
// SERVER ONLY (imports next/headers + node:crypto).
// ============================================================

import 'server-only';
import * as React from 'react';
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { cookies } from 'next/headers';
import { HttpError } from '@/lib/repo';
import { q } from '@/lib/mysql';
import { userBlock } from '@/lib/shield';
import { permissionsFor, can, canAccess, STAFF_ROLES as RBAC_STAFF_ROLES } from '@/lib/rbac';

// Fail closed: a production server must never sign sessions with a value
// that is public in this repository.
const DEV_SECRET = 'leo-dev-secret-change-in-production';
const SECRET = process.env.AUTH_SECRET || DEV_SECRET;
if (process.env.NODE_ENV === 'production' && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)) {
  throw new Error('AUTH_SECRET must be set to at least 32 characters in production');
}
export const SESSION_COOKIE = 'leo_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ---------- password hashing (scrypt) ----------
// Stored format:  scrypt$<saltHex>$<hashHex>
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(String(password), salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ---------- session token (HMAC-signed JSON) ----------
function b64url(buf) { return Buffer.from(buf).toString('base64url'); }
function sign(body) { return createHmac('sha256', SECRET).update(body).digest('base64url'); }

export function signToken(payload) {
  const body = b64url(JSON.stringify({ ...payload, exp: Date.now() + SESSION_TTL_MS }));
  return `${body}.${sign(body)}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Build the compact session object embedded in the cookie + returned to the client.
export function sessionFromUser(user) {
  const rawSections = user.sections ?? user.sectionsCsv ?? '';
  const sections = String(rawSections || '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    tenantId: user.tenant_id ?? user.tenantId ?? null,
    studentId: user.student_id ?? user.studentId ?? null,
    teacherId: user.teacher_id ?? user.teacherId ?? null,
    sections,                       // granted dashboard sections (teacher/staff)
    permissions: permissionsFor(user.role),
    sv: Number(user.session_version ?? user.sv ?? 0) // session version (revocation)
  };
}

// ---------- cookie helpers (call inside route handlers) ----------
export function setSessionCookie(response, session) {
  response.cookies.set(SESSION_COOKIE, signToken(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000
  });
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
}

// The cookie only proves WHO the caller is. WHAT they may do is read from the
// users row on every request, so a role change, a section grant/revoke or a
// disabled account takes effect immediately, and bumping session_version
// signs the user out on every device. Memoised per request (React cache).
const memo = typeof React.cache === 'function' ? React.cache : (fn) => fn;
const loadSession = memo(async (token) => {
  const payload = verifyToken(token);
  if (!payload?.id) return null;
  const rows = await q(
    'SELECT id, name, email, role, tenant_id, student_id, teacher_id, status, sections, session_version FROM users WHERE id = ? LIMIT 1',
    [payload.id]
  );
  const user = rows[0];
  if (!user || user.status === 'disabled') return null;
  if (userBlock(user.id)) return null; // blocked by the security shield
  if (Number(user.session_version || 0) !== Number(payload.sv || 0)) return null;
  return sessionFromUser(user);
});

// Read the current session (null if unauthenticated, revoked or disabled).
export async function currentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return loadSession(token);
}

// Sign a user out everywhere: every token minted before this stops working.
export async function revokeSessions(userId) {
  await q('UPDATE users SET session_version = session_version + 1 WHERE id = ?', [userId]);
}

// ---------- guards (throw HttpError, caught by errResponse in routes) ----------
export async function requireUser() {
  const session = await currentSession();
  if (!session) throw new HttpError(401, { error: 'auth_required' });
  return session;
}

export async function requireRole(...roles) {
  const session = await requireUser();
  if (!roles.includes(session.role)) throw new HttpError(403, { error: 'forbidden' });
  return session;
}

export async function requirePermission(required) {
  const session = await requireUser();
  if (!can(session.permissions || permissionsFor(session.role), required)) {
    throw new HttpError(403, { error: 'forbidden', need: required });
  }
  return session;
}

// Section guard for the admin console. Owner/superadmin always pass; a
// teacher or staff account passes only with a grant on that section — `view`
// for reads, `manage` for writes. Grants are read fresh from the database on
// every request (see currentSession), so changes apply immediately.
export async function requireStaffSection(section, level = 'view') {
  const session = await requireUser();
  if (canAccess(session, section, level)) return session;
  throw new HttpError(403, { error: 'forbidden', need: `${section}:${level}` });
}

export const STAFF_ROLES = RBAC_STAFF_ROLES;
export const isStaff = (session) => !!session && STAFF_ROLES.includes(session.role);
export const isAdmin = (session) => !!session && (session.role === 'owner' || session.role === 'superadmin');

// Scope a list query to the caller: a student only ever sees their own rows
// (studentId forced from the session, whatever the query string says);
// staff pass through only if granted `section` (owner/superadmin always).
export async function scopeToCaller(searchParams, section) {
  const session = await requireUser();
  const sp = new URLSearchParams(searchParams);
  if (session.role === 'student') {
    if (!session.studentId) throw new HttpError(403, { error: 'no_student_profile' });
    sp.set('studentId', String(session.studentId));
    return { session, sp };
  }
  if (section) await requireStaffSection(section, 'view');
  else if (!isStaff(session)) throw new HttpError(403, { error: 'forbidden' });
  return { session, sp };
}
