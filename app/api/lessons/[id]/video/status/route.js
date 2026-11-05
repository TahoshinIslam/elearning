import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getVideoStatus } from '@/lib/videoRepo';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    return NextResponse.json(await getVideoStatus(await requireUser(), Number(params.id)));
  } catch (e) { return errResponse(e); }
}
