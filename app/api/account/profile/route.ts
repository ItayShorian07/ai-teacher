import { currentAccount,privateJson,validOrigin,boundedJson } from '@/lib/account-server';
import { authConfigured } from '@/lib/supabase/config';
import { profileSchema,accountComplete } from '@/lib/auth-validation';
export async function POST(request:Request){
 if(!validOrigin(request))return privateJson({error:'invalid_origin'},403);
 if(!authConfigured())return privateJson({error:'not_configured'},503);
 try{
  const parsed=profileSchema.safeParse(await boundedJson(request));if(!parsed.success)return privateJson({error:'invalid_profile'},400);
  const account=await currentAccount();if(!account)return privateJson({error:'unauthorized'},401);
  if(!account.user.email||!account.user.email_confirmed_at)return privateJson({error:'email_required'},403);
  const {error}=account.profile
   ?await account.supabase.from('profiles').update(parsed.data).eq('id',account.user.id)
   :await account.supabase.from('profiles').insert({id:account.user.id,...parsed.data});
  if(error)return privateJson({error:'profile_unavailable'},503);
  return privateJson({saved:true,complete:accountComplete(account.user,parsed.data)});
 }catch{return privateJson({error:'unavailable'},400);}
}
