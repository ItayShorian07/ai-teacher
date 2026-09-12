import { currentAccount,privateJson } from '@/lib/account-server';
import { authConfigured } from '@/lib/supabase/config';
import { accountComplete } from '@/lib/auth-validation';
export async function GET(){
 if(!authConfigured())return privateJson({configured:false,signedIn:false});
 try{const account=await currentAccount();if(!account)return privateJson({configured:true,signedIn:false});
 return privateJson({configured:true,signedIn:true,complete:accountComplete(account.user,account.profile),firstName:account.profile?.first_name||''});
 }catch{return privateJson({error:'unavailable'},503);}
}
