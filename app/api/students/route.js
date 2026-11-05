import { NextResponse } from 'next/server';
import { requireStaffSection } from '@/lib/auth';
import { getStudents, addStudentOrImport, setStudentPaid, errResponse } from '@/lib/repo';
import { getStudentDirectory } from '@/lib/studentAdminRepo';

export const dynamic = 'force-dynamic';

// Student roster (names, phones, fee status) — staff with the 'students'
// section only. This used to be readable by anyone, signed in or not.
export async function GET(request) {
  try {
    await requireStaffSection('students');
    if (request.nextUrl.searchParams.get('view') === 'directory') return NextResponse.json(await getStudentDirectory());
    return NextResponse.json(await getStudents());
  } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { await requireStaffSection('students', 'manage'); return NextResponse.json(await addStudentOrImport(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { await requireStaffSection('students', 'manage'); return NextResponse.json(await setStudentPaid(await request.json())); } catch (e) { return errResponse(e); }
}
