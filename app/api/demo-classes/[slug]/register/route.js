import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { registerForDemo } from '@/lib/demoClassRepo';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/demo-classes/{slug}/register  → register the signed-in user for a free class
export async function POST(request, { params }) {
  try {
    const session = requireUser();
    return NextResponse.json(await registerForDemo(params.slug, session.id), { status: 201 });
  } catch (e) { return errResponse(e); }
}
