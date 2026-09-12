import AuthScreen from '@/components/auth/auth-screen';
import { authConfigured } from '@/lib/supabase/config';
export const metadata={title:'הרשמה · Create account | Limud'};
export default async function Register({searchParams}:{searchParams:Promise<{lang?:string}>}){
 const p=await searchParams;return <AuthScreen mode="register" configured={authConfigured()} initialLang={p.lang==='en'?'en':'he'}/>;
}
