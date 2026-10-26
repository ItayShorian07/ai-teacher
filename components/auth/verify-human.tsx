'use client';
import { useCallback, useState } from 'react';
import { Captcha } from './captcha';
import { AuthFrame, authErrorText, useAuthLanguage } from './shared';
export default function VerifyHuman() {
  const { lang, setLang, t } = useAuthLanguage('he');
  const [token, setToken] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [version, setVersion] = useState(0);
  const onToken = useCallback((value: string) => setToken(value), []);
  async function verify() {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/account/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!r.ok) throw new Error();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Reload server checks after the verification cookie changes.
      window.location.assign('/classroom');
    } catch {
      setToken('');
      setVersion((v) => v + 1);
      setError('captcha');
      setBusy(false);
    }
  }
  return (
    <AuthFrame
      lang={lang}
      onLanguage={() => setLang(lang === 'he' ? 'en' : 'he')}
    >
      <h1>{t('One moment before we start', 'רגע לפני שמתחילים')}</h1>
      <p className="auth-subtitle">
        {t(
          'A quick check to protect your learning space from bots.',
          'בדיקה קצרה שמגנה על מרחב הלמידה מבוטים.',
        )}
      </p>
      <Captcha action="learning" onToken={onToken} resetKey={version} />
      {error && <p role="alert">{authErrorText(error, lang)}</p>}
      <button
        className="primary-button"
        onClick={verify}
        disabled={!token || busy}
      >
        {busy
          ? t('Checking…', 'בודקים…')
          : t('Continue to learning', 'ממשיכים ללמידה')}
      </button>
    </AuthFrame>
  );
}
