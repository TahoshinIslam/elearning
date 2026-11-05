// Input validation at the API boundary (zod). Every route that accepts a body
// parses it here first: unknown keys are dropped, types and lengths are
// enforced, and a failure becomes a 400 with field-level issues — before any
// business logic or SQL sees the data.
import { z } from 'zod';
import { HttpError } from '@/lib/repo';

export { z };

export async function parseBody(request, schema) {
  let raw;
  try { raw = await request.json(); } catch { throw new HttpError(400, { error: 'invalid_json' }); }
  const r = schema.safeParse(raw ?? {});
  if (!r.success) {
    throw new HttpError(400, {
      error: 'invalid_input',
      issues: r.error.issues.slice(0, 10).map((i) => ({ field: i.path.join('.') || '(body)', message: i.message }))
    });
  }
  return r.data;
}

// Reusable field shapes
export const email = z.string().trim().toLowerCase().max(191).email();
export const password = z.string().min(8).max(200);
export const anyPassword = z.string().min(1).max(200);
export const name = z.string().trim().min(1).max(120);
export const phone = z.string().trim().max(32).regex(/^[+0-9 ()-]*$/, 'digits only').optional().or(z.literal(''));
export const id = z.coerce.number().int().positive();
export const code6 = z.string().trim().regex(/^\d{6}$/, '6 digits');
export const grants = z.record(z.string().max(40), z.enum(['view', 'manage'])).optional();

export const schemas = {
  login: z.object({ email, password: anyPassword }),
  register: z.object({ name, email, password, phone, referralCode: z.string().trim().max(32).optional(), role: z.literal('student').optional() }),
  otpRequest: z.object({ email, purpose: z.enum(['login', 'reset']) }),
  otpVerify: z.object({ email, code: code6, purpose: z.enum(['login', 'reset']) }),
  otpReset: z.object({ ticket: z.string().min(10).max(2000), password }),
  changePassword: z.object({ oldPassword: anyPassword, newPassword: password }),
  forgot: z.object({ email }),
  reset: z.object({ token: z.string().min(10).max(200), password }),
  createAccount: z.object({
    name, email, password, phone, role: z.enum(['student', 'teacher', 'staff', 'owner']).default('teacher'),
    grants, sections: z.array(z.string().max(40)).max(40).optional(), subject: z.string().trim().max(120).optional()
  }),
  userAction: z.object({ id, action: z.literal('revoke_sessions') }),
  userPatch: z.object({
    id,
    role: z.enum(['student', 'teacher', 'staff', 'owner', 'superadmin']).optional(),
    status: z.enum(['active', 'disabled']).optional(),
    grants, sections: z.array(z.string().max(40)).max(40).optional()
  }),
  securityBlock: z.object({
    ip: z.string().trim().max(64).optional(), email: email.optional(),
    minutes: z.coerce.number().int().min(0).max(525600).default(0), reason: z.string().trim().max(200).optional()
  }),
  securityLift: z.object({ id }),
  qaAnswer: z.object({ questionId: id, body: z.string().trim().min(1).max(4000) }),
  contact: z.object({ name, email, subject: z.string().trim().max(191).optional(), message: z.string().trim().min(1).max(5000), phone })
};
