import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { authConfigured,authConfig } from '@/lib/supabase/config';
export async function proxy(request:NextRequest){
 if(!authConfigured())return NextResponse.next();
 const {url,key}=authConfig();let response=NextResponse.next({request});
 const supabase=createServerClient(url,key,{cookies:{getAll(){return request.cookies.getAll();},setAll(values){
  values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});
  values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
 }}});
 // Only refresh here. Every protected page/API separately validates the user.
 try{await supabase.auth.getClaims();}catch{/* Protected handlers fail closed if the session cannot be validated. */}
 response.headers.set('Cache-Control','private, no-store');return response;
}
export const config={matcher:['/account/:path*','/auth/:path*','/api/account/:path*']};
