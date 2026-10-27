import AuthForm from '@/components/auth/auth-form';
import { getAuthReadiness } from '@/lib/server/auth-readiness';
import { pageTitle } from '@/lib/site-metadata';
export const dynamic = 'force-dynamic';
export const metadata = { title: pageTitle('הרשמה · Create account') };
export default async function RegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const parameters = await searchParams;
  const ready = await getAuthReadiness();
  return (
    <AuthForm
      mode="register"
      configured={ready.registration}
      passwordEnabled={ready.password}
      googleEnabled={ready.google}
      initialLanguage={parameters.lang === 'en' ? 'en' : 'he'}
    />
  );
}
