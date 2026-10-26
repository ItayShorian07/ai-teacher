import 'server-only';
import { serverSupabase } from './supabase/server';
import { authConfigured,siteOrigin } from './supabase/config';
import { boundedBody } from './request-body';
import { AccountProfile } from './auth-validation';
export const profileColumns='username,first_name,last_name,city,age,phone,locale,school,hobbies,custom_hobby';
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
 try{
  return Boolean(origin)&&new URL(origin!).origin===siteOrigin(new URL(request.url).origin);
 }catch{return false;}
}
export async function boundedJson(request:Request,limit=8192){
 return JSON.parse((await boundedBody(request,limit)).toString('utf8'));
}
