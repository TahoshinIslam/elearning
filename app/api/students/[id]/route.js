import { NextResponse } from 'next/server';
import { requireStaffSection } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getStudentRecord } from '@/lib/studentAdminRepo';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try { await requireStaffSection('students'); return NextResponse.json(await getStudentRecord(params.id)); } catch (e) { return errResponse(e); }
}
