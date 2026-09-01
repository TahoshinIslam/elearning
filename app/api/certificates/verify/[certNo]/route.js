import { NextResponse } from 'next/server';
import { errResponse, getCertificateByNo } from '@/lib/repo';

export const dynamic = 'force-dynamic';

// Public certificate verification — anyone with the number can confirm validity.
export async function GET(request, { params }) {
  try {
    const cert = await getCertificateByNo(params.certNo);
    if (!cert) return NextResponse.json({ valid: false });
    return NextResponse.json({ valid: true, ...cert });
  } catch (e) { return errResponse(e); }
}
