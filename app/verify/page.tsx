import HumanVerificationForm from '@/components/auth/human-verification-form';
import { getCurrentAccount } from '@/lib/server/account';
import {
  hasHumanVerification,
  isCaptchaConfigured,
} from '@/lib/server/learning-access';
import { redirect } from 'next/navigation';
export default async function VerificationPage() {
  const account = await getCurrentAccount();
  if (!account) redirect('/');
  if (!isCaptchaConfigured() || (await hasHumanVerification(account.user.id)))
    redirect('/classroom');
  return <HumanVerificationForm />;
}
