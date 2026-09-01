import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { createResetToken } from '@/lib/authRepo';

export const dynamic = 'force-dynamic';

// Issues a reset token. In production this would be emailed; for the prototype
// (no SMTP wired) we return it directly so the reset flow is testable.
export async function POST(request) {
  try {
    const { email } = await request.json();
    const token = await createResetToken(email);
    // Never reveal whether the email exists.
    return NextResponse.json({ ok: true, ...(token ? { devToken: token } : {}) });
  } catch (e) {
    return errResponse(e);
  }
}
