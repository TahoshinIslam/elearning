import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { getMyNotifications, markRead } from '@/lib/notifRepo';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/notifications  → the signed-in user's notifications
export async function GET() {
  try {
    const session = requireUser();
    return NextResponse.json(await getMyNotifications(session.id));
  } catch (e) { return errResponse(e); }
}

// PATCH /api/notifications  { id } | { all: true }  → mark read
export async function PATCH(request) {
  try {
    const session = requireUser();
    return NextResponse.json(await markRead(session.id, await request.json()));
  } catch (e) { return errResponse(e); }
}
