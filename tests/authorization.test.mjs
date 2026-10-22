// Route-level authorization: calls the real Next.js route handlers with a
// real signed session cookie (next/headers is pointed at a per-test cookie
// jar). Journeys covered:
//   3. a non-owner can't get paid playback through direct API calls
//   9. one student can't read another student's private records
//  10. admin authorization + publication rules hold; drafts never public

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';

const jar = { token: null };
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (name) => (name === 'leo_session' && jar.token ? { value: jar.token } : undefined) }),
  headers: () => new Headers({ 'x-forwarded-for': '203.0.113.9' })
}));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'leo-auth-'));
process.env.STORAGE_PROVIDER = 'local';
process.env.STORAGE_LOCAL_DIR = tmp;

const { q } = await import('@/lib/mysql');
const { signToken, sessionFromUser } = await import('@/lib/auth');
const { fixtures } = await import('./helpers/fixtures.mjs');
const { courseOp, assertCourseComplete } = await import('@/lib/repo');

const routes = {
  students: await import('@/app/api/students/route.js'),
  attendance: await import('@/app/api/attendance/route.js'),
  submissions: await import('@/app/api/submissions/route.js'),
  tenants: await import('@/app/api/tenants/route.js'),
  teachers: await import('@/app/api/teachers/route.js'),
  liveClasses: await import('@/app/api/live-classes/route.js'),
  courses: await import('@/app/api/courses/route.js'),
  video: await import('@/app/api/lessons/[id]/video/route.js'),
  progress: await import('@/app/api/lessons/[id]/progress/route.js'),
  learn: await import('@/app/api/learn/[slug]/route.js'),
  forgot: await import('@/app/api/auth/forgot/route.js'),
  orders: await import('@/app/api/orders/route.js'),
  certificates: await import('@/app/api/certificates/route.js')
};

const fx = fixtures('authz');
let alice, bob, course, draft, owner;

const as = (session) => { jar.token = session ? signToken(session) : null; };
const req = (url, init) => new NextRequest(new URL(url, 'http://app.test'), init);
const call = async (fn, url, init, params) => {
  const res = await fn(req(url, init), { params: params || {} });
  return { status: res.status, body: await res.json().catch(() => null) };
};

beforeAll(async () => {
  alice = await fx.student('Alice');
  bob = await fx.student('Bob');
  course = await fx.course({ price: 800, lessons: [{}, { free: true }] });
  draft = await fx.course({ published: false, title: `Secret Draft ${fx.RUN}` });
  await fx.enroll(alice.studentId, course.courseId);
  const [o] = await q("SELECT * FROM users WHERE role = 'owner' LIMIT 1");
  owner = sessionFromUser(o);
});

