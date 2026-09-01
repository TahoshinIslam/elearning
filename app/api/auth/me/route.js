import { NextResponse } from 'next/server';
import { currentSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Returns the active session (or { user: null }) — used to hydrate the client on load.
export async function GET() {
  return NextResponse.json({ user: currentSession() });
}
