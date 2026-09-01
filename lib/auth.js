// ============================================================
// Server-side auth primitives: password hashing, stateless session
// tokens (HMAC-signed), and cookie/session helpers for route handlers.
// Uses only Node's built-in `crypto` — no external dependency to install.
// SERVER ONLY (imports next/headers + node:crypto).
// ============================================================

import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { cookies } from 'next/headers';
import { HttpError } from '@/lib/repo';
import { permissionsFor, can } from '@/lib/rbac';

const SECRET = process.env.AUTH_SECRET || 'leo-dev-secret-change-in-production';
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
    permissions: permissionsFor(user.role)
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
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

// Read the current session from the request cookies (null if unauthenticated).
export function currentSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifyToken(token);
}

// ---------- guards (throw HttpError, caught by errResponse in routes) ----------
export function requireUser() {
  const session = currentSession();
  if (!session) throw new HttpError(401, { error: 'auth_required' });
  return session;
}

export function requireRole(...roles) {
  const session = requireUser();
  if (!roles.includes(session.role)) throw new HttpError(403, { error: 'forbidden' });
  return session;
}

export function requirePermission(required) {
  const session = requireUser();
  if (!can(session.permissions || permissionsFor(session.role), required)) {
    throw new HttpError(403, { error: 'forbidden', need: required });
  }
  return session;
}

// Staff-section guard for the merged dashboard: owner/superadmin always pass;
// a teacher passes only if the owner granted them this section.
export function requireStaffSection(section) {
  const session = requireUser();
  if (session.role === 'owner' || session.role === 'superadmin') return session;
  if (session.role === 'teacher' && Array.isArray(session.sections) && session.sections.includes(section)) return session;
  throw new HttpError(403, { error: 'forbidden', need: section });
}
