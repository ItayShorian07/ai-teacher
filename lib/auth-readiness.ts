import 'server-only';
import { authConfigured,authConfig } from './supabase/config';
export async function authReadiness(){
 if(!authConfigured())return {configured:false,google:false};
 const {url,key}=authConfig();
 try{
 const [settings,table]=await Promise.all([
 fetch(`${url}/auth/v1/settings`,{headers:{apikey:key},cache:'no-store',signal:AbortSignal.timeout(5000)}),
 fetch(`${url}/rest/v1/profiles?select=id,school,hobbies,custom_hobby&limit=0`,{headers:{apikey:key},cache:'no-store',signal:AbortSignal.timeout(5000)})]);
 const data=await settings.json();const db=await table.json();
 // Anonymous SELECT is expected to be denied by grants/RLS; schema absence is different.
 const exists=table.ok||db.code==='42501';
 const protectedAuth=!!(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&process.env.TURNSTILE_SECRET_KEY);
 return {configured:settings.ok&&exists&&protectedAuth,google:settings.ok&&exists&&protectedAuth&&data.external?.google===true};
 }catch{return {configured:false,google:false};}
}
