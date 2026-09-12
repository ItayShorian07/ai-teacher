import AuthScreen from '@/components/auth/auth-screen';
import { authConfigured } from '@/lib/supabase/config';
export const metadata={title:'התחברות · Sign in | Limud'};
export default async function Login({searchParams}:{searchParams:Promise<{lang?:string;error?:string}>}){
 const p=await searchParams;return <AuthScreen mode="login" configured={authConfigured()} initialLang={p.lang==='en'?'en':'he'} errorCode={p.error==='callback'?'callback':''}/>;
}
