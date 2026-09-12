export function authConfigured(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);}
export function authConfig(){
 if(!authConfigured())throw new Error('AUTH_NOT_CONFIGURED');
 return {url:process.env.NEXT_PUBLIC_SUPABASE_URL!,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!};
}
export const siteOrigin=()=>new URL(process.env.NEXT_PUBLIC_SITE_URL||'https://ai-teacher-three-pied.vercel.app').origin;
