import { z } from 'zod';
import { usernameSchema } from './password-validation';
export function normalizePhone(value: string): string {
  const clean = value.trim().replace(/[\s()\-]/g, '');
  if (/^05\d{8}$/.test(clean)) return `+972${clean.slice(1)}`;
  if (/^9725\d{8}$/.test(clean)) return `+${clean}`;
  return clean;
}
function profileText(maxLength: number, minLength = 1) {
  return z
    .string()
    .trim()
    .min(minLength)
    .max(maxLength)
    .regex(/^[^\p{Cc}<>]*$/u);
}

export const accountProfileSchema = z
  .object({
    username: usernameSchema,
    first_name: profileText(60),
    last_name: profileText(60),
    city: profileText(100, 2),
    age: z.coerce.number().int().min(1).max(120),
    grade: z.coerce.number().int().min(1).max(12),
    phone: z
      .string()
      .transform(normalizePhone)
      .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/)),
    locale: z.enum(['he', 'en']),
    school: profileText(120, 2),
    hobbies: z
      .array(profileText(60))
      .max(20)
      .optional()
      .default([])
      .transform((items) => [...new Set(items)]),
    custom_hobby: profileText(60, 0)
      .nullish()
      .transform((value) => value ?? ''),
  })
  .strict();

export const emailSchema = z.string().trim().email().max(254);
export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6,10}$/);
export const humanVerificationSchema = z
  .object({ token: z.string().min(1).max(2048) })
  .strict();
export const accountDeletionSchema = z
  .object({ confirmation: z.literal('DELETE') })
  .strict();
export type AccountProfile = z.infer<typeof accountProfileSchema>;
export type VerifiedIdentity = {
  id?: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  phone?: string | null;
  phone_confirmed_at?: string | null;
};

export function isAccountComplete(
  user: VerifiedIdentity,
  profile: unknown,
  expectedUserId?: string,
): boolean {
  if (expectedUserId && user.id !== expectedUserId) return false;
  const parsed = accountProfileSchema.safeParse(profile);
  // POC uses verified email. Phone is a required contact field, not claimed verified.
  return parsed.success && !!user.email && !!user.email_confirmed_at;
}

export function getAuthErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return 'unavailable';
  const status = 'status' in error ? error.status : undefined;
  const code =
    'code' in error && typeof error.code === 'string' ? error.code : '';
  if (status === 429 || code.includes('rate_limit')) return 'rate_limit';
  if (code === 'otp_expired' || code === 'otp_disabled') return 'invalid_code';
  if (code.includes('captcha')) return 'captcha';
  if (code === 'invalid_credentials' || code === 'email_not_confirmed')
    return 'invalid_credentials';
  if (code === 'weak_password') return 'weak_password';
  if (code === 'same_password') return 'same_password';
  return 'unavailable';
}

export function isPhoneVerified(
  user: VerifiedIdentity,
  phone: string,
  expectedUserId?: string,
) {
  return (
    (!expectedUserId || user.id === expectedUserId) &&
    !!user.phone_confirmed_at &&
    !!user.phone &&
    normalizePhone(user.phone) === normalizePhone(phone)
  );
}
