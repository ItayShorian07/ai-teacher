import { accountDeletionSchema } from '@/lib/auth-validation';
import { getCurrentAccount } from '@/lib/server/account';
import {
  isValidOrigin,
  privateJsonResponse,
  readJsonBody,
} from '@/lib/server/http';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
export async function POST(request: Request) {
  if (!isValidOrigin(request))
    return privateJsonResponse({ error: 'invalid_origin' }, 403);
  try {
    const account = await getCurrentAccount();
    if (!account) return privateJsonResponse({ error: 'unauthorized' }, 401);
    const input = accountDeletionSchema.safeParse(await readJsonBody(request));
    if (!input.success)
      return privateJsonResponse({ error: 'confirmation_required' }, 400);
    const { error } = await createAdminSupabaseClient().auth.admin.deleteUser(
      account.user.id,
    );
    if (error) return privateJsonResponse({ error: 'delete_unavailable' }, 503);
    await account.supabase.auth.signOut({ scope: 'local' });
    return privateJsonResponse({ deleted: true });
  } catch {
    return privateJsonResponse({ error: 'delete_unavailable' }, 503);
  }
}
