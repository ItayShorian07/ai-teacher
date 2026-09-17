import { currentAccount,privateJson,validOrigin,boundedJson } from '@/lib/account-server';
import { adminSupabase } from '@/lib/supabase/admin';
export async function POST(request:Request){
 if(!validOrigin(request))return privateJson({error:'invalid_origin'},403);
 try{
 const account=await currentAccount();if(!account)return privateJson({error:'unauthorized'},401);
 const body=await boundedJson(request);if(body.confirmation!=='DELETE')return privateJson({error:'confirmation_required'},400);
 const {error}=await adminSupabase().auth.admin.deleteUser(account.user.id);
 if(error)return privateJson({error:'delete_unavailable'},503);
 await account.supabase.auth.signOut({scope:'local'});
 return privateJson({deleted:true});
 }catch{return privateJson({error:'delete_unavailable'},503);}
}
