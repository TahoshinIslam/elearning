import { NextResponse } from 'next/server';
import { requireStaffSection, scopeToCaller } from '@/lib/auth';
import { getAttendance, saveAttendance, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

// Own records for a student; staff need the 'attendance' section.
export async function GET(request) {
  try { const { sp } = await scopeToCaller(request.nextUrl.searchParams, 'attendance'); return NextResponse.json(await getAttendance(sp)); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { await requireStaffSection('attendance', 'manage'); return NextResponse.json(await saveAttendance(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
