import PasswordReset from '@/components/auth/password-reset';
import { authReadiness } from '@/lib/auth-readiness';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'איפוס סיסמה · Reset password | Limud' };
export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const [params, ready] = await Promise.all([searchParams, authReadiness()]);
  return <PasswordReset configured={ready.configured} initialLang={params.lang === 'en' ? 'en' : 'he'}/>;
}
