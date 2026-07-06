import { NextResponse } from 'next/server';
import { getStudents, addStudentOrImport, setStudentPaid, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { return NextResponse.json(await getStudents()); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { return NextResponse.json(await addStudentOrImport(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { return NextResponse.json(await setStudentPaid(await request.json())); } catch (e) { return errResponse(e); }
}
