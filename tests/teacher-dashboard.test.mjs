// A teacher shares the owner dashboard (/owner) but only sees granted staff
// sections. The overview ('dash') is platform-wide (revenue included) and its
// API is owner/superadmin only, so a teacher must never land on it — they
// land on their first real section, whose API they can actually load.

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { NextRequest } from 'next/server';

const jar = { token: null };
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (name) => (name === 'leo_session' && jar.token ? { value: jar.token } : undefined) }),
  headers: () => new Headers({ 'x-forwarded-for': '203.0.113.9' })
}));

const { q } = await import('@/lib/mysql');
const { signToken, sessionFromUser } = await import('@/lib/auth');
const { sectionsForSession, STAFF_SECTIONS, ALL_SECTIONS } = await import('@/lib/rbac');
const overview = await import('@/app/api/admin/overview/route.js');
const students = await import('@/app/api/students/route.js');

const as = (session) => { jar.token = session ? signToken(session) : null; };
const call = async (fn, url) => {
  const res = await fn(new NextRequest(new URL(url, 'http://app.test')), { params: {} });
  return { status: res.status, body: await res.json().catch(() => null) };
};

// What the demo teacher (teacher@leolearning.app) had stored before this fix:
// every staff section, 'dash' included. Grants like this still exist in DBs.
const LEGACY_GRANT = 'dash,students,classes,attendance,submissions,quizzes,announce';
const teacher = sessionFromUser({ id: 900001, role: 'teacher', name: 'T', email: 't@example.test', teacher_id: 1, sections: LEGACY_GRANT });
let owner, superadmin;

beforeAll(async () => {
  const [o] = await q("SELECT * FROM users WHERE role = 'owner' LIMIT 1");
  owner = sessionFromUser(o);
  superadmin = sessionFromUser({ id: 900002, role: 'superadmin', name: 'S', email: 's@example.test' });
});

describe('teacher landing section', () => {
  it('the overview is not a grantable staff section', () => {
    expect(STAFF_SECTIONS).not.toContain('dash');
  });

  it('a teacher never gets the overview, even with a stale "dash" grant, and lands on students', () => {
    const allowed = sectionsForSession(teacher);
    expect(allowed).not.toContain('dash');
    expect(allowed[0]).toBe('students');
    expect(allowed).toEqual(['students', 'classes', 'attendance', 'submissions', 'quizzes', 'announce']);
  });

  it('owner and superadmin still get every section, starting with the overview', () => {
    for (const s of [owner, superadmin]) {
      expect(sectionsForSession(s)).toEqual(ALL_SECTIONS);
      expect(sectionsForSession(s)[0]).toBe('dash');
    }
  });

  it('the teacher’s first screen loads (students directory 200); the overview API stays closed to them', async () => {
    as(teacher);
    expect((await call(students.GET, '/api/students?view=directory')).status).toBe(200);
    expect((await call(overview.GET, '/api/admin/overview')).status).toBe(403);
  });

  it('owner and superadmin still load the full overview', async () => {
    for (const s of [owner, superadmin]) {
      as(s);
      const r = await call(overview.GET, '/api/admin/overview');
      expect(r.status).toBe(200);
      expect(r.body).toHaveProperty('sales.revenue');
      expect(r.body).toHaveProperty('students.total');
    }
    as(null);
  });
});
