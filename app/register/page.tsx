import AuthForm from '@/components/auth/auth-form';
import { getAuthReadiness } from '@/lib/server/auth-readiness';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'הרשמה · Create account | Limud' };
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
