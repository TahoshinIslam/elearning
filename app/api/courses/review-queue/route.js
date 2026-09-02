import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getPendingReviews } from '@/lib/courseReviewRepo';

export const dynamic = 'force-dynamic';

// Superadmin's approval queue — every course an owner has submitted for review.
export async function GET() {
  try {
    requireRole('superadmin');
    return NextResponse.json(await getPendingReviews());
  } catch (e) { return errResponse(e); }
}
