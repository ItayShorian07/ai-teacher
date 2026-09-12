import { redirect } from 'next/navigation';
import { currentAccount } from '@/lib/account-server';
import { accountComplete } from '@/lib/auth-validation';
import Onboarding from '@/components/auth/onboarding';
export const dynamic='force-dynamic';
export const metadata={title:'השלמת הרשמה · Complete your account | Limud'};
export default async function Complete({searchParams}:{searchParams:Promise<{edit?:string}>}){
 const params=await searchParams;const account=await currentAccount();if(!account)redirect('/login');
 if(accountComplete(account.user,account.profile)&&params.edit!=='1')redirect('/account');
 const meta=account.user.user_metadata||{};
 const text=(value:unknown)=>typeof value==='string'?value.slice(0,100):'';
 const initial=account.profile||{first_name:text(meta.first_name||meta.given_name),last_name:text(meta.last_name||meta.family_name),city:text(meta.city),phone:text(meta.phone),age:typeof meta.age==='number'?meta.age:undefined,locale:meta.locale==='en'?'en' as const:'he' as const};
 return <Onboarding email={account.user.email||''} emailVerified={Boolean(account.user.email_confirmed_at)} initialProfile={initial} initialLang={initial.locale==='en'?'en':'he'}/>;
}
