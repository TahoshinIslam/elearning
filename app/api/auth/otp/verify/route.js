import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { verifyOtp } from '@/lib/otpRepo';
import { sessionFromUser, setSessionCookie } from '@/lib/auth';
import { signToken } from '@/lib/signedUrl';
import { recordAudit } from '@/lib/auditLog';
import { rateLimit, clientIp, LIMITS } from '@/lib/rateLimit';
import { visitorIdFromCookies, linkVisitorToUser } from '@/lib/trackingRepo';

export const dynamic = 'force-dynamic';

// POST { email, code, purpose }
//  login → signs the user in (session cookie)
//  reset → returns a 10-minute single-purpose ticket for /api/auth/otp/reset
export async function POST(request) {
  try {
    const { email, code, purpose } = await request.json();
    rateLimit(`otpv:ip:${clientIp()}`, LIMITS.login);
    const user = await verifyOtp(email, purpose === 'reset' ? 'reset' : 'login', code);
    if (purpose === 'reset') {
      return NextResponse.json({ ok: true, ticket: signToken({ op: 'pwreset', uid: user.id, sv: Number(user.session_version || 0) }, 600) });
    }
    await linkVisitorToUser(visitorIdFromCookies(), user.id).catch(() => {});
    await recordAudit({ session: { id: user.id, role: user.role }, action: 'login_otp', targetType: 'user', targetId: user.id });
    const session = sessionFromUser(user);
    const res = NextResponse.json({ user: session });
    setSessionCookie(res, session);
    return res;
  } catch (e) { return errResponse(e); }
}
