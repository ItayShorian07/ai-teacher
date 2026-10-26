import {
  accountProfileSchema,
  getAuthErrorCode,
  isPhoneVerified,
  otpSchema,
} from '@/lib/auth-validation';
import { getCurrentAccount } from '@/lib/server/account';
import {
  isValidOrigin,
  privateJsonResponse,
  readJsonBody,
} from '@/lib/server/http';
import { isAuthConfigured } from '@/lib/supabase/config';
import { z } from 'zod';
const input = z.discriminatedUnion('action', [
  z.object({ action: z.literal('send') }).strict(),
  z.object({ action: z.literal('resend') }).strict(),
  z.object({ action: z.literal('verify'), token: otpSchema }).strict(),
]);
export async function POST(request: Request) {
  if (!isValidOrigin(request))
    return privateJsonResponse({ error: 'invalid_origin' }, 403);
  if (!isAuthConfigured())
    return privateJsonResponse({ error: 'not_configured' }, 503);
  try {
    const parsed = input.safeParse(await readJsonBody(request));
    if (!parsed.success)
      return privateJsonResponse({ error: 'invalid_code' }, 400);
    const account = await getCurrentAccount();
    if (!account) return privateJsonResponse({ error: 'unauthorized' }, 401);
    if (!account.user.email_confirmed_at)
      return privateJsonResponse({ error: 'email_required' }, 403);
    const profile = accountProfileSchema.safeParse(account.profile);
    if (!profile.success)
      return privateJsonResponse({ error: 'profile_required' }, 400);
    const phone = profile.data.phone;
    if (isPhoneVerified(account.user, phone, account.user.id))
      return privateJsonResponse({ complete: true });
    const { error } =
      parsed.data.action === 'verify'
        ? await account.supabase.auth.verifyOtp({
            phone,
            token: parsed.data.token,
            type: 'phone_change',
          })
        : parsed.data.action === 'resend'
          ? await account.supabase.auth.resend({ phone, type: 'phone_change' })
          : await account.supabase.auth.updateUser({ phone });
    if (error)
      return privateJsonResponse(
        { error: getAuthErrorCode(error) },
        error.status === 429 ? 429 : 400,
      );
    if (parsed.data.action !== 'verify')
      return privateJsonResponse({ sent: true });
    // Fresh Auth state is authoritative; editable metadata never establishes verification.
    const {
      data: { user },
      error: userError,
    } = await account.supabase.auth.getUser();
    if (user && user.id !== account.user.id) {
      await account.supabase.auth.signOut({ scope: 'local' });
      return privateJsonResponse({ error: 'unauthorized' }, 401);
    }
    if (userError || !user || !isPhoneVerified(user, phone, account.user.id))
      return privateJsonResponse({ error: 'verification_incomplete' }, 400);
    return privateJsonResponse({ complete: true });
  } catch {
    return privateJsonResponse({ error: 'unavailable' }, 503);
  }
}
