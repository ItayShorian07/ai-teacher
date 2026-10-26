import 'server-only';
import { AccountProfile } from '../auth-validation';
import { isAuthConfigured } from '../supabase/config';
import { createServerSupabaseClient } from '../supabase/server';
export const profileColumns =
  'first_name,last_name,city,age,phone,locale,school,hobbies,custom_hobby';
export async function getCurrentAccount() {
  if (!isAuthConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(profileColumns)
    .eq('id', user.id)
    .maybeSingle();
  return {
    supabase,
    user,
    profile: profile as AccountProfile | null,
    profileError,
  };
}
