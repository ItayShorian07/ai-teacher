'use client';
import { useLanguage } from '@/hooks/use-language';
import { getAuthErrorMessage } from '@/lib/auth-error-messages';
import { AccountProfile } from '@/lib/auth-validation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { ArrowRight, CheckCircle2, LogOut, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AuthLayout } from './auth-layout';
export default function AccountDetails({
  profile,
  email,
  phone,
}: {
  profile: AccountProfile;
  email: string;
  phone: string;
}) {
  const { language, setLanguage, translate } = useLanguage(profile.locale);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  async function signOut() {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const { error: err } = await createBrowserSupabaseClient().auth.signOut({
        scope: 'local',
      });
      if (err) throw err;
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Clear session-scoped client state after sign-out.
      window.location.assign(`/login?lang=${language}`);
    } catch {
      setError('unavailable');
      setIsBusy(false);
    }
  }
  async function deleteAccount() {
    if (isBusy || confirmation !== 'DELETE') return;
    setIsBusy(true);
    setError('');
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });
      if (!response.ok) throw new Error();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Clear session-scoped client state after account deletion.
      window.location.assign('/');
    } catch {
      setError('delete_unavailable');
      setIsBusy(false);
    }
  }
  return (
    <AuthLayout
      language={language}
      onToggleLanguage={() => setLanguage(language === 'he' ? 'en' : 'he')}
      step={3}
    >
      <div className="account-success-icon">
        <CheckCircle2 size={34} />
      </div>
      <div className="auth-card-label">
        {translate('YOU’RE ALL SET', 'הכול מוכן')}
      </div>
      <h1>
        {translate(
          `Welcome, ${profile.first_name}`,
          `ברוכים הבאים, ${profile.first_name}`,
        )}
      </h1>
      <p className="auth-subtitle">
        {translate(
          'Your email is verified. Your account is ready.',
          'המייל אומת. החשבון שלכם מוכן.',
        )}
      </p>
      {error && (
        <div className="auth-error" role="alert">
          {getAuthErrorMessage(error, language)}
        </div>
      )}
      <dl className="account-details">
        <div>
          <dt>{translate('Full name', 'שם מלא')}</dt>
          <dd>
            {profile.first_name} {profile.last_name}
          </dd>
        </div>
        <div>
          <dt>{translate('City / town', 'עיר / יישוב')}</dt>
          <dd>{profile.city}</dd>
        </div>
        <div>
          <dt>{translate('Age', 'גיל')}</dt>
          <dd>{profile.age}</dd>
        </div>
        <div>
          <dt>
            {translate('Email', 'מייל')} <CheckCircle2 size={14} />
          </dt>
          <dd dir="ltr">{email}</dd>
        </div>
        <div>
          <dt>{translate('Phone', 'טלפון')}</dt>
          <dd dir="ltr">{phone}</dd>
        </div>
      </dl>
      <Link className="primary-button auth-submit" href="/classroom">
        {translate('Go to my classroom', 'לכיתה שלי')}
        <ArrowRight size={17} />
      </Link>
      <div className="account-actions">
        <Link href="/account/complete?edit=1">
          <Settings2 size={16} />
          {translate('Edit details', 'עריכת פרטים')}
        </Link>
        <button onClick={signOut} disabled={isBusy}>
          <LogOut size={16} />
          {translate('Sign out', 'התנתקות')}
        </button>
      </div>
      <p className="auth-field-note">
        {translate(
          'Your account details are saved. Learning progress in the demo is still limited to the current session.',
          'פרטי החשבון נשמרים. ההתקדמות הלימודית בדמו עדיין מוגבלת למפגש הנוכחי.',
        )}
      </p>
      <div className="danger-zone">
        {deleting ? (
          <>
            <p>
              {translate(
                'Permanently deletes your profile and private learning data. Type DELETE to confirm.',
                'הפעולה מוחקת לצמיתות את הפרופיל ואת נתוני הלמידה הפרטיים. הקלידו DELETE לאישור.',
              )}
            </p>
            <label className="auth-field">
              {translate('Confirmation', 'אישור מחיקה')}
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
                dir="ltr"
              />
            </label>
            <button
              className="danger-button"
              disabled={isBusy || confirmation !== 'DELETE'}
              onClick={deleteAccount}
            >
              {translate('Permanently delete', 'מחיקה לצמיתות')}
            </button>
            <button
              onClick={() => {
                setDeleting(false);
                setConfirmation('');
              }}
              disabled={isBusy}
            >
              {translate('Cancel', 'ביטול')}
            </button>
          </>
        ) : (
          <button className="danger-button" onClick={() => setDeleting(true)}>
            {translate('Delete account', 'מחיקת חשבון')}
          </button>
        )}
      </div>
    </AuthLayout>
  );
}
