import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { createMessage, getMessages, markMessageRead } from '@/lib/contactRepo';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST is public (anyone can send a contact message).
export async function POST(request) {
  try { return NextResponse.json(await createMessage(await request.json()), { status: 201 }); }
  catch (e) { return errResponse(e); }
}

// GET / PATCH are admin-only (the owner inbox).
export async function GET() {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await getMessages()); }
  catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await markMessageRead(await request.json())); }
  catch (e) { return errResponse(e); }
}
