'use client';
import { getAuthErrorMessage } from '@/lib/auth-error-messages';
import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';
import { AuthLayout, GoogleIcon, RegistrationNotice } from './auth-layout';
import { InterestPicker } from './interest-picker';
import { ProfileFields } from './profile-fields';
import { TurnstileChallenge } from './turnstile-challenge';

import { useAuthForm, type AuthFormOptions } from '@/hooks/use-auth-form';
export default function AuthForm(options: AuthFormOptions) {
  const {
    configured,
    googleEnabled,
    passwordEnabled,
    language,
    setLanguage,
    translate,
    isRegistration,
    email,
    setEmail,
    details,
    setDetails,
    method,
    setMethod,
    identifier,
    setIdentifier,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    interests,
    setInterests,
    customHobby,
    setCustomHobby,
    step,
    setStep,
    token,
    setToken,
    isBusy,
    error,
    setError,
    remaining,
    captchaToken,
    captchaVersion,
    onCaptcha,
    resetCaptcha,
    sendEmailCode,
    signInWithPassword,
    verifyEmailCode,
    signInWithGoogle,
  } = useAuthForm(options);
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
      {error && (
        <div className="auth-error" role="alert">
          {getAuthErrorMessage(error, language)}
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
                value={token}
                onChange={(event) =>
                  setToken(event.target.value.replace(/\D/g, ''))
                }
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
            <button
              onClick={() => sendEmailCode()}
              disabled={isBusy || remaining > 0}
            >
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
              setToken('');
              setError('');
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
              {translate('or with your account', 'או עם החשבון שלכם')}
            </span>
          </div>
          {!isRegistration && (
            <div
              className="auth-methods"
              role="group"
              aria-label={translate('Sign-in method', 'אופן ההתחברות')}
            >
              <button
                type="button"
                aria-pressed={method === 'password'}
                onClick={() => {
                  setMethod('password');
                  setError('');
                  resetCaptcha();
                }}
              >
                {translate('Username & password', 'שם משתמש וסיסמה')}
              </button>
              <button
                type="button"
                aria-pressed={method === 'code'}
                onClick={() => {
                  setMethod('code');
                  setPassword('');
                  setError('');
                  resetCaptcha();
                }}
              >
                {translate('Email code', 'קוד במייל')}
              </button>
            </div>
          )}
          {!isRegistration &&
            method === 'password' &&
            configured &&
            !passwordEnabled && (
              <p className="auth-field-note" role="status">
                {translate(
                  'Password sign-in is being set up. You can use an email code.',
                  'כניסה בסיסמה עדיין בהגדרה. אפשר להשתמש בקוד למייל.',
                )}
              </p>
            )}
          <form
            className="auth-form"
            onSubmit={
              !isRegistration && method === 'password'
                ? signInWithPassword
                : sendEmailCode
            }
          >
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
            {!isRegistration && method === 'password' ? (
              <label className="auth-field">
                {translate('Username or email', 'שם משתמש או מייל')}
                <input
                  name="username"
                  dir="ltr"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="itay_shorian"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  maxLength={254}
                  required
                />
              </label>
            ) : (
              <label className="auth-field">
                {translate('Email address', 'כתובת מייל')}
                <input
                  name="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={254}
                  required
                />
              </label>
            )}
            {(isRegistration || method === 'password') && (
              <>
                <label className="auth-field">
                  {translate('Password', 'סיסמה')}
                  <input
                    name="password"
                    type="password"
                    dir="ltr"
                    autoComplete={
                      isRegistration ? 'new-password' : 'current-password'
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={isRegistration ? 12 : 1}
                    maxLength={128}
                    required
                  />
                </label>
                {isRegistration ? (
                  <>
                    <p className="auth-field-note">
                      {translate(
                        'Use at least 12 characters. A few unrelated words make a good passphrase.',
                        'לפחות 12 תווים. אפשר להשתמש בכמה מילים שאינן קשורות זו לזו.',
                      )}
                    </p>
                    <label className="auth-field">
                      {translate('Confirm password', 'אימות סיסמה')}
                      <input
                        name="password_confirmation"
                        type="password"
                        dir="ltr"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        minLength={12}
                        maxLength={128}
                        required
                      />
                    </label>
                  </>
                ) : (
                  <Link
                    className="auth-password-help"
                    href={`/forgot-password?lang=${language}`}
                  >
                    {translate('Forgot your password?', 'שכחתם את הסיסמה?')}
                  </Link>
                )}
              </>
            )}
            {!isRegistration && method === 'code' && (
              <p className="auth-field-note">
                {translate(
                  'Use an email code, including for an existing account without a password.',
                  'אפשר להיכנס בקוד למייל גם לחשבון קיים שעדיין אין לו סיסמה.',
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
              disabled={
                isBusy ||
                !configured ||
                !captchaToken ||
                (!isRegistration && method === 'password'
                  ? !passwordEnabled
                  : remaining > 0)
              }
            >
              {isBusy
                ? translate('Please wait…', 'רק רגע…')
                : isRegistration
                  ? translate(
                      'Create account & verify email',
                      'יצירת חשבון ואימות מייל',
                    )
                  : method === 'password'
                    ? translate('Sign in', 'התחברות')
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
