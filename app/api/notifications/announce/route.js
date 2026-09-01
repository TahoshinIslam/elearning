import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { announce } from '@/lib/notifRepo';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/notifications/announce  { title, body }
// Teacher/owner → students in their tenant; superadmin → all students.
export async function POST(request) {
  try {
    const session = requireRole('teacher', 'owner', 'superadmin');
    return NextResponse.json(await announce(session, await request.json()), { status: 201 });
  } catch (e) { return errResponse(e); }
}
