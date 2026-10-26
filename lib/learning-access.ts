import 'server-only';
import { cookies } from 'next/headers';
import { currentAccount } from './account-server';
import { accountComplete } from './auth-validation';
import { adminSupabase } from './supabase/admin';
import { verifyBotPass } from './bot-token';
export class LearningError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export const botConfigured = () =>
  !!(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
    process.env.TURNSTILE_SECRET_KEY
  );
export async function hasBotPass(userId: string) {
  return verifyBotPass(
    (await cookies()).get('limud-human')?.value,
    userId,
    process.env.TURNSTILE_SECRET_KEY || '',
  );
}
export async function isPro(userId: string) {
  try {
    const { data, error } = await adminSupabase()
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
export async function learningAccess(pro = false) {
  const account = await currentAccount();
  if (!account) throw new LearningError('unauthorized', 401);
  if (!accountComplete(account.user, account.profile))
    throw new LearningError('account_incomplete', 403);
  if (
    !process.env.GEMINI_API_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !botConfigured()
  )
    throw new LearningError('learning_unavailable', 503);
  if (!(await hasBotPass(account.user.id)))
    throw new LearningError('human_verification_required', 403);
  if (pro && !(await isPro(account.user.id)))
    throw new LearningError('pro_required', 403);
  return { account, db: adminSupabase() };
}
export async function consumeQuota(userId: string) {
  const { data, error } = await adminSupabase().rpc('consume_ai_quota', {
    p_user: userId,
  });
  if (error) throw new LearningError('quota_unavailable', 503);
  if (data !== true) throw new LearningError('rate_limit', 429);
}
