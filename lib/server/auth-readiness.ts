import 'server-only';
import { z } from 'zod';
import { getSupabaseConfig, isAuthConfigured } from '../supabase/config';

const unavailableAuth = {
  configured: false,
  registration: false,
  google: false,
  password: false,
};
const settingsSchema = z.object({
  disable_signup: z.boolean().optional(),
  mailer_autoconfirm: z.boolean().optional(),
  external: z
    .object({ email: z.boolean().optional(), google: z.boolean().optional() })
    .optional(),
});

export async function getAuthReadiness() {
  if (!isAuthConfigured()) return unavailableAuth;
  const { url, key } = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceHeaders = {
    apikey: serviceKey || key,
    ...(serviceKey ? { Authorization: `Bearer ${serviceKey}` } : {}),
  };
  try {
    const [settingsResponse, profileResponse] = await Promise.all([
      fetch(`${url}/auth/v1/settings`, {
        headers: { apikey: key },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      }),
      fetch(
        `${url}/rest/v1/profiles?select=id,username,school,hobbies,custom_hobby&limit=0`,
        {
          headers: serviceHeaders,
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        },
      ),
    ]);
    const authSettings = settingsSchema.parse(await settingsResponse.json());
    const schemaError = z
      .object({ code: z.string().optional() })
      .safeParse(await profileResponse.json());
    // A denied anonymous SELECT still confirms that the profile schema exists.
    const hasProfileSchema =
      profileResponse.ok ||
      (schemaError.success && schemaError.data.code === '42501');
    const captchaConfigured = Boolean(
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
      process.env.TURNSTILE_SECRET_KEY,
    );
    const providersReady =
      settingsResponse.ok && hasProfileSchema && captchaConfigured;
    const configured = providersReady && authSettings.external?.email === true;
    let passwordEnabled = false;
    if (configured && serviceKey) {
      const lookupResponse = await fetch(
        `${url}/rest/v1/rpc/resolve_login_email`,
        {
          method: 'POST',
          headers: { ...serviceHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_username: '' }),
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        },
      );
      passwordEnabled = lookupResponse.ok;
    }
    return {
      configured,
      registration:
        configured &&
        !authSettings.disable_signup &&
        !authSettings.mailer_autoconfirm,
      google: providersReady && authSettings.external?.google === true,
      password: passwordEnabled,
    };
  } catch {
    return unavailableAuth;
  }
}
