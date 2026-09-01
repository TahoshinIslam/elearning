import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getCertificates, issueCertificate, errResponse, HttpError } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try { return NextResponse.json(await getCertificates(request.nextUrl.searchParams)); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try {
    const session = requireUser();
    const body = await request.json();
    // A student may only issue their OWN certificate; staff may issue for anyone.
    if (session.role === 'student') {
      if (!session.studentId) throw new HttpError(403, { error: 'not_a_student' });
      body.studentId = session.studentId;
      body.studentName = session.name;
    } else if (!['teacher', 'owner', 'superadmin'].includes(session.role)) {
      throw new HttpError(403, { error: 'forbidden' });
    }
    // The completion-threshold check inside issueCertificate is authoritative.
    return NextResponse.json(await issueCertificate(body), { status: 201 });
  } catch (e) { return errResponse(e); }
}
