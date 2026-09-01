import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { getDemoClasses } from '@/lib/demoClassRepo';

export const dynamic = 'force-dynamic';

// GET /api/demo-classes?status=upcoming|recorded  → public list
export async function GET(request) {
  try {
    const status = request.nextUrl.searchParams.get('status') || undefined;
    return NextResponse.json(await getDemoClasses(status));
  } catch (e) { return errResponse(e); }
}
