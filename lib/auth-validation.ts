import { z } from 'zod';
import { usernameSchema } from './password-validation';
export function normalizePhone(value: string): string {
  const clean = value.trim().replace(/[\s()\-]/g, '');
  if (/^05\d{8}$/.test(clean)) return `+972${clean.slice(1)}`;
  if (/^9725\d{8}$/.test(clean)) return `+${clean}`;
  return clean;
}
const name = z.string().trim().min(1).max(60).regex(/^[^\p{Cc}<>]+$/u);
const hobbyItem = z.string().trim().min(1).max(60).regex(/^[^\p{Cc}<>]+$/u);

export const profileSchema = z.object({
  username: usernameSchema,
  first_name: name,
  last_name: name,
  city: z.string().trim().min(2).max(100).regex(/^[^\p{Cc}<>]+$/u),
  age: z.coerce.number().int().min(1).max(120),
  phone: z.string().transform(normalizePhone).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/)),
  locale: z.enum(['he', 'en']),
  school: z.string().trim().min(2).max(120).regex(/^[^\p{Cc}<>]+$/u),
  hobbies: z.array(hobbyItem).max(20).optional().default([]).transform(items => [...new Set(items)]),
  custom_hobby: z.string().trim().max(60).regex(/^[^\p{Cc}<>]*$/u).nullish().transform(value=>value??''),
}).strict();

export const emailSchema = z.string().trim().email().max(254);
export const otpSchema = z.string().trim().regex(/^\d{6,10}$/);
export type AccountProfile = z.infer<typeof profileSchema>;
export type VerifiedIdentity = { id?: string; email?: string | null; email_confirmed_at?: string | null; phone?: string | null; phone_confirmed_at?: string | null };

export function accountComplete(user: VerifiedIdentity, profile: unknown, expectedUserId?: string): boolean {
  if (expectedUserId && user.id !== expectedUserId) return false;
  const parsed = profileSchema.safeParse(profile);
  // POC uses verified email. Phone is a required contact field, not claimed verified.
  return parsed.success && !!user.email && !!user.email_confirmed_at;
}

export function authErrorCode(error: unknown): string {
  const e = error as { status?: number; code?: string };
  if (e?.status === 429 || e?.code?.includes('rate_limit')) return 'rate_limit';
  if (e?.code === 'otp_expired' || e?.code === 'otp_disabled') return 'invalid_code';
  if (e?.code?.includes('captcha')) return 'captcha';
  if (e?.code === 'invalid_credentials' || e?.code === 'email_not_confirmed') return 'invalid_credentials';
  if (e?.code === 'weak_password') return 'weak_password';
  if (e?.code === 'same_password') return 'same_password';
  return 'unavailable';
}

export function phoneVerified(user:VerifiedIdentity,phone:string,expectedUserId?:string){
 return (!expectedUserId||user.id===expectedUserId)&&!!user.phone_confirmed_at&&!!user.phone&&normalizePhone(user.phone)===normalizePhone(phone);
}
