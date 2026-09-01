import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { findUserByEmail } from '@/lib/authRepo';
import { verifyPassword, sessionFromUser, setSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const user = await findUserByEmail(email);
    // Same error whether the email is unknown or the password is wrong.
    if (!user || !verifyPassword(password, user.password_hash)) {
      throw new HttpError(401, { error: 'invalid_credentials' });
    }
    if (user.status === 'disabled') throw new HttpError(403, { error: 'account_disabled' });

    const session = sessionFromUser(user);
    const res = NextResponse.json({ user: session });
    setSessionCookie(res, session);
    return res;
  } catch (e) {
    return errResponse(e);
  }
}