afterAll(async () => {
  jar.token = null;
  await fx.cleanup();
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('staff-only data is no longer public', () => {
  for (const [name, url] of [['students', '/api/students'], ['tenants', '/api/tenants'], ['teachers', '/api/teachers']]) {
    it(`${name}: guest 401, student 403, owner 200`, async () => {
      as(null); expect((await call(routes[name].GET, url)).status).toBe(401);
      as(alice.session); expect((await call(routes[name].GET, url)).status).toBe(403);
      as(owner); expect((await call(routes[name].GET, url)).status).toBe(200);
    });
  }

  it('a student asking for another student’s attendance/submissions/certificates gets only their own', async () => {
    as(alice.session);
    for (const [r, url] of [[routes.attendance, '/api/attendance'], [routes.submissions, '/api/submissions'], [routes.certificates, '/api/certificates']]) {
      const out = await call(r.GET, `${url}?studentId=${bob.studentId}`);
      expect(out.status).toBe(200);
      expect(out.body.every((row) => row.studentId === alice.studentId)).toBe(true);
    }
  });

  it('live classes: guests get nothing; students never receive meeting URLs', async () => {
    as(null); expect((await call(routes.liveClasses.GET, '/api/live-classes')).body).toEqual([]);
    as(alice.session);
    const out = await call(routes.liveClasses.GET, '/api/live-classes');
    expect(out.body.every((c) => !('zoomUrl' in c))).toBe(true);
  });

  it('password reset never returns the token to the caller', async () => {
    as(null);
    const out = await call(routes.forgot.POST, '/api/auth/forgot', { method: 'POST', body: JSON.stringify({ email: alice.user.email }) });
    expect(out.status).toBe(200);
    expect(out.body).toEqual({ ok: true });
  });
});

describe('paid content via direct API calls', () => {
  const [paidIdx, freeIdx] = [0, 1];

  it('guest and non-owner are refused paid playback; the owner of the course is allowed', async () => {
    const id = String(course.lessonIds[paidIdx]);
    as(null); expect((await call(routes.video.GET, `/api/lessons/${id}/video`, undefined, { id })).status).toBe(401);
    as(bob.session); expect((await call(routes.video.GET, `/api/lessons/${id}/video`, undefined, { id })).status).toBe(403);
    as(alice.session);
    const ok = await call(routes.video.GET, `/api/lessons/${id}/video`, undefined, { id });
    expect(ok.status).toBe(200);
    expect(ok.body.url).toMatch(/^\/api\/storage\/object\//);
  });

  it('a guest may play the designated preview', async () => {
    const id = String(course.lessonIds[freeIdx]);
    as(null);
    const out = await call(routes.video.GET, `/api/lessons/${id}/video`, undefined, { id });
    expect(out.status).toBe(200);
    expect(out.body.access).toBe('preview');
  });

  it('a non-owner cannot write progress or read the course player outline', async () => {
    const id = String(course.lessonIds[paidIdx]);
    as(bob.session);
    const p = await call(routes.progress.POST, `/api/lessons/${id}/progress`, { method: 'POST', body: JSON.stringify({ positionSeconds: 5, ranges: [[0, 5]] }) }, { id });
    expect(p.status).toBe(403);
    expect((await call(routes.learn.GET, `/api/learn/${course.slug}`, undefined, { slug: course.slug })).status).toBe(403);
  });

  it('order history is per-student; the staff ledger is staff-only', async () => {
    as(bob.session);
    expect((await call(routes.orders.GET, '/api/orders')).status).toBe(403);
    const mine = await call(routes.orders.GET, '/api/orders?mine=1');
    expect(mine.status).toBe(200);
    expect(mine.body.every((o) => o.studentId === bob.studentId)).toBe(true);
  });
});

describe('catalog and administration rules', () => {
  it('the public course API never returns drafts', async () => {
    as(null);
    const out = await call(routes.courses.GET, `/api/courses?q=${encodeURIComponent('Secret Draft')}`);
    expect(out.status).toBe(200);
    expect(out.body.items.find((c) => c.id === draft.courseId)).toBeUndefined();
  });

  it('students cannot create or change courses', async () => {
    as(alice.session);
    expect((await call(routes.courses.POST, '/api/courses', { method: 'POST', body: JSON.stringify({ title: 'x' }) })).status).toBe(403);
    expect((await call(routes.courses.PATCH, '/api/courses', { method: 'PATCH', body: JSON.stringify({ op: 'publish', courseId: draft.courseId }) })).status).toBe(403);
  });

  it('a course with a lesson whose video is not ready cannot be published', async () => {
    await q('UPDATE video_assets SET status = ? WHERE lesson_id = ?', ['pending', draft.lessonIds[0]]);
    await expect(assertCourseComplete(draft.courseId)).rejects.toMatchObject({ status: 400, body: { missing: expect.arrayContaining(['videos_not_ready']) } });
    await q('UPDATE video_assets SET status = ? WHERE lesson_id = ?', ['ready', draft.lessonIds[0]]);
    await courseOp({ op: 'publish', courseId: draft.courseId }, owner);
    await courseOp({ op: 'publish', courseId: draft.courseId }, owner); // back to draft
  });

  it('a course with enrolled students cannot be deleted, and lessons with learner records are protected', async () => {
    await expect(courseOp({ op: 'deleteCourse', courseId: course.courseId }, owner)).rejects.toMatchObject({ status: 409 });
    await q("INSERT INTO lesson_progress (student_id, lesson_id, completed, completion_source) VALUES (?,?,1,'watch') ON DUPLICATE KEY UPDATE completed = 1", [alice.studentId, course.lessonIds[0]]);
    await expect(courseOp({ op: 'deleteLesson', courseId: course.courseId, lessonId: course.lessonIds[0] }, owner)).rejects.toMatchObject({ status: 409, body: { error: 'has_learner_data' } });
  });

  it('reordering persists an explicit order', async () => {
    const m = course.moduleId;
    const [a, b] = course.lessonIds;
    await courseOp({ op: 'reorderLessons', courseId: course.courseId, moduleId: m, order: [b, a] }, owner);
    const rows = await q('SELECT id FROM lessons WHERE module_id = ? ORDER BY position, id', [m]);
    expect(rows.map((r) => r.id)).toEqual([b, a]);
  });
});
