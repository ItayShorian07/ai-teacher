'use client';
import { FormEvent, useCallback, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { browserSupabase } from '@/lib/supabase/client';
import { authErrorCode, emailSchema, otpSchema } from '@/lib/auth-validation';
import { newPasswordSchema } from '@/lib/password-validation';
import { AuthFrame, AuthLang, authErrorText, SetupNotice, useAuthLanguage, useCooldown } from './shared';
import { Captcha } from './captcha';

export default function PasswordReset({ configured, initialLang, userId }: { configured: boolean; initialLang: AuthLang; userId?: string }) {
  const { lang, setLang, t } = useAuthLanguage(initialLang);
  const [step, setStep] = useState<'email'|'code'|'password'|'done'>(userId ? 'password' : 'email');
  const [identity, setIdentity] = useState(userId);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { remaining, start } = useCooldown();
  const onCaptcha = useCallback((value: string) => setCaptchaToken(value), []);
  const resetCaptcha = () => { setCaptchaToken(''); setCaptchaVersion(value => value + 1); };

  async function send(event?: FormEvent) {
    event?.preventDefault();
    if (busy || remaining) return;
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) { setError('invalid_email'); return; }
    if (!configured) { setError('not_configured'); return; }
    if (!captchaToken) { setError('captcha'); return; }
    setBusy(true); setError('');
    try {
      const { error } = await browserSupabase().auth.resetPasswordForEmail(parsed.data, {
        captchaToken, redirectTo: `${window.location.origin}/auth/callback?next=password`,
      });
      if (error) throw error;
      setEmail(parsed.data); setStep('code'); start();
    } catch (error) { setError(authErrorCode(error)); }
    finally { setBusy(false); resetCaptcha(); }
  }
  async function verify(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    if (!otpSchema.safeParse(code).success) { setError('invalid_code'); return; }
    setBusy(true); setError('');
    try {
      const { data, error } = await browserSupabase().auth.verifyOtp({ email, token: code, type: 'recovery' });
      if (error) throw error;
      if (!data.session || !data.user) { setError('invalid_code'); return; }
      setIdentity(data.user.id); setStep('password'); setCode('');
    } catch (error) { setError(authErrorCode(error)); }
    finally { setBusy(false); }
  }
  async function change(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    if (password !== confirmation) { setError('password_mismatch'); return; }
    if (!newPasswordSchema.safeParse(password).success) { setError('weak_password'); return; }
    setBusy(true); setError('');
    try {
      const client = browserSupabase();
      const { data: { user }, error: sessionError } = await client.auth.getUser();
      if (sessionError || !user || user.id !== identity || !user.email_confirmed_at) { setError('unauthorized'); return; }
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      setPassword(''); setConfirmation(''); setStep('done');
      // Supabase invalidates refresh tokens; already-issued access tokens have their usual TTL.
      await client.auth.signOut({ scope: 'global' }).catch(() => undefined);
    } catch (error) { setError(authErrorCode(error)); }
    finally { setBusy(false); }
  }

  return <AuthFrame lang={lang} onLanguage={() => setLang(lang === 'he' ? 'en' : 'he')}>
    <div className="auth-card-label">{t('YOUR ACCOUNT, BACK IN YOUR HANDS', 'חוזרים לחשבון שלכם')}</div>
    <h1>{step === 'done' ? t('Password updated', 'הסיסמה עודכנה') : step === 'password' ? t('Choose a password', 'בוחרים סיסמה') : t('Reset your password', 'איפוס סיסמה')}</h1>
    <p className="auth-subtitle">{step === 'code' ? t('If this email belongs to an account, a reset message has been sent. Enter its code or use its link in this browser.', 'אם המייל משויך לחשבון, נשלחה אליו הודעת איפוס. הזינו את הקוד שבה או פתחו את הקישור באותו דפדפן.') : step === 'password' ? t('At least 12 characters. You can use several unrelated words.', 'לפחות 12 תווים. אפשר להשתמש בכמה מילים שאינן קשורות זו לזו.') : step === 'done' ? t('You can now sign in with your username or email and your new password.', 'כעת אפשר להתחבר עם שם המשתמש או המייל והסיסמה החדשה.') : t('Use the verified email associated with your account. This also lets existing email-code users set a password.', 'השתמשו במייל המאומת של החשבון. אפשר כך להגדיר סיסמה גם לחשבון שנכנס עד עכשיו בקוד למייל.')}</p>
    {!configured && step === 'email' && <SetupNotice lang={lang}/>}
    {error && <div className="auth-error" role="alert">{authErrorText(error, lang)}</div>}
    {step === 'email' && <form className="auth-form" onSubmit={send}>
      <label className="auth-field">{t('Email address', 'כתובת מייל')}<input name="email" type="email" autoComplete="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} required/></label>
      {configured && <Captcha onToken={onCaptcha} resetKey={captchaVersion}/>}
      <button className="primary-button auth-submit" disabled={busy || !configured || !captchaToken || remaining > 0}>{busy ? t('Sending…', 'שולחים…') : t('Send reset email', 'שליחת מייל לאיפוס')}<ArrowRight size={17}/></button>
    </form>}
    {step === 'code' && <>
      <div className="auth-recipient"><bdi dir="ltr">{email}</bdi></div>
      <form className="auth-form" onSubmit={verify}>
        <label className="auth-field">{t('Reset code', 'קוד האיפוס')}<input className="otp-input" inputMode="numeric" autoComplete="one-time-code" dir="ltr" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} maxLength={10} pattern="[0-9]{6,10}" required/></label>
        <button className="primary-button auth-submit" disabled={busy}>{t('Verify code', 'אימות הקוד')}<ArrowRight size={17}/></button>
      </form>
      <Captcha onToken={onCaptcha} resetKey={captchaVersion}/>
      <button className="auth-back" onClick={() => send()} disabled={busy || remaining > 0 || !captchaToken}>{remaining ? t(`Resend in ${remaining}s`, `שליחה חוזרת בעוד ${remaining} שניות`) : t('Resend reset email', 'שליחה חוזרת של מייל האיפוס')}</button>
    </>}
    {step === 'password' && <form className="auth-form" onSubmit={change}>
      <label className="auth-field">{t('New password', 'סיסמה חדשה')}<input type="password" autoComplete="new-password" dir="ltr" value={password} onChange={e => setPassword(e.target.value)} minLength={12} maxLength={128} required/></label>
      <label className="auth-field">{t('Confirm password', 'אימות סיסמה')}<input type="password" autoComplete="new-password" dir="ltr" value={confirmation} onChange={e => setConfirmation(e.target.value)} minLength={12} maxLength={128} required/></label>
      <button className="primary-button auth-submit" disabled={busy}>{busy ? t('Saving…', 'שומרים…') : t('Save password', 'שמירת סיסמה')}<ArrowRight size={17}/></button>
    </form>}
    {step === 'done' && <div className="account-success-icon"><CheckCircle2 size={30}/></div>}
    <Link className="auth-guest" href={`/login?lang=${lang}`}>{t('Back to sign in', 'חזרה להתחברות')}<ArrowRight size={16}/></Link>
  </AuthFrame>;
}
