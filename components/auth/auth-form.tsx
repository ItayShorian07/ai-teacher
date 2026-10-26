'use client';
import { useLanguage } from '@/hooks/use-language';
import { useResendCooldown } from '@/hooks/use-resend-cooldown';
import { getAuthErrorMessage } from '@/lib/auth-error-messages';
import {
  accountProfileSchema,
  emailSchema,
  getAuthErrorCode,
  otpSchema,
} from '@/lib/auth-validation';
import { type Language } from '@/lib/i18n';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useCallback, useState } from 'react';
import { AuthLayout, GoogleIcon, RegistrationNotice } from './auth-layout';
import { InterestPicker } from './interest-picker';
import { ProfileFields, createProfileFormValues } from './profile-fields';
import { TurnstileChallenge } from './turnstile-challenge';
export default function AuthForm({
  mode,
  configured,
  initialLanguage,
  googleEnabled,
  errorCode = '',
}: {
  mode: 'login' | 'register';
  configured: boolean;
  googleEnabled: boolean;
  initialLanguage: Language;
  errorCode?: string;
}) {
  const { language, setLanguage, translate } = useLanguage(initialLanguage);
  const isRegistration = mode === 'register';
  const [email, setEmail] = useState('');
  const [details, setDetails] = useState(() => createProfileFormValues());
  const [interests, setInterests] = useState<string[]>([]);
  const [customHobby, setCustomHobby] = useState('');
  const [step, setStep] = useState<'details' | 'email'>('details');
  const [verificationCode, setVerificationCode] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [submissionError, setSubmissionError] = useState(errorCode);
  const { remaining, start } = useResendCooldown();
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const onCaptcha = useCallback((value: string) => setCaptchaToken(value), []);
  function resetCaptcha() {
    setCaptchaToken('');
    setCaptchaVersion((v) => v + 1);
  }
  async function sendEmailCode(event?: FormEvent) {
    event?.preventDefault();
    if (isBusy || remaining) return;
    setSubmissionError('');
    if (!configured) {
      setSubmissionError('not_configured');
      return;
    }
    const validatedEmail = emailSchema.safeParse(email);
    if (!validatedEmail.success) {
      setSubmissionError('invalid_email');
      return;
    }
    const profile = isRegistration
      ? accountProfileSchema.safeParse({
          ...details,
          locale: language,
          hobbies: interests,
          custom_hobby: customHobby,
        })
      : null;
    if (profile && !profile.success) {
      setSubmissionError('invalid_profile');
      return;
    }
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      setSubmissionError('captcha');
      return;
    }
    setIsBusy(true);
    try {
      const { error: err } =
        await createBrowserSupabaseClient().auth.signInWithOtp({
          email: validatedEmail.data,
          options: {
            shouldCreateUser: isRegistration,
            ...(profile?.success ? { data: profile.data } : {}),
            ...(captchaToken ? { captchaToken } : {}),
          },
        });
      // A sign-in request for an unknown email must not reveal account existence.
      if (err && err.code !== 'otp_disabled' && err.code !== 'user_not_found')
        throw err;
      setEmail(validatedEmail.data);
      setStep('email');
      start();
    } catch (e) {
      setSubmissionError(getAuthErrorCode(e));
    } finally {
      setIsBusy(false);
      resetCaptcha();
    }
  }
  async function verifyEmailCode(event: FormEvent) {
    event.preventDefault();
    if (isBusy) return;
    const parsed = otpSchema.safeParse(verificationCode);
    if (!parsed.success) {
      setSubmissionError('invalid_code');
      return;
    }
    setIsBusy(true);
    setSubmissionError('');
    try {
      const { data, error: err } =
        await createBrowserSupabaseClient().auth.verifyOtp({
          email,
          token: parsed.data,
          type: 'email',
        });
      if (err || !data.session) {
        setSubmissionError(err ? getAuthErrorCode(err) : 'invalid_code');
        return;
      }
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Reload after the session changes to clear client state.
      window.location.assign('/account/complete');
    } catch {
      setSubmissionError('unavailable');
    } finally {
      setIsBusy(false);
    }
  }
  async function signInWithGoogle() {
    if (!configured || isBusy) return;
    setIsBusy(true);
    setSubmissionError('');
    try {
      const { error: err } =
        await createBrowserSupabaseClient().auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
      if (err) throw err;
    } catch (e) {
      setSubmissionError(getAuthErrorCode(e));
      setIsBusy(false);
    }
  }

  return (
    <AuthLayout
      language={language}
      onToggleLanguage={() => setLanguage(language === 'he' ? 'en' : 'he')}
      step={step === 'email' ? 2 : isRegistration ? 1 : 0}
    >
      <div className="auth-card-label">
        {translate('YOUR NEXT CHAPTER', 'הפרק הבא שלכם')}
      </div>
      <h1>
        {step === 'email'
          ? translate('Check your inbox', 'בודקים את תיבת המייל')
          : isRegistration
            ? translate('Let’s get to know you', 'נעים להכיר')
            : translate('Welcome back', 'טוב שחזרתם')}
      </h1>
      <p className="auth-subtitle">
        {step === 'email'
          ? translate(
              'Enter the verification code sent to your email.',
              'הזינו את קוד האימות שנשלח למייל שלכם.',
            )
          : isRegistration
            ? translate(
                'Create your personal learning account.',
                'יוצרים את חשבון הלמידה האישי שלכם.',
              )
            : translate(
                'Your next “I get it” moment is waiting.',
                'רגע ההבנה הבא שלכם כבר מחכה.',
              )}
      </p>
      {!configured && <RegistrationNotice language={language} />}
      {submissionError && (
        <div className="auth-error" role="alert">
          {getAuthErrorMessage(submissionError, language)}
        </div>
      )}
      {step === 'email' ? (
        <>
          <div className="auth-recipient">
            <Mail size={19} />
            <bdi dir="ltr">{email}</bdi>
          </div>
          <form onSubmit={verifyEmailCode} className="auth-form">
            <label className="auth-field">
              {translate('Email verification code', 'קוד האימות למייל')}
              <input
                autoFocus
                className="otp-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                dir="ltr"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                pattern="[0-9]{6,10}"
                required
              />
            </label>
            <button
              className="primary-button auth-submit"
              disabled={isBusy || !configured}
            >
              {isBusy
                ? translate('Checking…', 'בודקים…')
                : translate('Verify email & continue', 'אימות מייל והמשך')}
              <ArrowRight size={17} />
            </button>
          </form>
          {configured && (
            <TurnstileChallenge onToken={onCaptcha} resetKey={captchaVersion} />
          )}
          <div className="auth-resend">
            <span>
              {translate(
                'No email? Check spam, too.',
                'המייל לא הגיע? בדקו גם בתיקיית הספאם.',
              )}
            </span>
            <button onClick={() => sendEmailCode()} disabled={isBusy || remaining > 0}>
              {remaining
                ? translate(
                    `Resend in ${remaining}s`,
                    `שליחה חוזרת בעוד ${remaining} שניות`,
                  )
                : translate('Send a new code', 'שליחת קוד חדש')}
            </button>
          </div>
          <button
            className="auth-back"
            onClick={() => {
              setStep('details');
              setVerificationCode('');
              setSubmissionError('');
            }}
          >
            <ArrowLeft size={16} />
            {translate('Use another email', 'שימוש במייל אחר')}
          </button>
        </>
      ) : (
        <>
          <button
            className="google-button"
            onClick={signInWithGoogle}
            disabled={!googleEnabled || isBusy}
          >
            <GoogleIcon />
            {translate('Continue with Google', 'המשך עם Google')}
          </button>
          {!googleEnabled && (
            <p className="auth-field-note">
              {translate(
                'Google sign-in is not available yet.',
                'התחברות עם Google עדיין אינה זמינה.',
              )}
            </p>
          )}
          <div className="auth-divider">
            <span>
              {translate('or with your email', 'או באמצעות המייל שלכם')}
            </span>
          </div>
          <form className="auth-form" onSubmit={sendEmailCode}>
            {isRegistration && (
              <>
                <ProfileFields
                  language={language}
                  values={details}
                  onChange={setDetails}
                />
                <InterestPicker
                  language={language}
                  values={interests}
                  onChange={setInterests}
                  custom={customHobby}
                  onCustom={setCustomHobby}
                />
              </>
            )}
            <label className="auth-field">
              {translate('Email address', 'כתובת מייל')}
              <input
                name="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                required
              />
            </label>
            {!isRegistration && (
              <p className="auth-field-note">
                {translate(
                  'We’ll send a one-time sign-in code. No password to remember.',
                  'נשלח קוד התחברות חד־פעמי. אין צורך לזכור סיסמה.',
                )}
              </p>
            )}
            {configured && (
              <TurnstileChallenge
                onToken={onCaptcha}
                resetKey={captchaVersion}
              />
            )}
            <button
              className="primary-button auth-submit"
              disabled={isBusy || !configured || remaining > 0}
            >
              {isBusy
                ? translate('Sending…', 'שולחים…')
                : isRegistration
                  ? translate(
                      'Create account & send code',
                      'יצירת חשבון ושליחת קוד',
                    )
                  : translate('Send sign-in code', 'שליחת קוד התחברות')}
              <ArrowRight size={17} />
            </button>
          </form>
          {isRegistration && (
            <div className="auth-data-note">
              <CheckCircle2 size={17} />
              <p>
                {translate(
                  'Your name, city and age personalize your account. Your email verifies it. Your phone is a contact field. These details aren’t shown to other students.',
                  'השם, היישוב והגיל משמשים לפרופיל שלכם. המייל משמש לאימות והטלפון הוא פרט ליצירת קשר. הפרטים לא מוצגים לתלמידים אחרים.',
                )}
              </p>
            </div>
          )}
          <p className="auth-switch">
            {isRegistration
              ? translate('Already have an account?', 'כבר יש לכם חשבון?')
              : translate('New to Limud?', 'פעם ראשונה ב־Limud?')}{' '}
            <Link
              href={`${isRegistration ? '/login' : '/register'}?lang=${language}`}
            >
              {isRegistration
                ? translate('Sign in', 'התחברות')
                : translate('Create an account', 'יצירת חשבון')}
            </Link>
          </p>
        </>
      )}
      <Link className="auth-guest" href="/demo">
        {translate(
          'Just looking? Continue to the demo',
          'רק מתרשמים? ממשיכים לדמו',
        )}
        <ArrowRight size={15} />
      </Link>
    </AuthLayout>
  );
}
