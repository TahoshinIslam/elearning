import { NextResponse } from 'next/server';
import { requireRole, requireStaffSection } from '@/lib/auth';
import { getTeachers, addTeacher, patchTeacher, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

// Staff directory (includes phone numbers) — staff only. Public instructor
// profiles come from lib/catalogRepo.js getPublicInstructor (no contact data).
export async function GET() {
  try { await requireRole('teacher', 'staff', 'owner', 'superadmin'); return NextResponse.json(await getTeachers()); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { await requireStaffSection('teachers', 'manage'); return NextResponse.json(await addTeacher(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { await requireStaffSection('teachers', 'manage'); return NextResponse.json(await patchTeacher(await request.json())); } catch (e) { return errResponse(e); }
}
