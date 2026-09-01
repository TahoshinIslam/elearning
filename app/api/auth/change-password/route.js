import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { changePassword } from '@/lib/authRepo';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST { oldPassword, newPassword } → change the signed-in user's password
export async function POST(request) {
  try {
    const session = requireUser();
    const { oldPassword, newPassword } = await request.json();
    return NextResponse.json(await changePassword(session.id, oldPassword, newPassword));
  } catch (e) { return errResponse(e); }
}
