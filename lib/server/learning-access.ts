import { cookies } from 'next/headers';
import 'server-only';
import { isAccountComplete } from '../auth-validation';
import { verifyHumanVerificationToken } from '../human-verification-token';
import { createAdminSupabaseClient } from '../supabase/admin';
import { getCurrentAccount } from './account';
export class LearningError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export const isCaptchaConfigured = () =>
  !!(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
    process.env.TURNSTILE_SECRET_KEY
  );
export async function hasHumanVerification(userId: string) {
  return verifyHumanVerificationToken(
    (await cookies()).get('limud-human')?.value,
    userId,
    process.env.TURNSTILE_SECRET_KEY || '',
  );
}
export async function hasProAccess(userId: string) {
  try {
    const { data, error } = await createAdminSupabaseClient()
      .from('entitlements')
      .select('plan,expires_at')
      .eq('user_id', userId)
      .maybeSingle();
    return (
      !error &&
      data?.plan === 'pro' &&
      (!data.expires_at || new Date(data.expires_at).getTime() > Date.now())
    );
  } catch {
    return false;
  }
}
export async function requireLearningAccess(requiresPro = false) {
  const account = await getCurrentAccount();
  if (!account) throw new LearningError('unauthorized', 401);
  if (!isAccountComplete(account.user, account.profile))
    throw new LearningError('account_incomplete', 403);
  if (
    !process.env.GEMINI_API_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !isCaptchaConfigured()
  )
    throw new LearningError('learning_unavailable', 503);
  if (!(await hasHumanVerification(account.user.id)))
    throw new LearningError('human_verification_required', 403);
  if (requiresPro && !(await hasProAccess(account.user.id)))
    throw new LearningError('pro_required', 403);
  return { account, database: createAdminSupabaseClient() };
}
export async function consumeLearningQuota(userId: string) {
  const { data, error } = await createAdminSupabaseClient().rpc(
    'consume_ai_quota',
    {
      p_user: userId,
    },
  );
  if (error) throw new LearningError('quota_unavailable', 503);
  if (data !== true) throw new LearningError('rate_limit', 429);
}
