import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { requestOtp } from '@/lib/otpRepo';
import { rateLimit, clientIp, LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// POST { email, purpose: 'login' | 'reset' } → emails a 6-digit code.
// The response is the same whether or not the email has an account.
export async function POST(request) {
  try {
    const { email, purpose } = await request.json();
    rateLimit(`otp:ip:${clientIp()}`, LIMITS.forgot);
    return NextResponse.json(await requestOtp(email, purpose));
  } catch (e) { return errResponse(e); }
}
