// Profile photos (signed upload → confirm → swap → remove) and the password
// strength rules shown under every new-password field.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';

const jar = { token: null };
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (name) => (name === 'leo_session' && jar.token ? { value: jar.token } : undefined) }),
  headers: () => new Headers({ 'x-forwarded-for': '198.51.100.77' })
}));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'leo-avatar-'));
process.env.STORAGE_PROVIDER = 'local';
process.env.STORAGE_LOCAL_DIR = tmp;

const { q } = await import('@/lib/mysql');
const { signToken, sessionFromUser, currentSession } = await import('@/lib/auth');
const { fixtures } = await import('./helpers/fixtures.mjs');
const { passwordStrength } = await import('@/components/ui/PasswordInput.jsx');
const avatar = await import('@/app/api/me/avatar/route.js');
const upload = await import('@/app/api/storage/upload/[token]/route.js');

const fx = fixtures('avatar');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
let a, b;
const as = (s) => { jar.token = s ? signToken(s) : null; };
const call = async (method, body) => {
  const res = await avatar[method](new NextRequest('http://app.test/api/me/avatar', { method, ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}) }));
  return { status: res.status, body: await res.json().catch(() => null) };
};
const put = async (url, buf, type) => {
  const token = new URL(url, 'http://app.test').pathname.split('/').pop();
  const res = await upload.PUT(new NextRequest(`http://app.test/api/storage/upload/${token}`, { method: 'PUT', body: buf, headers: { 'Content-Type': type, 'Content-Length': String(buf.length) } }), { params: Promise.resolve({ token }) });
  return res.status;
};

beforeAll(async () => {
  a = sessionFromUser((await fx.student('Photo One')).user);
  b = sessionFromUser((await fx.student('Photo Two')).user);
});
afterAll(async () => { jar.token = null; await fx.cleanup(); fs.rmSync(tmp, { recursive: true, force: true }); });

describe('profile photo', () => {
  it('needs a signed-in user and a real image type under 5 MB', async () => {
    as(null);
    expect((await call('POST', { contentType: 'image/png', size: 100 })).status).toBe(401);
    as(a);
    expect((await call('POST', { contentType: 'image/gif', size: 100 })).status).toBe(400);
    expect((await call('POST', { contentType: 'image/png', size: 6 * 1024 * 1024 })).status).toBe(400);
  });

  it('uploads, confirms, shows in the session and replaces the old file', async () => {
    as(a);
    const one = (await call('POST', { contentType: 'image/png', size: PNG.length, fileName: 'me.png' })).body;
    expect(one.key).toMatch(new RegExp(`^thumbnails/avatars/${a.id}/`));
    expect(await put(one.uploadUrl, PNG, 'image/png')).toBe(200);
    const ok = await call('PUT', { key: one.key });
    expect(ok.status).toBe(200);
    expect(ok.body.avatarUrl).toBe(`/api/storage/public/${one.key}`);
    expect((await currentSession()).avatarUrl).toBe(ok.body.avatarUrl);

    const two = (await call('POST', { contentType: 'image/png', size: PNG.length })).body;
    await put(two.uploadUrl, PNG, 'image/png');
    await call('PUT', { key: two.key });
    await new Promise((r) => setTimeout(r, 50));
    expect(fs.existsSync(path.join(tmp, one.key))).toBe(false); // old photo deleted
    expect(fs.existsSync(path.join(tmp, two.key))).toBe(true);
  });

  it('rejects a disguised file and someone else’s key', async () => {
    as(a);
    const s = (await call('POST', { contentType: 'image/png', size: 64 })).body;
    expect(await put(s.uploadUrl, Buffer.from('<?php echo 1; ?>'.repeat(4)), 'image/png')).toBe(415);
    expect((await call('PUT', { key: s.key })).body.error).toBe('upload_not_found');
    as(b);
    expect((await call('PUT', { key: s.key })).body.error).toBe('upload_mismatch');
    expect((await call('PUT', { key: `thumbnails/avatars/${b.id}/../${a.id}/x.png` })).status).toBe(409);
  });

  it('removes the photo', async () => {
    as(a);
    expect((await call('DELETE')).body.avatarUrl).toBeNull();
    const [row] = await q('SELECT avatar_key FROM users WHERE id = ?', [a.id]);
    expect(row.avatar_key).toBeNull();
  });
});

describe('password strength', () => {
  it('scores by the five rules and punishes common passwords', () => {
    expect(passwordStrength('').level).toBe(0);
    expect(passwordStrength('Ab1!').level).toBe(0); // too short
    expect(passwordStrength('abcdefgh').level).toBe(1);
    expect(passwordStrength('Abcdefg1').level).toBe(3);
    expect(passwordStrength('Abcdefg1!').level).toBe(4);
    expect(passwordStrength('Password1!').level).toBe(1);
    expect(passwordStrength('correct horse battery').level).toBe(2); // long passphrase earns a step
    expect(passwordStrength('Abcdefg1!').passed).toEqual([true, true, true, true, true]);
  });
});
