import 'server-only';
import { isAccountComplete } from '../auth-validation';
import { getCurrentAccount } from './account';
import {
  hasHumanVerification,
  hasProAccess,
  isCaptchaConfigured,
} from './learning-access';
import { redirect } from 'next/navigation';

export async function getClassroomAccess() {
  const account = await getCurrentAccount();
  if (!account) redirect('/login');
  if (!isAccountComplete(account.user, account.profile))
    redirect('/account/complete');
  if (isCaptchaConfigured() && !(await hasHumanVerification(account.user.id)))
    redirect('/verify');

  return {
    profile: account.profile!,
    hasProAccess: await hasProAccess(account.user.id),
  };
}
