import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { errResponse, HttpError } from '@/lib/repo';
import { securityOverview, manualBlock, liftBlock } from '@/lib/shield';
import { q } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

const IP_RE = /^(?:\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]{2,39}$/i;

// Owner / superadmin only — never grantable.
export async function GET() {
  try { await requireRole('owner', 'superadmin'); return NextResponse.json(await securityOverview()); }
  catch (e) { return errResponse(e); }
}

// POST { ip | email, minutes (0 = until lifted), reason } → block
export async function POST(request) {
  try {
    const session = await requireRole('owner', 'superadmin');
    const b = await request.json();
    const ip = b.ip ? String(b.ip).trim() : null;
    if (ip && !IP_RE.test(ip)) throw new HttpError(400, { error: 'invalid_ip' });
    let userId = null;
    if (b.email) {
      const [u] = await q('SELECT id, role FROM users WHERE email = ? LIMIT 1', [String(b.email).trim().toLowerCase()]);
      if (!u) throw new HttpError(404, { error: 'user_not_found' });
      if (u.id === session.id) throw new HttpError(400, { error: 'cannot_block_self' });
      if (u.role === 'superadmin' && session.role !== 'superadmin') throw new HttpError(403, { error: 'forbidden' });
      userId = u.id;
    }
    if (!ip && !userId) throw new HttpError(400, { error: 'target_required' });
    const minutes = Math.max(0, Math.min(60 * 24 * 365, Math.round(Number(b.minutes) || 0)));
    await manualBlock({ ip, userId, minutes: minutes || null, reason: String(b.reason || 'manual block').slice(0, 200), by: session.id });
    return NextResponse.json(await securityOverview(), { status: 201 });
  } catch (e) { return errResponse(e); }
}

// DELETE { id } → lift a block
export async function DELETE(request) {
  try {
    const session = await requireRole('owner', 'superadmin');
    const { id } = await request.json();
    if (!(await liftBlock(Number(id), session.id))) throw new HttpError(404, { error: 'not_found' });
    return NextResponse.json(await securityOverview());
  } catch (e) { return errResponse(e); }
}
