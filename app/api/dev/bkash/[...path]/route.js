import { NextResponse } from 'next/server';
import { simulatorEnabled } from '@/lib/bkash';
import { simGrant, simCreate, simExecute, simStatus, simDecide } from '@/lib/bkashSimulator';

export const dynamic = 'force-dynamic';

// DEVELOPMENT ONLY — see lib/bkashSimulator.js. 404 unless the simulator is
// explicitly enabled outside production.
export async function POST(request, { params }) {
  if (!simulatorEnabled()) return new NextResponse('Not found', { status: 404 });
  const path = (params.path || []).join('/');
  const body = await request.json().catch(() => ({}));
  const appBase = (process.env.APP_BASE_URL || request.nextUrl.origin).replace(/\/$/, '');
  const h = request.headers;
  switch (path) {
    case 'tokenized/checkout/token/grant': return NextResponse.json(simGrant(h, body));
    case 'tokenized/checkout/create': return NextResponse.json(simCreate(h, body, appBase));
    case 'tokenized/checkout/execute': return NextResponse.json(simExecute(h, body));
    case 'tokenized/checkout/payment/status': return NextResponse.json(simStatus(h, body));
    case 'hosted/decide': {
      const redirect = simDecide(String(body.paymentID || ''), body.action);
      return redirect ? NextResponse.json({ redirect }) : NextResponse.json({ error: 'unknown_payment' }, { status: 404 });
    }
    default: return NextResponse.json({ statusCode: '9999', statusMessage: 'Unknown simulator path' }, { status: 404 });
  }
}
