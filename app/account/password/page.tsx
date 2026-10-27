import PasswordResetForm from '@/components/auth/password-reset-form';
import { getCurrentAccount } from '@/lib/server/account';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'עדכון סיסמה · Update password | Limud' };
export default async function PasswordSettingsPage() {
  const account = await getCurrentAccount();
  if (!account?.user.email_confirmed_at) redirect('/forgot-password');
  return (
    <PasswordResetForm
      configured
      initialLanguage={account.profile?.locale === 'en' ? 'en' : 'he'}
      userId={account.user.id}
    />
  );
}
