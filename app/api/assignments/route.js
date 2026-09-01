import { NextResponse } from 'next/server';
import { createAssignment, errResponse } from '@/lib/repo';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/assignments  { moduleId, title }  → add an assignment lesson (teacher/owner)
export async function POST(request) {
  try {
    requireRole('teacher', 'owner', 'superadmin');
    return NextResponse.json(await createAssignment(await request.json()), { status: 201 });
  } catch (e) { return errResponse(e); }
}
