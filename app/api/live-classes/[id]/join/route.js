import { NextResponse } from 'next/server';
import { joinLiveClass, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

// GET /api/live-classes/{id}/join?studentId=1  → server access check → { url } or error
export async function GET(request, { params }) {
  try {
    const data = await joinLiveClass(Number(params.id), Number(request.nextUrl.searchParams.get('studentId')));
    return NextResponse.json(data);
  } catch (e) { return errResponse(e); }
}
