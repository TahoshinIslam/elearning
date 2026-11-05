import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { getWishlist, addWishlist, removeWishlist } from '@/lib/wishlistRepo';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// The student is always taken from the session. Returns an array of course ids.
async function studentId() {
  const session = await requireUser();
  if (!session.studentId) throw new HttpError(403, { error: 'not_a_student' });
  return session.studentId;
}

export async function GET() {
  try { return NextResponse.json(await getWishlist(await studentId())); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try {
    const { courseId } = await request.json();
    return NextResponse.json(await addWishlist(await studentId(), courseId), { status: 201 });
  } catch (e) { return errResponse(e); }
}
export async function DELETE(request) {
  try {
    const { courseId } = await request.json();
    return NextResponse.json(await removeWishlist(await studentId(), courseId));
  } catch (e) { return errResponse(e); }
}
