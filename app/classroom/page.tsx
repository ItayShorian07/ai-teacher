import { redirect } from 'next/navigation';
import { currentAccount } from '@/lib/account-server';
import { accountComplete } from '@/lib/auth-validation';
import { botConfigured,hasBotPass,isPro } from '@/lib/learning-access';
import Classroom from '../classroom';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'הכיתה שלי · My classroom | Limud' };
export default async function Home() {
  const account = await currentAccount();
  if (!account) redirect('/login');
  if (!accountComplete(account.user, account.profile)) redirect('/account/complete');
  if(botConfigured()&&!await hasBotPass(account.user.id))redirect('/verify');
  return <Classroom profile={account.profile!} pro={await isPro(account.user.id)} />;
}
