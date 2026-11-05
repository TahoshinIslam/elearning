import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { postAnswer } from '@/lib/qaRepo';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/qa/answer  { questionId, body }  → answer a question (any signed-in user)
export async function POST(request) {
  try {
    const session = await requireUser();
    return NextResponse.json(await postAnswer(session, await request.json()), { status: 201 });
  } catch (e) { return errResponse(e); }
}
