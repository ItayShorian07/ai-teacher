import PasswordResetForm from '@/components/auth/password-reset-form';
import { getAuthReadiness } from '@/lib/server/auth-readiness';
import { pageTitle } from '@/lib/site-metadata';
export const dynamic = 'force-dynamic';
export const metadata = { title: pageTitle('איפוס סיסמה · Reset password') };
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
