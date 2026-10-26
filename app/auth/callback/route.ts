import { callbackOrigin } from '@/lib/request-origin';
import { isAuthConfigured } from '@/lib/supabase/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
  const target = callbackOrigin(request.url, process.env);
  const code = request.nextUrl.searchParams.get('code');
  if (isAuthConfigured() && code && code.length < 4096) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const response = NextResponse.redirect(
          new URL('/account/complete', target),
        );
        response.headers.set('Cache-Control', 'private, no-store');
        return response;
      }
    } catch {}
  }
  const response = NextResponse.redirect(
    new URL('/login?error=callback', target),
  );
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
