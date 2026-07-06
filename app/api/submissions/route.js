import { NextResponse } from 'next/server';
import { getSubmissions, submitAssignment, gradeSubmission, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try { return NextResponse.json(await getSubmissions(request.nextUrl.searchParams)); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { return NextResponse.json(await submitAssignment(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { return NextResponse.json(await gradeSubmission(await request.json())); } catch (e) { return errResponse(e); }
}
