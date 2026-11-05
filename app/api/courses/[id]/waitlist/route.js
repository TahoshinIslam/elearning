import { NextResponse } from 'next/server';
import { currentSession, requireStaffSection } from '@/lib/auth';
import { errResponse, HttpError } from '@/lib/repo';
import { q } from '@/lib/mysql';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// Real opt-in "Notify me" for an announced upcoming course.
export async function POST(request, { params }) {
  try {
    const session = await currentSession();
    rateLimit(`waitlist:${session?.id || clientIp()}`, { limit: 10, windowMs: 60 * 60_000 });
    const courseId = Number(params.id);
    const [course] = await q('SELECT id FROM courses WHERE id = ? AND published = 0 AND is_upcoming = 1', [courseId]);
    if (!course) throw new HttpError(404, { error: 'not_upcoming' });
    const body = await request.json().catch(() => ({}));
    const email = String(session?.email || body.email || '').trim().toLowerCase().slice(0, 191);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, { error: 'invalid_email' });
    await q('INSERT IGNORE INTO course_waitlist (course_id, email, user_id) VALUES (?,?,?)', [courseId, email, session?.id ?? null]);
    return NextResponse.json({ ok: true });
  } catch (e) { return errResponse(e); }
}

// Staff: the waitlist for a course.
export async function GET(request, { params }) {
  try {
    await requireStaffSection('courses', 'view');
    return NextResponse.json(await q('SELECT email, created_at AS createdAt FROM course_waitlist WHERE course_id = ? ORDER BY id DESC', [Number(params.id)]));
  } catch (e) { return errResponse(e); }
}
