import 'server-only';
import { serverSupabase } from './supabase/server';
import { authConfigured,siteOrigin } from './supabase/config';
import { AccountProfile } from './auth-validation';
export const profileColumns='first_name,last_name,city,age,phone,locale';
export function privateJson(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}});}
export async function currentAccount(){
 if(!authConfigured())return null;
 const supabase=await serverSupabase();const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)return null;
 const {data:profile,error:profileError}=await supabase.from('profiles').select(profileColumns).eq('id',user.id).maybeSingle();
 return {supabase,user,profile:profile as AccountProfile|null,profileError};
}
export function validOrigin(request:Request){
 const origin=request.headers.get('origin');
 if(origin===siteOrigin())return true;
 try{
  const client=new URL(origin||'');const target=new URL(request.url);const loopback=['localhost','127.0.0.1'];
  return process.env.NODE_ENV==='development'&&client.protocol==='http:'&&target.protocol==='http:'&&loopback.includes(client.hostname)&&loopback.includes(target.hostname)&&client.port===target.port;
 }catch{return false;}
}
export async function boundedJson(request:Request){
 if(Number(request.headers.get('content-length')||0)>8192)throw new Error('BODY_TOO_LARGE');
 const body=await request.text();if(new TextEncoder().encode(body).length>8192)throw new Error('BODY_TOO_LARGE');
 return JSON.parse(body);
}
