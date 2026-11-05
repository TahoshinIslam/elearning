// Security shield: signatures, cross-site writes, rate limits, abuse score,
// escalating blocks, persistence, account blocks and the admin API.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';

process.env.SHIELD_TEST = '1';
const jar = { token: null };
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (n) => (n === 'leo_session' && jar.token ? { value: jar.token } : undefined) }),
  headers: () => new Headers({ 'x-forwarded-for': '198.51.100.250' })
}));

const { q } = await import('@/lib/mysql');
const { signToken, sessionFromUser, currentSession } = await import('@/lib/auth');
const shield = await import('@/lib/shield');
const { fixtures } = await import('./helpers/fixtures.mjs');
const route = await import('@/app/api/admin/security/route.js');

const fx = fixtures('shield');
let owner, victim;
const as = (s) => { jar.token = s ? signToken(s) : null; };
const call = async (fn, method, body) => {
  const res = await fn(new NextRequest(new URL('/api/admin/security', 'http://app.test'), body ? { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : { method }), { params: Promise.resolve({}) });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const ips = ['192.0.2.11', '192.0.2.12', '192.0.2.13', '192.0.2.14'];

beforeAll(async () => {
  shield._resetShield();
  owner = sessionFromUser((await q("SELECT * FROM users WHERE role = 'owner' LIMIT 1"))[0]);
  victim = await fx.student('Blocked Student');
});
afterAll(async () => {
  await q(`DELETE FROM security_blocks WHERE ip IN (${ips.map(() => '?').join(',')}) OR user_id = ?`, [...ips, victim.user.id]);
  await q("DELETE FROM audit_log WHERE action LIKE 'shield_%' AND (target_id IN (?,?,?,?) OR target_id = ?)", [...ips, String(victim.user.id)]);
  shield._resetShield();
  await fx.cleanup();
});

describe('signatures', () => {
  it('flags scanners, traversal and injection, not normal URLs', () => {
    expect(shield.inspectRequest('/wp-login.php')).toMatchObject({ kind: 'scanner_probe' });
    expect(shield.inspectRequest('/.env')).toMatchObject({ kind: 'scanner_probe' });
    expect(shield.inspectRequest('/api/x/..%2f..%2fetc/passwd')).toMatchObject({ kind: 'path_traversal' });
    expect(shield.inspectRequest('/courses', "?q=' OR 1=1--")).toMatchObject({ kind: 'sql_injection_probe' });
    expect(shield.inspectRequest('/courses', '?q=<script>alert(1)</script>')).toMatchObject({ kind: 'xss_probe' });
    expect(shield.inspectRequest('/courses', '?q=physics&category=math')).toBeNull();
    expect(shield.inspectRequest('/course/hsc-physics')).toBeNull();
    expect(shield.inspectRequest('/learn/hsc-physics/111')).toBeNull();
  });
  it('refuses cross-site writes only', () => {
    expect(shield.isCrossSiteWrite('POST', 'https://evil.example', 'app.test')).toBe(true);
    expect(shield.isCrossSiteWrite('POST', 'http://app.test', 'app.test')).toBe(false);
    expect(shield.isCrossSiteWrite('GET', 'https://evil.example', 'app.test')).toBe(false);
    expect(shield.isCrossSiteWrite('POST', null, 'app.test')).toBe(false);
  });
  it('takes the right-most forwarded IP (client-controlled entries are ignored)', () => {
    expect(shield.ipFromHeaders(new Headers({ 'x-forwarded-for': '1.1.1.1, 203.0.113.9' }))).toBe('203.0.113.9');
  });
});

describe('rate limits, scoring and blocks', () => {
  it('counts per key and window', () => {
    const lim = { limit: 3, windowMs: 60_000 };
    expect([1, 2, 3, 4].map(() => shield.hit('t:x', lim).ok)).toEqual([true, true, true, false]);
  });
  it('blocks at the threshold and escalates for repeat offenders, persisting the block', async () => {
    const ip = ips[0];
    expect(shield.report(ip, 'api_403', 2)).toBeNull();
    const b = shield.report(ip, 'scanner_probe', 10);
    expect(b).toMatchObject({ strikes: 1 });
    expect(Math.round((b.until - Date.now()) / 60_000)).toBe(15);
    expect(shield.activeBlock(ip)).toBeTruthy();
    await new Promise((r) => setTimeout(r, 150));
    const [row] = await q('SELECT reason, source, strikes FROM security_blocks WHERE ip = ? ORDER BY id DESC LIMIT 1', [ip]);
    expect(row).toMatchObject({ source: 'auto', strikes: 1 });
    // second offence after the first block is lifted → 1 hour
    const [{ id }] = await q('SELECT id FROM security_blocks WHERE ip = ? ORDER BY id DESC LIMIT 1', [ip]);
    await shield.liftBlock(id, owner.id);
    expect(shield.activeBlock(ip)).toBeNull();
    const b2 = shield.report(ip, 'path_traversal', 10);
    expect(Math.round((b2.until - Date.now()) / 60_000)).toBe(60);
  });
  it('points decay instead of adding up forever', () => {
    expect(shield.scoreOf(ips[3])).toBe(0);
    shield.report(ips[3], 'api_401', 1);
    expect(shield.scoreOf(ips[3])).toBeGreaterThan(0.9);
  });
});

describe('admin API and account blocks', () => {
  it('is owner-only', async () => {
    as(victim.session);
    expect((await call(route.GET, 'GET')).status).toBe(403);
  });
  it('blocks an account: its existing session stops working; unblock restores it', async () => {
    as(owner);
    const r = await call(route.POST, 'POST', { email: victim.user.email, minutes: 60, reason: 'test' });
    expect(r.status).toBe(201);
    as(victim.session);
    expect(await currentSession()).toBeNull();
    as(owner);
    const block = r.body.blocks.find((x) => x.userId === victim.user.id);
    const u = await call(route.DELETE, 'DELETE', { id: block.id });
    expect(u.status).toBe(200);
    as(victim.session);
    expect((await currentSession())?.id).toBe(victim.user.id);
  });
  it('validates input and lists blocks', async () => {
    as(owner);
    expect((await call(route.POST, 'POST', { ip: 'not-an-ip' })).status).toBe(400);
    expect((await call(route.POST, 'POST', { ip: ips[2], minutes: 0, reason: 'manual test' })).status).toBe(201);
    const list = await call(route.GET, 'GET');
    expect(list.body.blocks.some((b) => b.ip === ips[2] && b.until === null)).toBe(true);
  });
});
