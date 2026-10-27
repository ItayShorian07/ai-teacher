import { passwordLogin } from '@/lib/password-login';
import {
  isValidOrigin,
  privateJsonResponse,
  readJsonBody,
} from '@/lib/server/http';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { isAuthConfigured } from '@/lib/supabase/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!isValidOrigin(request))
    return privateJsonResponse({ error: 'invalid_origin' }, 403);
  if (
    !isAuthConfigured() ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    !process.env.TURNSTILE_SECRET_KEY
  ) {
    return privateJsonResponse({ error: 'not_configured' }, 503);
  }
  try {
    const input = await readJsonBody(request);
    const admin = createAdminSupabaseClient();
    const supabase = await createServerSupabaseClient();
    const hash = (value: string) =>
      createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!)
        .update(`password-login:${value}`)
        .digest('hex');
    const result = await passwordLogin(input, {
      async quota(identifier) {
        // Only trust Vercel's overwritten client-IP header on Vercel. Other hosts
        // share a conservative bucket until their proxy is explicitly configured.
        const candidate =
          process.env.VERCEL === '1'
            ? request.headers.get('x-vercel-forwarded-for')?.trim()
            : '';
        const network = candidate && isIP(candidate) ? candidate : 'shared';
        for (const [scope, value] of [
          ['network', network],
          ['identifier', identifier],
        ]) {
          const { data, error } = await admin.rpc(
            'consume_password_login_limit',
            { p_key: hash(`${scope}:${value}`), p_scope: scope },
          );
          if (error || typeof data !== 'boolean')
            throw new Error('quota_unavailable');
          if (!data) return false;
        }
        return true;
      },
      async resolve(username) {
        const { data, error } = await admin.rpc('resolve_login_email', {
          p_username: username,
        });
        if (error || (data !== null && typeof data !== 'string'))
          throw new Error('lookup_unavailable');
        return data;
      },
      async signIn(email, password, captchaToken) {
        // Supabase verifies this single-use token once. Do not pre-verify it.
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: { captchaToken },
        });
        return {
          ok: !error && !!data.user && !!data.session,
          rateLimited:
            error?.status === 429 || error?.code?.includes('rate_limit'),
          captchaFailed: error?.code?.includes('captcha'),
        };
      },
    });
    const response = privateJsonResponse(
      result.status === 200 ? { signedIn: true } : { error: result.error },
      result.status,
    );
    if (result.status === 429) response.headers.set('Retry-After', '900');
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'BODY_TOO_LARGE')
      return privateJsonResponse({ error: 'request_too_large' }, 413);
    if (error instanceof SyntaxError)
      return privateJsonResponse({ error: 'invalid_login' }, 400);
    return privateJsonResponse({ error: 'unavailable' }, 503);
  }
}
