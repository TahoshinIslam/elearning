import { NextResponse } from 'next/server';
import { parseBody, schemas } from '@/lib/validate';
import { errResponse } from '@/lib/repo';
import { createMessage, getMessages, markMessageRead } from '@/lib/contactRepo';
import { requireStaffSection } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST is public (anyone can send a contact message).
export async function POST(request) {
  try { return NextResponse.json(await createMessage(await parseBody(request, schemas.contact)), { status: 201 }); }
  catch (e) { return errResponse(e); }
}

// GET / PATCH are admin-only (the owner inbox).
export async function GET() {
  try { await requireStaffSection('messages', 'view'); return NextResponse.json(await getMessages()); }
  catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { await requireStaffSection('messages', 'manage'); return NextResponse.json(await markMessageRead(await request.json())); }
  catch (e) { return errResponse(e); }
}
