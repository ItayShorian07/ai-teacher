import targets from '@/config/environments.json';
import { assertSupabaseTarget } from '../environment';

function publicEnvironment() {
  return {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_SUPABASE_ENV: process.env.NEXT_PUBLIC_SUPABASE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  };
}

export function isAuthConfigured() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return false;
  try {
    assertSupabaseTarget(publicEnvironment(), targets);
    return true;
  } catch {
    return false;
  }
}
export function getSupabaseConfig() {
  assertSupabaseTarget(publicEnvironment(), targets);
  if (!isAuthConfigured()) throw new Error('AUTH_NOT_CONFIGURED');
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  };
}
