import { NextResponse } from 'next/server';
import { parseBody, schemas } from '@/lib/validate';
import { errResponse } from '@/lib/repo';
import { resetPasswordWithToken } from '@/lib/authRepo';
import { rateLimit, clientIp, LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    rateLimit(`reset:${(await clientIp())}`, LIMITS.reset);
    const { token, password } = await parseBody(request, schemas.reset);
    await resetPasswordWithToken(token, password);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errResponse(e);
  }
}
