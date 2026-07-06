import { NextResponse } from 'next/server';
import { getCourses, addCourse, courseOp, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { return NextResponse.json(await getCourses()); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { return NextResponse.json(await addCourse(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { return NextResponse.json(await courseOp(await request.json())); } catch (e) { return errResponse(e); }
}
