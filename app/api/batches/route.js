import { NextResponse } from 'next/server';
import { requireStaffSection } from '@/lib/auth';
import { getBatches, addBatch, setBatchCourse, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { return NextResponse.json(await getBatches()); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { await requireStaffSection('batches', 'manage'); return NextResponse.json(await addBatch(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { await requireStaffSection('batches', 'manage'); return NextResponse.json(await setBatchCourse(await request.json())); } catch (e) { return errResponse(e); }
}
