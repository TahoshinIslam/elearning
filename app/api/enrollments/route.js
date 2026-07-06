import { NextResponse } from 'next/server';
import { getEnrollments, enroll, unenroll, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try { return NextResponse.json(await getEnrollments(request.nextUrl.searchParams)); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { return NextResponse.json(await enroll(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function DELETE(request) {
  try { return NextResponse.json(await unenroll(await request.json())); } catch (e) { return errResponse(e); }
}
