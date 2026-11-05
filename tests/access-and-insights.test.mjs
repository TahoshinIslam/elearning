// Granular access control, live sessions, analytics, activity and ad
// attribution — against the real route handlers and database.
//   - a staff account only reaches the sections (and levels) it was granted
//   - grant / role / disable changes take effect on the very next request
//   - "sign out everywhere" kills existing tokens
//   - owners can't create owners; superadmins can
//   - UTM visits are attributed to sign-ups and paid orders per campaign

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';

const jar = { token: null, vid: null };
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name) => (name === 'leo_session' && jar.token ? { value: jar.token }
      : name === 'leo_vid' && jar.vid ? { value: jar.vid } : undefined)
  }),
  headers: () => new Headers({ 'x-forwarded-for': '203.0.113.21' })
}));

const { q } = await import('@/lib/mysql');
const { signToken, sessionFromUser } = await import('@/lib/auth');
const { fixtures } = await import('./helpers/fixtures.mjs');
const { recordEvent, linkVisitorToUser, attributeOrder, getTrafficReport, classifySource } = await import('@/lib/trackingRepo');
const { getAnalytics } = await import('@/lib/analyticsRepo');
const { getRecentActivity } = await import('@/lib/activityRepo');
const { parseGrants, serializeGrants, canAccess } = await import('@/lib/rbac');

const routes = {
  users: await import('@/app/api/users/route.js'),
  students: await import('@/app/api/students/route.js'),
  coupons: await import('@/app/api/coupons/route.js'),
  analytics: await import('@/app/api/admin/analytics/route.js'),
  activity: await import('@/app/api/admin/activity/route.js'),
  traffic: await import('@/app/api/admin/traffic/route.js'),
  me: await import('@/app/api/auth/me/route.js')
};

