import 'server-only';
import { authConfigured,authConfig } from './supabase/config';
export async function authReadiness(){
 if(!authConfigured())return {configured:false,registration:false,google:false,password:false};
 const {url,key}=authConfig();
 try{
 const [settings,table]=await Promise.all([
 fetch(`${url}/auth/v1/settings`,{headers:{apikey:key},cache:'no-store',signal:AbortSignal.timeout(5000)}),
 fetch(`${url}/rest/v1/profiles?select=id,username,school,hobbies,custom_hobby&limit=0`,{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY||key,...(process.env.SUPABASE_SERVICE_ROLE_KEY?{Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`}:{})},cache:'no-store',signal:AbortSignal.timeout(5000)})]);
 const data=await settings.json();const db=await table.json();
 // Anonymous SELECT is expected to be denied by grants/RLS; schema absence is different.
 const exists=table.ok||db.code==='42501';
 const protectedAuth=!!(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&process.env.TURNSTILE_SECRET_KEY);
 const configured=settings.ok&&exists&&protectedAuth&&data.external?.email===true;
 let password=false;
 if(configured&&process.env.SUPABASE_SERVICE_ROLE_KEY){
  const lookup=await fetch(`${url}/rest/v1/rpc/resolve_login_email`,{method:'POST',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({p_username:''}),cache:'no-store',signal:AbortSignal.timeout(5000)});
  password=lookup.ok;
 }
 return {configured,registration:configured&&!data.disable_signup&&!data.mailer_autoconfirm,google:settings.ok&&exists&&protectedAuth&&data.external?.google===true,password};
 }catch{return {configured:false,registration:false,google:false,password:false};}
}
