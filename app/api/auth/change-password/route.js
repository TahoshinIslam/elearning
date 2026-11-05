import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { changePassword, getUserById } from '@/lib/authRepo';
import { requireUser, sessionFromUser, setSessionCookie } from '@/lib/auth';
import { q } from '@/lib/mysql';
import { rateLimit, LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// POST { oldPassword, newPassword } → change the signed-in user's password.
// Every other device is signed out (session_version bump); this one gets a
// fresh cookie so the user stays signed in here.
export async function POST(request) {
  try {
    const session = await requireUser();
    rateLimit(`chpw:${session.id}`, LIMITS.login);
    const { oldPassword, newPassword } = await request.json();
    const result = await changePassword(session.id, oldPassword, newPassword);
    const user = await getUserById(session.id);
    const [{ session_version: sv }] = await q('SELECT session_version FROM users WHERE id = ?', [session.id]);
    const res = NextResponse.json(result);
    setSessionCookie(res, sessionFromUser({ ...user, session_version: sv }));
    return res;
  } catch (e) { return errResponse(e); }
}
