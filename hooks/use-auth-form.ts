'use client';
import { useLanguage } from '@/hooks/use-language';
import { useResendCooldown } from '@/hooks/use-resend-cooldown';
import { postJson } from '@/lib/api-client';
import {
  accountProfileSchema,
  emailSchema,
  getAuthErrorCode,
  otpSchema,
} from '@/lib/auth-validation';
import { Language } from '@/lib/i18n';
import {
  identifierSchema,
  newPasswordSchema,
  passwordLoginResponseSchema,
} from '@/lib/password-validation';
import { createProfileFormValues } from '@/lib/profile-form-values';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { FormEvent, useCallback, useState } from 'react';

export interface AuthFormOptions {
  mode: 'login' | 'register';
  configured: boolean;
  passwordEnabled: boolean;
  googleEnabled: boolean;
  initialLanguage: Language;
  errorCode?: string;
}

export function useAuthForm({
  mode,
  configured,
  initialLanguage,
  googleEnabled,
  passwordEnabled,
  errorCode = '',
}: AuthFormOptions) {
  const { language, setLanguage, translate } = useLanguage(initialLanguage);
  const isRegistration = mode === 'register';
  const [email, setEmail] = useState('');
  const [details, setDetails] = useState(() => createProfileFormValues());
  const [method, setMethod] = useState<'password' | 'code'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [customHobby, setCustomHobby] = useState('');
  const [step, setStep] = useState<'details' | 'email'>('details');
  const [token, setToken] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState(errorCode);
  const { remaining, start } = useResendCooldown();
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const onCaptcha = useCallback((value: string) => setCaptchaToken(value), []);
  function resetCaptcha() {
    setCaptchaToken('');
    setCaptchaVersion((value) => value + 1);
  }
  async function sendEmailCode(event?: FormEvent) {
    event?.preventDefault();
    if (isBusy || remaining) return;
    setError('');
    if (!configured) {
      setError('not_configured');
      return;
    }
    const validatedEmail = emailSchema.safeParse(email);
    if (!validatedEmail.success) {
      setError('invalid_email');
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
      setError('invalid_profile');
      return;
    }
    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || !captchaToken) {
      setError('captcha');
      return;
    }
    if (
      isRegistration &&
      step === 'details' &&
      (!newPasswordSchema.safeParse(password).success ||
        password !== confirmPassword)
    ) {
      setError(
        password !== confirmPassword ? 'password_mismatch' : 'weak_password',
      );
      return;
    }
    setIsBusy(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: authError } = isRegistration
        ? step === 'email'
          ? await supabase.auth.resend({
              type: 'signup',
              email: validatedEmail.data,
              options: { captchaToken },
            })
          : await supabase.auth.signUp({
              email: validatedEmail.data,
              password,
              options: {
                data: profile?.success ? profile.data : {},
                captchaToken,
                emailRedirectTo: `${window.location.origin}/auth/callback`,
              },
            })
        : await supabase.auth.signInWithOtp({
            email: validatedEmail.data,
            options: { shouldCreateUser: false, captchaToken },
          });
      // A sign-in request for an unknown email must not reveal account existence.
      if (
        authError &&
        authError.code !== 'otp_disabled' &&
        authError.code !== 'user_not_found'
      )
        throw authError;
      setEmail(validatedEmail.data);
      setStep('email');
      setPassword('');
      setConfirmPassword('');
      start();
    } catch (error) {
      setError(getAuthErrorCode(error));
    } finally {
      setIsBusy(false);
      resetCaptcha();
    }
  }
  async function signInWithPassword(event: FormEvent) {
    event.preventDefault();
    if (isBusy) return;
    setError('');
    if (!passwordEnabled) {
      setError('not_configured');
      return;
    }
    if (!identifierSchema.safeParse(identifier).success || !password) {
      setError('invalid_login');
      return;
    }
    if (!captchaToken) {
      setError('captcha');
      return;
    }
    setIsBusy(true);
    try {
      await postJson(
        '/api/auth/password',
        { identifier, password, captchaToken },
        passwordLoginResponseSchema,
      );
      setPassword('');
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Clear client state after the session changes.
      window.location.assign('/account/complete');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'unavailable');
    } finally {
      setIsBusy(false);
      resetCaptcha();
    }
  }
  async function verifyEmailCode(event: FormEvent) {
    event.preventDefault();
    if (isBusy) return;
    const parsed = otpSchema.safeParse(token);
    if (!parsed.success) {
      setError('invalid_code');
      return;
    }
    setIsBusy(true);
    setError('');
    try {
      const { data, error: authError } =
        await createBrowserSupabaseClient().auth.verifyOtp({
          email,
          token: parsed.data,
          type: 'email',
        });
      if (authError || !data.session) {
        setError(authError ? getAuthErrorCode(authError) : 'invalid_code');
        return;
      }
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Clear client state after the session changes.
      window.location.assign('/account/complete');
    } catch {
      setError('unavailable');
    } finally {
      setIsBusy(false);
    }
  }
  async function signInWithGoogle() {
    if (!googleEnabled || isBusy) return;
    setIsBusy(true);
    setError('');
    try {
      const { error: authError } =
        await createBrowserSupabaseClient().auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
      if (authError) throw authError;
    } catch (error) {
      setError(getAuthErrorCode(error));
      setIsBusy(false);
    }
  }

  return {
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
  };
}
