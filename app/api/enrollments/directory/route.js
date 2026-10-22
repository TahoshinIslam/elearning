import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getEnrollmentDirectory } from '@/lib/studentAdminRepo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await getEnrollmentDirectory()); } catch (e) { return errResponse(e); }
}
