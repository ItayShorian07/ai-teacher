import AccountDetails from '@/components/auth/account-details';
import { isAccountComplete } from '@/lib/auth-validation';
import { getCurrentAccount } from '@/lib/server/account';
import { pageTitle } from '@/lib/site-metadata';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const metadata = { title: pageTitle('החשבון שלי · My account') };
export default async function AccountPage() {
  const account = await getCurrentAccount();
  if (!account) redirect('/login');
  if (!isAccountComplete(account.user, account.profile))
    redirect('/account/complete');
  return (
    <AccountDetails
      profile={account.profile!}
      email={account.user.email!}
      phone={account.profile!.phone}
    />
  );
}
