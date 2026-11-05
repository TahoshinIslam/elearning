import { NextResponse } from 'next/server';
import { parseBody, schemas } from '@/lib/validate';
import { errResponse } from '@/lib/repo';
import { postAnswer } from '@/lib/qaRepo';
import { requireUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// POST /api/qa/answer  { questionId, body } → answer a question (anyone who can open the lesson)
export async function POST(request) {
  try {
    const session = await requireUser();
    rateLimit(`qa:${session.id}`, { limit: 30, windowMs: 10 * 60_000 });
    return NextResponse.json(await postAnswer(session, await parseBody(request, schemas.qaAnswer)), { status: 201 });
  } catch (e) { return errResponse(e); }
}
