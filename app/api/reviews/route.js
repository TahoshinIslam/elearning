import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { submitReview, getReviewsForModeration, setReviewStatus, setReviewFeatured } from '@/lib/reviewRepo';
import { requireUser, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET  → moderation list (owner/superadmin)
export async function GET() {
  try {
    requireRole('owner', 'superadmin');
    return NextResponse.json(await getReviewsForModeration());
  } catch (e) { return errResponse(e); }
}

// POST → student submits a review (becomes 'pending')
export async function POST(request) {
  try {
    const session = requireUser();
    if (!session.studentId && session.role !== 'student') throw new HttpError(403, { error: 'students_only' });
    return NextResponse.json(await submitReview(session, await request.json()), { status: 201 });
  } catch (e) { return errResponse(e); }
}

// PATCH → moderate: { id, status } or { id, featured } (owner/superadmin)
export async function PATCH(request) {
  try {
    requireRole('owner', 'superadmin');
    const body = await request.json();
    if (body.featured !== undefined) return NextResponse.json(await setReviewFeatured(body));
    return NextResponse.json(await setReviewStatus(body));
  } catch (e) { return errResponse(e); }
}
