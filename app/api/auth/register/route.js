import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { createUser } from '@/lib/authRepo';
import { sessionFromUser, setSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Self-service signup (student / parent). Logs the new user straight in.
export async function POST(request) {
  try {
    const user = await createUser(await request.json());
    const session = sessionFromUser(user);
    const res = NextResponse.json({ user: session }, { status: 201 });
    setSessionCookie(res, session);
    return res;
  } catch (e) {
    return errResponse(e);
  }
}
