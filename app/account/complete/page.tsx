import ProfileForm from '@/components/auth/profile-form';
import { isAccountComplete } from '@/lib/auth-validation';
import { getCurrentAccount } from '@/lib/server/account';
import { pageTitle } from '@/lib/site-metadata';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: pageTitle('השלמת הרשמה · Complete your account'),
};
export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const account = await getCurrentAccount();
  if (!account) redirect('/login');
  if (isAccountComplete(account.user, account.profile) && params.edit !== '1')
    redirect('/account');
  const meta = account.user.user_metadata || {};
  const text = (value: unknown) =>
    typeof value === 'string' ? value.slice(0, 100) : '';
  const initial = account.profile || {
    username: text(meta.username),
    first_name: text(meta.first_name || meta.given_name),
    last_name: text(meta.last_name || meta.family_name),
    city: text(meta.city),
    phone: text(meta.phone),
    age: typeof meta.age === 'number' ? meta.age : undefined,
    school: text(meta.school),
    hobbies: Array.isArray(meta.hobbies)
      ? meta.hobbies
          .filter((interest: unknown) => typeof interest === 'string')
          .slice(0, 20)
      : [],
    custom_hobby: text(meta.custom_hobby),
    locale: meta.locale === 'en' ? ('en' as const) : ('he' as const),
  };
  return (
    <ProfileForm
      email={account.user.email || ''}
      emailVerified={Boolean(account.user.email_confirmed_at)}
      initialProfile={initial}
      initialLanguage={initial.locale === 'en' ? 'en' : 'he'}
    />
  );
}
