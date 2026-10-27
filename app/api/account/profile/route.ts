import { accountProfileSchema, isAccountComplete } from '@/lib/auth-validation';
import { getCurrentAccount } from '@/lib/server/account';
import {
  isValidOrigin,
  privateJsonResponse,
  readJsonBody,
} from '@/lib/server/http';
import { isAuthConfigured } from '@/lib/supabase/config';
export async function POST(request: Request) {
  if (!isValidOrigin(request))
    return privateJsonResponse({ error: 'invalid_origin' }, 403);
  if (!isAuthConfigured())
    return privateJsonResponse({ error: 'not_configured' }, 503);
  try {
    const parsed = accountProfileSchema.safeParse(await readJsonBody(request));
    if (!parsed.success)
      return privateJsonResponse({ error: 'invalid_profile' }, 400);
    const account = await getCurrentAccount();
    if (!account) return privateJsonResponse({ error: 'unauthorized' }, 401);
    if (!account.user.email || !account.user.email_confirmed_at)
      return privateJsonResponse({ error: 'email_required' }, 403);
    const { error } = account.profile
      ? await account.supabase
          .from('profiles')
          .update(parsed.data)
          .eq('id', account.user.id)
      : await account.supabase
          .from('profiles')
          .insert({ id: account.user.id, ...parsed.data });
    if (error?.code === '23505')
      return privateJsonResponse({ error: 'username_unavailable' }, 409);
    if (error)
      return privateJsonResponse({ error: 'profile_unavailable' }, 503);
    return privateJsonResponse({
      saved: true,
      complete: isAccountComplete(account.user, parsed.data),
    });
  } catch {
    return privateJsonResponse({ error: 'unavailable' }, 400);
  }
}
