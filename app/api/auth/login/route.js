import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { findUserByEmail } from '@/lib/authRepo';
import { verifyPassword, sessionFromUser, setSessionCookie } from '@/lib/auth';
import { recordAudit } from '@/lib/auditLog';
import { rateLimit, clientIp, LIMITS } from '@/lib/rateLimit';
import { visitorIdFromCookies, linkVisitorToUser } from '@/lib/trackingRepo';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    rateLimit(`login:ip:${clientIp()}`, LIMITS.login);
    rateLimit(`login:email:${String(email || '').trim().toLowerCase()}`, LIMITS.login);
    const user = await findUserByEmail(email);
    // Same error whether the email is unknown or the password is wrong.
    if (!user || !verifyPassword(password, user.password_hash)) {
      await recordAudit({ action: 'login_failed', targetType: 'user', targetId: user?.id, detail: `email=${String(email || '').slice(0, 120)}` });
      throw new HttpError(401, { error: 'invalid_credentials' });
    }
    if (user.status === 'disabled') {
      await recordAudit({ action: 'login_blocked_disabled', targetType: 'user', targetId: user.id });
      throw new HttpError(403, { error: 'account_disabled' });
    }

    await linkVisitorToUser(visitorIdFromCookies(), user.id).catch(() => {});
    const session = sessionFromUser(user);
    const res = NextResponse.json({ user: session });
    setSessionCookie(res, session);
    return res;
  } catch (e) {
    return errResponse(e);
  }
}
