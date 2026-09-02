import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { errResponse, confirmThumbnail } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    requireRole('owner', 'superadmin');
    const body = await request.json();
    const result = await confirmThumbnail(Number(params.id), body.key);
    return NextResponse.json(result);
  } catch (e) { return errResponse(e); }
}
