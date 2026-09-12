import { z } from 'zod';
import { currentAccount,privateJson,validOrigin,boundedJson } from '@/lib/account-server';
import { authConfigured } from '@/lib/supabase/config';
import { accountComplete,otpSchema,profileSchema,authErrorCode } from '@/lib/auth-validation';
const input=z.discriminatedUnion('action',[
 z.object({action:z.literal('send')}).strict(),z.object({action:z.literal('resend')}).strict(),
 z.object({action:z.literal('verify'),token:otpSchema}).strict()
]);
export async function POST(request:Request){
 if(!validOrigin(request))return privateJson({error:'invalid_origin'},403);
 if(!authConfigured())return privateJson({error:'not_configured'},503);
 try{
  const parsed=input.safeParse(await boundedJson(request));if(!parsed.success)return privateJson({error:'invalid_code'},400);
  const account=await currentAccount();if(!account)return privateJson({error:'unauthorized'},401);
  if(!account.user.email_confirmed_at)return privateJson({error:'email_required'},403);
  const profile=profileSchema.safeParse(account.profile);if(!profile.success)return privateJson({error:'profile_required'},400);
  const phone=profile.data.phone;
  if(accountComplete(account.user,profile.data))return privateJson({complete:true});
  const {error}=parsed.data.action==='verify'
   ?await account.supabase.auth.verifyOtp({phone,token:parsed.data.token,type:'phone_change'})
   :parsed.data.action==='resend'
    ?await account.supabase.auth.resend({phone,type:'phone_change'})
    :await account.supabase.auth.updateUser({phone});
  if(error)return privateJson({error:authErrorCode(error)},error.status===429?429:400);
  if(parsed.data.action!=='verify')return privateJson({sent:true});
  // Fresh Auth state is authoritative; editable metadata never establishes verification.
  const {data:{user},error:userError}=await account.supabase.auth.getUser();
  if(user && user.id!==account.user.id){await account.supabase.auth.signOut({scope:'local'});return privateJson({error:'unauthorized'},401);}
  if(userError||!user||!accountComplete(user,profile.data,account.user.id))return privateJson({error:'verification_incomplete'},400);
  return privateJson({complete:true});
 }catch{return privateJson({error:'unavailable'},503);}
}
