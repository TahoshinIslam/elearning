import { NextResponse } from 'next/server';
import { getCertificates, issueCertificate, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try { return NextResponse.json(await getCertificates(request.nextUrl.searchParams)); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { return NextResponse.json(await issueCertificate(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
