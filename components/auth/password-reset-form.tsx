'use client';
import { useLanguage } from '@/hooks/use-language';
import { useResendCooldown } from '@/hooks/use-resend-cooldown';
import { getAuthErrorMessage } from '@/lib/auth-error-messages';
import {
  emailSchema,
  getAuthErrorCode,
  otpSchema,
} from '@/lib/auth-validation';
import { Language } from '@/lib/i18n';
import { newPasswordSchema } from '@/lib/password-validation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useCallback, useState } from 'react';
import { AuthLayout, RegistrationNotice } from './auth-layout';
import { TurnstileChallenge } from './turnstile-challenge';

export default function PasswordResetForm({
  configured,
  initialLanguage,
  userId,
}: {
  configured: boolean;
  initialLanguage: Language;
  userId?: string;
}) {
  const { language, setLanguage, translate } = useLanguage(initialLanguage);
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'done'>(
    userId ? 'password' : 'email',
  );
  const [identity, setIdentity] = useState(userId);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const { remaining, start } = useResendCooldown();
  const onCaptcha = useCallback((value: string) => setCaptchaToken(value), []);
  const resetCaptcha = () => {
    setCaptchaToken('');
    setCaptchaVersion((value) => value + 1);
  };

  async function sendResetEmail(event?: FormEvent) {
    event?.preventDefault();
    if (isBusy || remaining) return;
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError('invalid_email');
      return;
    }
    if (!configured) {
      setError('not_configured');
      return;
    }
    if (!captchaToken) {
      setError('captcha');
      return;
    }
    setIsBusy(true);
    setError('');
    try {
      const { error } =
        await createBrowserSupabaseClient().auth.resetPasswordForEmail(
          parsed.data,
          {
            captchaToken,
            redirectTo: `${window.location.origin}/auth/callback?next=password`,
          },
        );
      if (error) throw error;
      setEmail(parsed.data);
      setStep('code');
      start();
    } catch (error) {
      setError(getAuthErrorCode(error));
    } finally {
      setIsBusy(false);
      resetCaptcha();
    }
  }
  async function verifyResetCode(event: FormEvent) {
    event.preventDefault();
    if (isBusy) return;
    if (!otpSchema.safeParse(code).success) {
      setError('invalid_code');
      return;
    }
    setIsBusy(true);
    setError('');
    try {
      const { data, error } =
        await createBrowserSupabaseClient().auth.verifyOtp({
          email,
          token: code,
          type: 'recovery',
        });
      if (error) throw error;
      if (!data.session || !data.user) {
        setError('invalid_code');
        return;
      }
      setIdentity(data.user.id);
      setStep('password');
      setCode('');
    } catch (error) {
      setError(getAuthErrorCode(error));
    } finally {
      setIsBusy(false);
    }
  }
  async function saveNewPassword(event: FormEvent) {
    event.preventDefault();
    if (isBusy) return;
    if (password !== confirmation) {
      setError('password_mismatch');
      return;
    }
    if (!newPasswordSchema.safeParse(password).success) {
      setError('weak_password');
      return;
    }
    setIsBusy(true);
    setError('');
    try {
      const client = createBrowserSupabaseClient();
      const {
        data: { user },
        error: sessionError,
      } = await client.auth.getUser();
      if (
        sessionError ||
        !user ||
        user.id !== identity ||
        !user.email_confirmed_at
      ) {
        setError('unauthorized');
        return;
      }
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirmation('');
      setStep('done');
      // Supabase invalidates refresh tokens; already-issued access tokens have their usual TTL.
      await client.auth.signOut({ scope: 'global' }).catch(() => undefined);
    } catch (error) {
      setError(getAuthErrorCode(error));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <AuthLayout
      language={language}
      onToggleLanguage={() => setLanguage(language === 'he' ? 'en' : 'he')}
    >
      <div className="auth-card-label">
        {translate('YOUR ACCOUNT, BACK IN YOUR HANDS', 'חוזרים לחשבון שלכם')}
      </div>
      <h1>
        {step === 'done'
          ? translate('Password updated', 'הסיסמה עודכנה')
          : step === 'password'
            ? translate('Choose a password', 'בוחרים סיסמה')
            : translate('Reset your password', 'איפוס סיסמה')}
      </h1>
      <p className="auth-subtitle">
        {step === 'code'
          ? translate(
              'If this email belongs to an account, a reset message has been sent. Enter its code or use its link in this browser.',
              'אם המייל משויך לחשבון, נשלחה אליו הודעת איפוס. הזינו את הקוד שבה או פתחו את הקישור באותו דפדפן.',
            )
          : step === 'password'
            ? translate(
                'At least 12 characters. You can use several unrelated words.',
                'לפחות 12 תווים. אפשר להשתמש בכמה מילים שאינן קשורות זו לזו.',
              )
            : step === 'done'
              ? translate(
                  'You can now sign in with your username or email and your new password.',
                  'כעת אפשר להתחבר עם שם המשתמש או המייל והסיסמה החדשה.',
                )
              : translate(
                  'Use the verified email associated with your account. This also lets existing email-code users set a password.',
                  'השתמשו במייל המאומת של החשבון. אפשר כך להגדיר סיסמה גם לחשבון שנכנס עד עכשיו בקוד למייל.',
                )}
      </p>
      {!configured && step === 'email' && (
        <RegistrationNotice language={language} />
      )}
      {error && (
        <div className="auth-error" role="alert">
          {getAuthErrorMessage(error, language)}
        </div>
      )}
      {step === 'email' && (
        <form className="auth-form" onSubmit={sendResetEmail}>
          <label className="auth-field">
            {translate('Email address', 'כתובת מייל')}
            <input
              name="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              required
            />
          </label>
          {configured && (
            <TurnstileChallenge onToken={onCaptcha} resetKey={captchaVersion} />
          )}
          <button
            className="primary-button auth-submit"
            disabled={isBusy || !configured || !captchaToken || remaining > 0}
          >
            {isBusy
              ? translate('Sending…', 'שולחים…')
              : translate('Send reset email', 'שליחת מייל לאיפוס')}
            <ArrowRight size={17} />
          </button>
        </form>
      )}
      {step === 'code' && (
        <>
          <div className="auth-recipient">
            <bdi dir="ltr">{email}</bdi>
          </div>
          <form className="auth-form" onSubmit={verifyResetCode}>
            <label className="auth-field">
              {translate('Reset code', 'קוד האיפוס')}
              <input
                className="otp-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                dir="ltr"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ''))
                }
                maxLength={10}
                pattern="[0-9]{6,10}"
                required
              />
            </label>
            <button className="primary-button auth-submit" disabled={isBusy}>
              {translate('Verify code', 'אימות הקוד')}
              <ArrowRight size={17} />
            </button>
          </form>
          <TurnstileChallenge onToken={onCaptcha} resetKey={captchaVersion} />
          <button
            className="auth-back"
            onClick={() => sendResetEmail()}
            disabled={isBusy || remaining > 0 || !captchaToken}
          >
            {remaining
              ? translate(
                  `Resend in ${remaining}s`,
                  `שליחה חוזרת בעוד ${remaining} שניות`,
                )
              : translate('Resend reset email', 'שליחה חוזרת של מייל האיפוס')}
          </button>
        </>
      )}
      {step === 'password' && (
        <form className="auth-form" onSubmit={saveNewPassword}>
          <label className="auth-field">
            {translate('New password', 'סיסמה חדשה')}
            <input
              type="password"
              autoComplete="new-password"
              dir="ltr"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          <label className="auth-field">
            {translate('Confirm password', 'אימות סיסמה')}
            <input
              type="password"
              autoComplete="new-password"
              dir="ltr"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          <button className="primary-button auth-submit" disabled={isBusy}>
            {isBusy
              ? translate('Saving…', 'שומרים…')
              : translate('Save password', 'שמירת סיסמה')}
            <ArrowRight size={17} />
          </button>
        </form>
      )}
      {step === 'done' && (
        <div className="account-success-icon">
          <CheckCircle2 size={30} />
        </div>
      )}
      <Link className="auth-guest" href={`/login?lang=${language}`}>
        {translate('Back to sign in', 'חזרה להתחברות')}
        <ArrowRight size={16} />
      </Link>
    </AuthLayout>
  );
}
