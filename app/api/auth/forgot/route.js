import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { createResetToken } from '@/lib/authRepo';
import { rateLimit, clientIp, LIMITS } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Issues a password-reset token. The response is identical whether or not
// the email exists, and NEVER contains the token in production — returning
// it to the caller let anyone reset anyone's password.
//
// Delivery: no email provider is configured in this codebase yet. Until one
// is wired (see .env.example EMAIL_*), production users can't receive the
// link. In development only, set AUTH_DEV_RESET_LINKS=true to have the
// link returned for local testing.
export async function POST(request) {
  try {
    const { email } = await request.json();
    rateLimit(`forgot:${(await clientIp())}`, LIMITS.forgot);
    const token = await createResetToken(email);
    const devLinks = process.env.NODE_ENV !== 'production' && process.env.AUTH_DEV_RESET_LINKS === 'true';
    if (token) logger.info('password_reset_requested', { delivered: false, reason: 'email_provider_not_configured' });
    return NextResponse.json({ ok: true, ...(devLinks && token ? { devToken: token } : {}) });
  } catch (e) {
    return errResponse(e);
  }
}
