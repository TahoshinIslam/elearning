import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getJobs, postJob, toggleJob, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try { return NextResponse.json(await getJobs(request.nextUrl.searchParams)); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { requireRole('owner','superadmin'); return NextResponse.json(await postJob(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { requireRole('owner','superadmin'); return NextResponse.json(await toggleJob(await request.json())); } catch (e) { return errResponse(e); }
}
