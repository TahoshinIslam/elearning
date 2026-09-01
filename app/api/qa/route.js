import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { getThread, askQuestion } from '@/lib/qaRepo';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/qa?lessonId=  → the lesson's Q&A thread (public read)
export async function GET(request) {
  try {
    const lessonId = Number(request.nextUrl.searchParams.get('lessonId'));
    if (!lessonId) throw new HttpError(400, { error: 'lessonId_required' });
    return NextResponse.json(await getThread(lessonId));
  } catch (e) { return errResponse(e); }
}

// POST /api/qa  { lessonId, body }  → ask a question (any signed-in user)
export async function POST(request) {
  try {
    const session = requireUser();
    return NextResponse.json(await askQuestion(session, await request.json()), { status: 201 });
  } catch (e) { return errResponse(e); }
}
