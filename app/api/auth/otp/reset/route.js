import { NextResponse } from 'next/server';
import { parseBody, schemas } from '@/lib/validate';
import { errResponse, HttpError } from '@/lib/repo';
import { verifyToken } from '@/lib/signedUrl';
import { hashPassword } from '@/lib/auth';
import { q } from '@/lib/mysql';
import { recordAudit } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

// POST { ticket, password } → set a new password. The ticket comes from a
// verified reset code and works once: changing the password bumps
// session_version, which also signs the account out everywhere.
export async function POST(request) {
  try {
    const { ticket, password } = await parseBody(request, schemas.otpReset);
    const t = verifyToken(ticket);
    if (!t || t.op !== 'pwreset' || !t.uid) throw new HttpError(400, { error: 'reset_expired' });
    if (String(password || '').length < 8) throw new HttpError(400, { error: 'weak_password' });
    const res = await q('UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ? AND session_version = ?',
      [hashPassword(password), t.uid, Number(t.sv || 0)]);
    if (!res.affectedRows) throw new HttpError(400, { error: 'reset_expired' });
    await recordAudit({ session: { id: t.uid }, action: 'password_reset', targetType: 'user', targetId: t.uid });
    return NextResponse.json({ ok: true });
  } catch (e) { return errResponse(e); }
}
