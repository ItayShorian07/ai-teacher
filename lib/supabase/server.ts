import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import 'server-only';
import { getSupabaseConfig } from './config';
export async function createServerSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  const jar = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(values) {
        try {
          for (const { name, value, options } of values)
            jar.set(name, value, options);
        } catch {
          /* Proxy owns refresh during server rendering. */
        }
      },
    },
  });
}
