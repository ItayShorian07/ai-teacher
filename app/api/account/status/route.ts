import { isAccountComplete } from '@/lib/auth-validation';
import { getCurrentAccount } from '@/lib/server/account';
import { privateJsonResponse } from '@/lib/server/http';
import { isAuthConfigured } from '@/lib/supabase/config';
export async function GET() {
  if (!isAuthConfigured())
    return privateJsonResponse({ configured: false, signedIn: false });
  try {
    const account = await getCurrentAccount();
    if (!account)
      return privateJsonResponse({ configured: true, signedIn: false });
    return privateJsonResponse({
      configured: true,
      signedIn: true,
      complete: isAccountComplete(account.user, account.profile),
      firstName: account.profile?.first_name || '',
    });
  } catch {
    return privateJsonResponse({ error: 'unavailable' }, 503);
  }
}
