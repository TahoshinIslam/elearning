import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { submitForReview, approveReview, rejectReview } from '@/lib/courseReviewRepo';

export const dynamic = 'force-dynamic';

// Submitting is an owner action; approving/rejecting is superadmin-only —
// the actual "review" oversight the workflow is named for, not owner
// self-approval.
export async function POST(request, { params }) {
  try {
    const body = await request.json();
    const courseId = Number(params.id);
    if (body.action === 'submit') {
      const session = requireRole('owner', 'superadmin');
      return NextResponse.json(await submitForReview(session, courseId));
    }
    if (body.action === 'approve') {
      const session = requireRole('superadmin');
      return NextResponse.json(await approveReview(session, courseId));
    }
    if (body.action === 'reject') {
      const session = requireRole('superadmin');
      return NextResponse.json(await rejectReview(session, courseId, body.note));
    }
    return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
  } catch (e) { return errResponse(e); }
}
