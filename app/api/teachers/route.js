import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getTeachers, addTeacher, patchTeacher, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

// Staff directory (includes phone numbers) — staff only. Public instructor
// profiles come from lib/catalogRepo.js getPublicInstructor (no contact data).
export async function GET() {
  try { requireRole('teacher', 'owner', 'superadmin'); return NextResponse.json(await getTeachers()); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { requireRole('owner','superadmin'); return NextResponse.json(await addTeacher(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { requireRole('owner','superadmin'); return NextResponse.json(await patchTeacher(await request.json())); } catch (e) { return errResponse(e); }
}
