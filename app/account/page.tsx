import { redirect } from 'next/navigation';
import { currentAccount } from '@/lib/account-server';
import { accountComplete } from '@/lib/auth-validation';
import AccountScreen from '@/components/auth/account-screen';
export const dynamic='force-dynamic';
export const metadata={title:'החשבון שלי · My account | Limud'};
export default async function Account(){const account=await currentAccount();if(!account)redirect('/login');if(!accountComplete(account.user,account.profile))redirect('/account/complete');return <AccountScreen profile={account.profile!} email={account.user.email!} phone={account.profile!.phone}/>;}
