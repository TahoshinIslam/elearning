import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { getCategories, createCategory, deleteCategory } from '@/lib/categoryRepo';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET is public (used by the course builder + marketplace); writes are admin-only.
export async function GET() {
  try { return NextResponse.json(await getCategories()); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await createCategory(await request.json()), { status: 201 }); }
  catch (e) { return errResponse(e); }
}
export async function DELETE(request) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await deleteCategory(await request.json())); }
  catch (e) { return errResponse(e); }
}
