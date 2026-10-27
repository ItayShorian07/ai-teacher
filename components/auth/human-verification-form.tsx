'use client';
import { useLanguage } from '@/hooks/use-language';
import { getAuthErrorMessage } from '@/lib/auth-error-messages';
import { useCallback, useState } from 'react';
import { AuthLayout } from './auth-layout';
import { TurnstileChallenge } from './turnstile-challenge';
export default function HumanVerificationForm() {
  const { language, setLanguage, translate } = useLanguage('he');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const onToken = useCallback((value: string) => setToken(value), []);
  async function verify() {
    setIsBusy(true);
    setError('');
    try {
      const response = await fetch('/api/account/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Reload server checks after the verification cookie changes.
      window.location.assign('/classroom');
    } catch {
      setToken('');
      setVersion((value) => value + 1);
      setError('captcha');
      setIsBusy(false);
    }
  }
  return (
    <AuthLayout
      language={language}
      onToggleLanguage={() => setLanguage(language === 'he' ? 'en' : 'he')}
    >
      <h1>{translate('One moment before we start', 'רגע לפני שמתחילים')}</h1>
      <p className="auth-subtitle">
        {translate(
          'A quick check to protect your learning space from bots.',
          'בדיקה קצרה שמגנה על מרחב הלמידה מבוטים.',
        )}
      </p>
      <TurnstileChallenge
        action="learning"
        onToken={onToken}
        resetKey={version}
      />
      {error && <p role="alert">{getAuthErrorMessage(error, language)}</p>}
      <button
        className="primary-button"
        onClick={verify}
        disabled={!token || isBusy}
      >
        {isBusy
          ? translate('Checking…', 'בודקים…')
          : translate('Continue to learning', 'ממשיכים ללמידה')}
      </button>
    </AuthLayout>
  );
}
