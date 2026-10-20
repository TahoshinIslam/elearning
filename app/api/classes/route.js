import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { listClassLevels, createClassLevel, updateClassLevel, deleteClassLevel } from '@/lib/taxonomyRepo';

export const dynamic = 'force-dynamic';

// Public read (catalog filters); writes are owner/superadmin.
export async function GET() {
  try { return NextResponse.json(await listClassLevels()); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await createClassLevel(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await updateClassLevel(await request.json())); } catch (e) { return errResponse(e); }
}
export async function DELETE(request) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await deleteClassLevel(await request.json())); } catch (e) { return errResponse(e); }
}
