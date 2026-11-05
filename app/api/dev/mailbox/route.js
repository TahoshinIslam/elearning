import { NextResponse } from 'next/server';
import { listDemoMail, demoMailEnabled } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

// DEMO ONLY — the outbox shown at /dev/mailbox. 404 when demo mail is off.
export async function GET(request) {
  if (!demoMailEnabled()) return new NextResponse('Not found', { status: 404 });
  const to = request.nextUrl.searchParams.get('to') || undefined;
  return NextResponse.json(await listDemoMail({ to, limit: 30 }));
}
