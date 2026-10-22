import { passwordLoginSchema } from './password-validation';

// Dependency boundary keeps the credential path testable without real accounts.
export type LoginServices = {
  quota(identifier: string): Promise<boolean>;
  resolve(username: string): Promise<string | null>;
  signIn(email: string, password: string, captchaToken: string): Promise<{ ok: boolean; rateLimited?: boolean; captchaFailed?: boolean }>;
};
export async function passwordLogin(input: unknown, services: LoginServices) {
  const parsed = passwordLoginSchema.safeParse(input);
  if (!parsed.success) return { status: 400, error: 'invalid_login' };
  const { identifier, password, captchaToken } = parsed.data;
  if (!await services.quota(identifier)) return { status: 429, error: 'rate_limit' };
  const email = identifier.includes('@') ? identifier : await services.resolve(identifier);
  // Unknown handles take the same Supabase auth path and consume their CAPTCHA.
  // A reserved invalid domain cannot map to a registered, verified email address.
  const result = await services.signIn(email || 'unknown-user@invalid.invalid', password, captchaToken);
  if (result.rateLimited) return { status: 429, error: 'rate_limit' };
  if (result.captchaFailed) return { status: 400, error: 'captcha' };
  if (!email || !result.ok) return { status: 401, error: 'invalid_credentials' };
  return { status: 200, signedIn: true };
}
