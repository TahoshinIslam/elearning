import { NextResponse } from 'next/server';
import { requireStaffSection } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getEnrollmentDirectory } from '@/lib/studentAdminRepo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await requireStaffSection('enroll', 'view'); return NextResponse.json(await getEnrollmentDirectory()); } catch (e) { return errResponse(e); }
}
