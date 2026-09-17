import AuthScreen from '@/components/auth/auth-screen';
import { authReadiness } from '@/lib/auth-readiness';
export const dynamic='force-dynamic';
export const metadata={title:'התחברות · Sign in | Limud'};
export default async function Login({searchParams}:{searchParams:Promise<{lang?:string;error?:string}>}){
 const p=await searchParams;const ready=await authReadiness();return <AuthScreen mode="login" configured={ready.configured} googleEnabled={ready.google} initialLang={p.lang==='en'?'en':'he'} errorCode={p.error==='callback'?'callback':''}/>;
}