const fx = fixtures('access');
let owner, superadmin;
const made = [];
const as = (session) => { jar.token = session ? signToken(session) : null; };
const req = (url, init) => new NextRequest(new URL(url, 'http://app.test'), init);
const call = async (fn, url, init, params) => {
  const res = await fn(req(url, init), { params: params || {} });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const json = (method, body) => ({ method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
const vid = () => Array.from({ length: 26 }, () => '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[Math.floor(Math.random() * 32)]).join('');

beforeAll(async () => {
  owner = sessionFromUser((await q("SELECT * FROM users WHERE role = 'owner' LIMIT 1"))[0]);
  superadmin = sessionFromUser((await q("SELECT * FROM users WHERE role = 'superadmin' LIMIT 1"))[0]);
});

afterAll(async () => {
  jar.token = null;
  if (made.length) {
    const ph = made.map(() => '?').join(',');
    const t = await q(`SELECT teacher_id, student_id FROM users WHERE id IN (${ph})`, made);
    await q(`DELETE FROM users WHERE id IN (${ph})`, made);
    for (const r of t) {
      if (r.teacher_id) await q('DELETE FROM teachers WHERE id = ?', [r.teacher_id]);
      if (r.student_id) await q('DELETE FROM students WHERE id = ?', [r.student_id]);
    }
  }
  await q(`DELETE FROM visit_events WHERE visitor_id IN (SELECT id FROM visitors WHERE ft_campaign LIKE ?)`, [`${fx.RUN}%`]);
  await q('DELETE FROM visitors WHERE ft_campaign LIKE ?', [`${fx.RUN}%`]);
  await fx.cleanup();
});

describe('grants', () => {
  it('parses levels, keeps the stronger grant and drops owner-only sections', () => {
    expect(parseGrants('students:view,students:manage,users:manage,coupons')).toEqual({ students: 'manage', coupons: 'manage' });
    expect(serializeGrants({ students: 'view', access: 'manage', bogus: 'view' })).toBe('students:view');
    expect(canAccess({ role: 'staff', sections: ['students:view'] }, 'students', 'manage')).toBe(false);
    expect(canAccess({ role: 'staff', sections: ['students:view'] }, 'students', 'view')).toBe(true);
    expect(canAccess({ role: 'student', sections: ['students:manage'] }, 'students', 'view')).toBe(false);
  });
});

describe('account creation and live access changes', () => {
  let staff;

  it('an owner creates a staff account with view-only access to students', async () => {
    as(owner);
    const r = await call(routes.users.POST, '/api/users', json('POST', {
      name: 'Front Desk', email: `${fx.RUN}-desk@example.test`, password: 'deskpass123', role: 'staff', grants: { students: 'view' }
    }));
    expect(r.status).toBe(201);
    made.push(r.body.id);
    staff = sessionFromUser({ ...r.body, session_version: 0 });
    expect(staff.role).toBe('staff');
  });

  it('owners cannot create owners; superadmins can', async () => {
    as(owner);
    expect((await call(routes.users.POST, '/api/users', json('POST', { name: 'X', email: `${fx.RUN}-o1@example.test`, password: 'ownerpass1', role: 'owner' }))).status).toBe(403);
    as(superadmin);
    const r = await call(routes.users.POST, '/api/users', json('POST', { name: 'Branch Owner', email: `${fx.RUN}-o2@example.test`, password: 'ownerpass1', role: 'owner' }));
    expect(r.status).toBe(201);
    made.push(r.body.id);
  });

  it('view grant: can read students, cannot write them, cannot open other sections', async () => {
    as(staff);
    expect((await call(routes.students.GET, '/api/students')).status).toBe(200);
    expect((await call(routes.students.POST, '/api/students', json('POST', { name: 'Nope', phone: '0' }))).status).toBe(403);
    expect((await call(routes.coupons.GET, '/api/coupons')).status).toBe(403);
    expect((await call(routes.analytics.GET, '/api/admin/analytics')).status).toBe(403);
    expect((await call(routes.users.GET, '/api/users')).status).toBe(403);
  });

  it('a new grant works on the next request — no re-login needed', async () => {
    as(owner);
    expect((await call(routes.users.PATCH, '/api/users', json('PATCH', { id: staff.id, grants: { students: 'view', coupons: 'manage', analytics: 'view' } }))).status).toBe(200);
    as(staff); // same old token
    expect((await call(routes.coupons.GET, '/api/coupons')).status).toBe(200);
    expect((await call(routes.analytics.GET, '/api/admin/analytics?days=7')).status).toBe(200);
  });

  it('disabling the account locks out an existing token immediately', async () => {
    as(owner);
    await call(routes.users.PATCH, '/api/users', json('PATCH', { id: staff.id, status: 'disabled' }));
    as(staff);
    expect((await call(routes.students.GET, '/api/students')).status).toBe(401);
    as(owner);
    await call(routes.users.PATCH, '/api/users', json('PATCH', { id: staff.id, status: 'active' }));
    as(staff);
    expect((await call(routes.students.GET, '/api/students')).status).toBe(200);
  });

  it('sign out everywhere invalidates tokens issued before it', async () => {
    as(owner);
    expect((await call(routes.users.POST, '/api/users', json('POST', { id: staff.id, action: 'revoke_sessions' }))).status).toBe(200);
    as(staff);
    expect((await call(routes.students.GET, '/api/students')).status).toBe(401);
    const [{ session_version: sv }] = await q('SELECT session_version FROM users WHERE id = ?', [staff.id]);
    as({ ...staff, sv });
    expect((await call(routes.students.GET, '/api/students')).status).toBe(200);
  });

  it('access changes are audited', async () => {
    const rows = await q("SELECT action FROM audit_log WHERE target_type = 'user' AND target_id = ? ORDER BY id", [String(staff.id)]);
    const actions = rows.map((r) => r.action);
    expect(actions).toEqual(expect.arrayContaining(['staff_created', 'sections_changed', 'user_disabled', 'user_enabled', 'sessions_revoked']));
  });
});

describe('traffic attribution', () => {
  it('classifies sources', () => {
    expect(classifySource({ utmSource: 'Facebook', utmMedium: 'paid-social', utmCampaign: 'eid' })).toEqual({ source: 'facebook', medium: 'paid-social', campaign: 'eid' });
    expect(classifySource({ gclid: 'x' }).medium).toBe('cpc');
    expect(classifySource({ referrer: 'https://www.google.com/search?q=hsc' }).medium).toBe('organic');
    expect(classifySource({ referrer: 'https://m.facebook.com/' }).medium).toBe('social');
    expect(classifySource({ referrer: 'https://app.test/x', siteHost: 'app.test' }).source).toBe('direct');
  });

  it('attributes a sign-up and a paid order to the ad campaign that brought the visitor', async () => {
    const campaign = `${fx.RUN}-eid-sale`;
    const visitors = [];
    for (let i = 0; i < 6; i++) {
      const v = vid();
      visitors.push(v);
      await recordEvent(v, { type: 'pageview', path: '/', utmSource: 'facebook', utmMedium: 'paid-social', utmCampaign: campaign, device: 'mobile' });
    }
    const buyer = await fx.student('Ad Buyer');
    await linkVisitorToUser(visitors[0], buyer.user.id, { signup: true });
    const course = await fx.course({ price: 700 });
    const res = await q("INSERT INTO orders (student_id, status, subtotal, discount, amount, currency, gateway, paid_at) VALUES (?, 'paid', 700, 0, 700, 'BDT', 'bkash', NOW())", [buyer.studentId]);
    await q('INSERT INTO order_items (order_id, course_id, unit_price, list_price, title_snapshot) VALUES (?,?,700,700,?)', [res.insertId, course.courseId, 'Ad course']);
    await attributeOrder(res.insertId, visitors[0]);

    const [u] = await q('SELECT signup_source, signup_campaign FROM users WHERE id = ?', [buyer.user.id]);
    expect(u).toEqual({ signup_source: 'facebook', signup_campaign: campaign });

    const report = await getTrafficReport({ days: 7 });
    const row = report.channels.find((c) => c.campaign === campaign);
    expect(row).toMatchObject({ source: 'facebook', visitors: 6, signups: 1, orders: 1, revenue: 700 });
    expect(report.ads.some((r) => r.campaign === campaign)).toBe(true);
  });

  it('course views build an interest profile', async () => {
    const v = vid();
    await recordEvent(v, { type: 'pageview', utmSource: 'google', utmCampaign: `${fx.RUN}-int` });
    await recordEvent(v, { type: 'course_view', category: 'physics' });
    await recordEvent(v, { type: 'course_view', category: 'physics' });
    await recordEvent(v, { type: 'course_view', category: 'math' });
    const [row] = await q('SELECT interests, pageviews FROM visitors WHERE id = ?', [v]);
    expect(JSON.parse(row.interests)).toEqual({ physics: 6, math: 3 });
    expect(row.pageviews).toBe(1);
  });
});

describe('analytics and activity', () => {
  it('analytics returns KPIs, a full daily series and funnels', async () => {
    const a = await getAnalytics({ days: 30 });
    expect(a.series).toHaveLength(30);
    expect(a.kpis.revenue.value).toBeGreaterThanOrEqual(700);
    expect(Array.isArray(a.funnel)).toBe(true);
    expect(a.ratings.distribution).toHaveLength(5);
  });

  it('activity merges sources newest-first and filters by type', async () => {
    const all = await getRecentActivity({ limit: 40, days: 7 });
    expect(all.length).toBeGreaterThan(0);
    for (let i = 1; i < all.length; i++) expect(all[i - 1].at >= all[i].at).toBe(true);
    const orders = await getRecentActivity({ types: ['order'], limit: 10, days: 7 });
    expect(orders.every((x) => x.type === 'order')).toBe(true);
    as(owner);
    expect((await call(routes.activity.GET, '/api/admin/activity?types=signup&limit=5')).status).toBe(200);
    expect((await call(routes.traffic.GET, '/api/admin/traffic?days=7')).status).toBe(200);
  });
});
