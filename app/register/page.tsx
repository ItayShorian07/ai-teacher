import AuthScreen from '@/components/auth/auth-screen';
import { authReadiness } from '@/lib/auth-readiness';
export const dynamic='force-dynamic';
export const metadata={title:'הרשמה · Create account | Limud'};
export default async function Register({searchParams}:{searchParams:Promise<{lang?:string}>}){
 const p=await searchParams;const ready=await authReadiness();return <AuthScreen mode="register" configured={ready.configured} googleEnabled={ready.google} initialLang={p.lang==='en'?'en':'he'}/>;
}
