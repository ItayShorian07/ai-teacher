import AuthForm from '@/components/auth/auth-form';
import { getAuthReadiness } from '@/lib/server/auth-readiness';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'התחברות · Sign in | Limud' };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; error?: string }>;
}) {
  const parameters = await searchParams;
  const ready = await getAuthReadiness();
  return (
    <AuthForm
      mode="login"
      configured={ready.configured}
      passwordEnabled={ready.password}
      googleEnabled={ready.google}
      initialLanguage={parameters.lang === 'en' ? 'en' : 'he'}
      errorCode={parameters.error === 'callback' ? 'callback' : ''}
    />
  );
}
