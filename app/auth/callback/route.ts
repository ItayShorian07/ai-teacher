import { NextRequest,NextResponse } from 'next/server';
import { authConfigured,siteOrigin } from '@/lib/supabase/config';
import { serverSupabase } from '@/lib/supabase/server';
export async function GET(request:NextRequest){
 const target=siteOrigin();const code=request.nextUrl.searchParams.get('code');
 if(authConfigured()&&code&&code.length<4096){
  try{const supabase=await serverSupabase();const {error}=await supabase.auth.exchangeCodeForSession(code);
   if(!error){const response=NextResponse.redirect(new URL('/account/complete',target));response.headers.set('Cache-Control','private, no-store');return response;}
  }catch{}
 }
 const response=NextResponse.redirect(new URL('/login?error=callback',target));response.headers.set('Cache-Control','private, no-store');return response;
}
