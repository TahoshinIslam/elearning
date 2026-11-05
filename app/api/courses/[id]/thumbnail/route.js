import { NextResponse } from 'next/server';
import { requireStaffSection } from '@/lib/auth';
import { errResponse, confirmThumbnail } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function POST(request, props) {
  const params = await props.params;
  try {
    await requireStaffSection('courses', 'manage');
    const body = await request.json();
    const result = await confirmThumbnail(Number(params.id), body.key);
    return NextResponse.json(result);
  } catch (e) { return errResponse(e); }
}
