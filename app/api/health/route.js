import { NextResponse } from 'next/server';
import { checkDb } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

// Liveness/readiness probe for the hosting platform and uptime monitoring.
// Intentionally returns no internal error detail — see lib/mysql.js checkDb()
// for the logged detail server-side.
export async function GET() {
  const db = await checkDb().catch(() => ({ ok: false }));
  return NextResponse.json(
    { ok: db.ok, service: 'leo-learning', time: new Date().toISOString(), db: db.ok ? 'up' : 'down' },
    { status: db.ok ? 200 : 503 }
  );
}
