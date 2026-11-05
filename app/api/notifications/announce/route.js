import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { announce } from '@/lib/notifRepo';
import { requireStaffSection } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/notifications/announce  { title, body }
// Staff with the announce:manage grant (owner/superadmin always) → students.
export async function POST(request) {
  try {
    const session = await requireStaffSection('announce', 'manage');
    return NextResponse.json(await announce(session, await request.json()), { status: 201 });
  } catch (e) { return errResponse(e); }
}
