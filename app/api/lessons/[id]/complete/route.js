import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { setManualCompletion } from '@/lib/videoRepo';

export const dynamic = 'force-dynamic';

// Explicit "mark as complete" for reading lessons (no watch tracking).
export async function POST(request, { params }) {
  try {
    const session = await requireUser();
    const body = await request.json();
    return NextResponse.json(await setManualCompletion(session, Number(params.id), body.completed !== false));
  } catch (e) { return errResponse(e); }
}
