import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { currentSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Returns the active session (or { user: null }) — used to hydrate the client on load.
export async function GET() {
  try { return NextResponse.json({ user: await currentSession() }); }
  catch (e) { return errResponse(e); }
}
