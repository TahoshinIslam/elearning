// ============================================================
// DEVELOPMENT FIXTURE — local stand-in for bKash's servers.
//
// Enabled only when BKASH_SIMULATOR=true AND NODE_ENV !== 'production'
// (lib/bkash.js simulatorEnabled). It implements the same four Tokenized
// Checkout endpoints the real adapter calls, plus a hosted "payment page"
// (/dev/bkash/pay) where the developer chooses pay / cancel / fail. A
// payment is only `Completed` after the hosted-page "pay" step AND the
// merchant server's execute call — so a forged `status=success` callback
// is rejected here exactly as bKash would reject it. State is in memory and
// disappears on restart. Nothing here is reachable in production.
// ============================================================
import { randomBytes } from 'node:crypto';

const g = globalThis;
if (!g.__LEO_BKASH_SIM__) g.__LEO_BKASH_SIM__ = new Map();
const payments = g.__LEO_BKASH_SIM__;
const TOKEN = 'sim-token';

const ok = (body) => ({ statusCode: '0000', statusMessage: 'Successful', ...body });
const err = (code, message) => ({ statusCode: code, statusMessage: message });

export function simGrant(headers, body) {
  if (headers.get('username') !== 'simulator' || body?.app_key !== 'simulator') return err('2001', 'Invalid App Key');
  return ok({ id_token: TOKEN, token_type: 'Bearer', expires_in: 3600, refresh_token: 'sim-refresh' });
}

function authorized(headers) {
  return headers.get('authorization') === TOKEN && headers.get('x-app-key') === 'simulator';
}

export function simCreate(headers, body, appBase) {
  if (!authorized(headers)) return err('2079', 'Invalid access token');
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount <= 0 || !body?.callbackURL) return err('2065', 'Mandatory field missing');
  const paymentID = `SIM${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString('hex').toUpperCase()}`;
  payments.set(paymentID, {
    paymentID, amount: amount.toFixed(2), currency: body.currency || 'BDT', intent: body.intent || 'sale',
    merchantInvoiceNumber: body.merchantInvoiceNumber, callbackURL: body.callbackURL,
    status: 'Initiated', trxID: null, createdAt: Date.now()
  });
  return ok({
    paymentID, bkashURL: `${appBase}/dev/bkash/pay?paymentID=${paymentID}`,
    callbackURL: body.callbackURL, amount: amount.toFixed(2), intent: 'sale', currency: 'BDT',
    transactionStatus: 'Initiated', merchantInvoiceNumber: body.merchantInvoiceNumber
  });
}

const view = (p) => ({
  paymentID: p.paymentID, trxID: p.trxID, transactionStatus: p.status, amount: p.amount, currency: p.currency,
  intent: p.intent, merchantInvoiceNumber: p.merchantInvoiceNumber
});

export function simExecute(headers, body) {
  if (!authorized(headers)) return err('2079', 'Invalid access token');
  const p = payments.get(body?.paymentID);
  if (!p) return err('2023', 'Invalid Payment ID');
  if (p.status === 'Completed') return err('2062', 'The payment has already been completed');
  if (p.status !== 'Authorized') return err('2056', 'Invalid Payment State');
  p.status = 'Completed';
  p.trxID = `SIMTRX${randomBytes(4).toString('hex').toUpperCase()}`;
  return ok({ ...view(p), paymentExecuteTime: new Date().toISOString(), customerMsisdn: '01XXXXXXXXX' });
}

export function simStatus(headers, body) {
  if (!authorized(headers)) return err('2079', 'Invalid access token');
  const p = payments.get(body?.paymentID);
  if (!p) return err('2023', 'Invalid Payment ID');
  return ok(view(p));
}

export function simGetPayment(paymentID) {
  const p = payments.get(paymentID);
  return p ? { ...view(p), callbackURL: p.callbackURL } : null;
}

// Hosted-page decision → the callback URL bKash would redirect to.
export function simDecide(paymentID, action) {
  const p = payments.get(paymentID);
  if (!p) return null;
  if (p.status === 'Initiated') {
    p.status = action === 'pay' ? 'Authorized' : action === 'cancel' ? 'Cancelled' : 'Failed';
  }
  const status = action === 'pay' ? 'success' : action === 'cancel' ? 'cancel' : 'failure';
  const u = new URL(p.callbackURL);
  u.searchParams.set('paymentID', paymentID);
  u.searchParams.set('status', status);
  u.searchParams.set('apiVersion', '1.2.0-beta');
  return u.toString();
}
