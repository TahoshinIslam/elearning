import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// POST /api/log — error boundaries report what the visitor saw (digest, page,
// short message) so production crashes show up in the server logs. Bounded
// and rate-limited; never echoes anything back.
export async function POST(request) {
  try {
    rateLimit(`clientlog:${(await clientIp())}`, { limit: 20, windowMs: 10 * 60_000 });
    const b = await request.json().catch(() => ({}));
    logger.error('client_error', {
      kind: String(b.kind || 'boundary').slice(0, 20),
      digest: String(b.digest || '').slice(0, 64),
      path: String(b.path || '').slice(0, 200),
      message: String(b.message || '').slice(0, 300),
      ua: String(request.headers.get('user-agent') || '').slice(0, 160)
    });
  } catch { /* rate limited or malformed: ignore */ }
  return new NextResponse(null, { status: 204 });
}
