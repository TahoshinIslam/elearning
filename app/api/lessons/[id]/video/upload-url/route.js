import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { requestUploadUrl } from '@/lib/videoRepo';

export const dynamic = 'force-dynamic';

// Same permission level as the course builder (owner/superadmin) — matches
// how PATCH /api/courses is already guarded, so this doesn't introduce a
// new, inconsistent access tier for course content management.
export async function POST(request, { params }) {
  try {
    requireRole('owner', 'superadmin');
    const body = await request.json();
    const result = await requestUploadUrl({ lessonId: Number(params.id), fileName: body.fileName, contentType: body.contentType });
    return NextResponse.json(result);
  } catch (e) { return errResponse(e); }
}
