import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { createUser } from '@/lib/authRepo';
import { sessionFromUser, setSessionCookie } from '@/lib/auth';
import { visitorIdFromCookies, linkVisitorToUser } from '@/lib/trackingRepo';
import { rateLimit, clientIp, LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// Self-service signup (student / parent). Logs the new user straight in.
export async function POST(request) {
  try {
    rateLimit(`register:${clientIp()}`, LIMITS.register);
    const user = await createUser(await request.json());
    // credit the sign-up to the ad / source that brought this visitor
    await linkVisitorToUser(visitorIdFromCookies(), user.id, { signup: true }).catch(() => {});
    const session = sessionFromUser(user);
    const res = NextResponse.json({ user: session }, { status: 201 });
    setSessionCookie(res, session);
    return res;
  } catch (e) {
    return errResponse(e);
  }
}
