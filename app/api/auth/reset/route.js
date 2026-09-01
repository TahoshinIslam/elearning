import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { resetPasswordWithToken } from '@/lib/authRepo';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { token, password } = await request.json();
    await resetPasswordWithToken(token, password);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errResponse(e);
  }
}
