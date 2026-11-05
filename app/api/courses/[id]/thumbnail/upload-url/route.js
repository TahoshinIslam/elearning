import { NextResponse } from 'next/server';
import { requireStaffSection } from '@/lib/auth';
import { errResponse, requestThumbnailUploadUrl } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    await requireStaffSection('courses', 'manage');
    const body = await request.json();
    const result = await requestThumbnailUploadUrl(Number(params.id), body);
    return NextResponse.json(result);
  } catch (e) { return errResponse(e); }
}
