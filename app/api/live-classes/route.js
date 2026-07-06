import { NextResponse } from 'next/server';
import { getLiveClasses, scheduleClass, updateLiveClass, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try { return NextResponse.json(await getLiveClasses(request.nextUrl.searchParams)); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { return NextResponse.json(await scheduleClass(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { return NextResponse.json(await updateLiveClass(await request.json())); } catch (e) { return errResponse(e); }
}
