import { assertEnvironmentPair, deploymentOrigin } from '../runtime-environment';

function configuredPair() {
 return {
  appEnvironment: process.env.NEXT_PUBLIC_APP_ENV,
  dataEnvironment: process.env.NEXT_PUBLIC_SUPABASE_ENV,
  configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
 };
}
export function authConfigured(){
 const pair=configuredPair();
 if(!pair.configured)return false;
 try{assertEnvironmentPair(pair);return true;}catch{return false;}
}
export function authConfig(){
 const pair=configuredPair();
 assertEnvironmentPair(pair);
 if(!pair.configured)throw new Error('AUTH_NOT_CONFIGURED');
 return {url:process.env.NEXT_PUBLIC_SUPABASE_URL!,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!};
}
export const siteOrigin=(requestOrigin?:string)=>deploymentOrigin(requestOrigin);
