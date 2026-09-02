import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { listUsers, setUserRole, setUserStatus, setUserSections, createStaff } from '@/lib/authRepo';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Unified user/role management (owner/superadmin).
export async function GET() {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await listUsers()); }
  catch (e) { return errResponse(e); }
}

// POST { name, email, password, sections[] } → create a teacher (staff) account
export async function POST(request) {
  try {
    requireRole('owner', 'superadmin');
    return NextResponse.json(await createStaff(await request.json()), { status: 201 });
  } catch (e) { return errResponse(e); }
}

// PATCH { id, role } | { id, status } | { id, sections[] }
export async function PATCH(request) {
  try {
    const session = requireRole('owner', 'superadmin');
    const body = await request.json();
    if (body.sections !== undefined) return NextResponse.json(await setUserSections(body));
    if (body.status !== undefined) return NextResponse.json(await setUserStatus(session, body));
    return NextResponse.json(await setUserRole(session, body));
  } catch (e) { return errResponse(e); }
}
