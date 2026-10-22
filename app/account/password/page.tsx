import { redirect } from 'next/navigation';
import PasswordReset from '@/components/auth/password-reset';
import { currentAccount } from '@/lib/account-server';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'עדכון סיסמה · Update password | Limud' };
export default async function Page() {
  const account = await currentAccount();
  if (!account?.user.email_confirmed_at) redirect('/forgot-password');
  return <PasswordReset configured initialLang={account.profile?.locale === 'en' ? 'en' : 'he'} userId={account.user.id}/>;
}
