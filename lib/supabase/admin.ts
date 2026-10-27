import targets from '@/config/environments.json';
import { createClient } from '@supabase/supabase-js';
import 'server-only';
import { assertSupabaseTarget } from '../environment';
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('storage_unavailable');
  assertSupabaseTarget(process.env, targets);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
