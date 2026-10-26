import 'server-only';
import { createClient } from '@supabase/supabase-js';
export function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('storage_unavailable');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
