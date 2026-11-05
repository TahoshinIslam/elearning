import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { getPaths, createPath, deletePath, setPathCourse } from '@/lib/pathRepo';
import { requireStaffSection } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET → public list of learning paths (with their courses)
export async function GET() {
  try { return NextResponse.json(await getPaths()); } catch (e) { return errResponse(e); }
}

// POST → create path (owner/superadmin)
export async function POST(request) {
  try { await requireStaffSection('paths', 'manage'); return NextResponse.json(await createPath(await request.json()), { status: 201 }); }
  catch (e) { return errResponse(e); }
}

// PATCH → add/remove a course on a path (owner/superadmin)
export async function PATCH(request) {
  try { await requireStaffSection('paths', 'manage'); return NextResponse.json(await setPathCourse(await request.json())); }
  catch (e) { return errResponse(e); }
}

// DELETE → remove a path (owner/superadmin)
export async function DELETE(request) {
  try { await requireStaffSection('paths', 'manage'); return NextResponse.json(await deletePath(await request.json())); }
  catch (e) { return errResponse(e); }
}
