import { z } from 'zod';

export const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{2,29}$/);
// Do not trim, normalize or truncate passwords. Supabase owns password hashing.
export const newPasswordSchema = z.string().min(12).max(128).refine(value => /\S/.test(value));
export const loginPasswordSchema = z.string().min(1).max(128);
export const identifierSchema = z.string().trim().max(254).transform(value => value.toLowerCase())
  .pipe(z.union([z.email(), usernameSchema]));
export const passwordLoginSchema = z.object({
  identifier: identifierSchema,
  password: loginPasswordSchema,
  captchaToken: z.string().min(1).max(2048),
}).strict();
