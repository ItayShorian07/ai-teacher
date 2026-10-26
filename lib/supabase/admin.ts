import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { assertEnvironmentPair } from '../runtime-environment';
export function adminSupabase(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('storage_unavailable');
 assertEnvironmentPair({appEnvironment:process.env.NEXT_PUBLIC_APP_ENV,dataEnvironment:process.env.NEXT_PUBLIC_SUPABASE_ENV,configured:true});
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
