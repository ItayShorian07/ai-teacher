import PasswordResetForm from '@/components/auth/password-reset-form';
import { getAuthReadiness } from '@/lib/server/auth-readiness';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'איפוס סיסמה · Reset password | Limud' };
export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const [params, ready] = await Promise.all([searchParams, getAuthReadiness()]);
  return (
    <PasswordResetForm
      configured={ready.configured}
      initialLanguage={params.lang === 'en' ? 'en' : 'he'}
    />
  );
}
