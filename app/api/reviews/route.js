import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { submitReview, getReviewsForModeration, setReviewStatus, setReviewFeatured, reviewEligibility, getMyReview } from '@/lib/reviewRepo';
import { requireUser, requireRole } from '@/lib/auth';
import { rateLimit, LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// GET ?courseId=&mine=1 → the signed-in student's own review + eligibility
// GET                   → moderation list (owner/superadmin)
export async function GET(request) {
  try {
    const sp = request.nextUrl.searchParams;
    if (sp.get('mine') === '1') {
      const session = requireUser();
      const courseId = Number(sp.get('courseId'));
      if (!session.studentId || !courseId) return NextResponse.json({ eligible: false, review: null });
      const [elig, review] = await Promise.all([reviewEligibility(session.studentId, courseId), getMyReview(session.studentId, courseId)]);
      return NextResponse.json({ ...elig, review });
    }
    requireRole('owner', 'superadmin');
    return NextResponse.json(await getReviewsForModeration());
  } catch (e) { return errResponse(e); }
}

// POST → student submits a review (becomes 'pending')
export async function POST(request) {
  try {
    const session = requireUser();
    if (!session.studentId) throw new HttpError(403, { error: 'students_only' });
    rateLimit(`review:${session.id}`, LIMITS.review);
    const body = await request.json();
    // Eligibility (verified purchase / free-course enrollment) is enforced in submitReview.
    return NextResponse.json(await submitReview(session, body), { status: 201 });
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
