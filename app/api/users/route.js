import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { listUsers, setUserRole, setUserStatus, setUserSections, createAccount } from '@/lib/authRepo';
import { requireRole, revokeSessions } from '@/lib/auth';
import { recordAudit } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

// Account & access management — owner/superadmin only (never grantable, so
// nobody can hand themselves more access).
export async function GET() {
  try { await requireRole('owner', 'superadmin'); return NextResponse.json(await listUsers()); }
  catch (e) { return errResponse(e); }
}

// POST { name, email, password, role, grants{section:level} } → create an account
// POST { id, action: 'revoke_sessions' } → sign that user out everywhere
export async function POST(request) {
  try {
    const session = await requireRole('owner', 'superadmin');
    const body = await request.json();
    if (body.action === 'revoke_sessions') {
      const id = Number(body.id);
      if (!id) throw new HttpError(400, { error: 'id_required' });
      await revokeSessions(id);
      await recordAudit({ session, action: 'sessions_revoked', targetType: 'user', targetId: id });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json(await createAccount(session, body), { status: 201 });
  } catch (e) { return errResponse(e); }
}

// PATCH { id, role } | { id, status } | { id, grants } | { id, sections[] }
export async function PATCH(request) {
  try {
    const session = await requireRole('owner', 'superadmin');
    const body = await request.json();
    if (body.grants !== undefined || body.sections !== undefined) return NextResponse.json(await setUserSections(session, body));
    if (body.status !== undefined) return NextResponse.json(await setUserStatus(session, body));
    return NextResponse.json(await setUserRole(session, body));
  } catch (e) { return errResponse(e); }
}
