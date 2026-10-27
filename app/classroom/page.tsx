import Classroom from '@/components/classroom/classroom';
import { isAccountComplete } from '@/lib/auth-validation';
import { getCurrentAccount } from '@/lib/server/account';
import {
  hasHumanVerification,
  hasProAccess,
  isCaptchaConfigured,
} from '@/lib/server/learning-access';
import { pageTitle } from '@/lib/site-metadata';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const metadata = { title: pageTitle('הכיתה שלי · My classroom') };
export default async function ClassroomPage() {
  const account = await getCurrentAccount();
  if (!account) redirect('/login');
  if (!isAccountComplete(account.user, account.profile))
    redirect('/account/complete');
  if (isCaptchaConfigured() && !(await hasHumanVerification(account.user.id)))
    redirect('/verify');
  return (
    <Classroom
      profile={account.profile!}
      hasProAccess={await hasProAccess(account.user.id)}
    />
  );
}
