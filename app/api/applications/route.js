import { NextResponse } from 'next/server';
import { requireRole, requireUser } from '@/lib/auth';
import { getApplications, applyJob, setApplicationStatus, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try { return NextResponse.json(await getApplications(request.nextUrl.searchParams)); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { requireUser(); return NextResponse.json(await applyJob(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { requireRole('owner','superadmin'); return NextResponse.json(await setApplicationStatus(await request.json())); } catch (e) { return errResponse(e); }
}
