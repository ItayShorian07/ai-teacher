'use client';
import { useLanguage } from '@/hooks/use-language';
import { getAuthErrorMessage } from '@/lib/auth-error-messages';
import { AccountProfile, accountProfileSchema } from '@/lib/auth-validation';
import { type Language } from '@/lib/i18n';
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { AuthLayout } from './auth-layout';
import { ProfileFields, createProfileFormValues } from './profile-fields';

import { interests } from '@/lib/profile-interests';
import { InterestPicker } from './interest-picker';

export default function ProfileForm({
  email,
  initialProfile,
  initialLanguage,
  emailVerified,
}: {
  email: string;
  initialProfile: Partial<AccountProfile>;
  initialLanguage: Language;
  emailVerified: boolean;
}) {
  const { language, setLanguage, translate } = useLanguage(initialLanguage);

  const [details, setDetails] = useState(() =>
    createProfileFormValues(initialProfile),
  );
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(
    (initialProfile.hobbies || []).map(
      (h) => interests.find((row) => row.includes(h))?.[0] || h,
    ),
  );
  const [customHobby, setCustomHobby] = useState(
    initialProfile.custom_hobby || '',
  );
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  async function request(path: string, body: unknown) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'unavailable');
    return data;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (isBusy) return;
    setError('');
    const parsed = accountProfileSchema.safeParse({
      ...details,
      locale: language,
      hobbies: selectedHobbies,
      custom_hobby: customHobby,
    });
    if (!parsed.success) {
      setError('invalid_profile');
      return;
    }
    setIsBusy(true);
    try {
      await request('/api/account/profile', parsed.data);
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Reload server-rendered account checks after saving the profile.
      window.location.assign('/classroom');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unavailable');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <AuthLayout
      language={language}
      onToggleLanguage={() => setLanguage(language === 'he' ? 'en' : 'he')}
      step={1}
    >
      <div className="auth-card-label">
        {translate(
          'ONE ACCOUNT. ALL YOUR LEARNING.',
          'חשבון אחד. כל הלמידה שלכם.',
        )}
      </div>
      <h1>{translate('Make yourself at home', 'עכשיו זה המקום שלכם')}</h1>
      <p className="auth-subtitle">
        {translate(
          'Fill in your details to personalize your learning experience.',
          'מלאו את הפרטים כדי להתאים את חוויית הלמידה שלכם.',
        )}
      </p>

      <div className={`auth-verified ${emailVerified ? '' : 'unverified'}`}>
        <Mail size={18} />
        <bdi dir="ltr">{email}</bdi>
        {emailVerified ? (
          <>
            <CheckCircle2 size={17} />
            <span>{translate('Verified', 'מאומת')}</span>
          </>
        ) : (
          <span>{translate('Needs verification', 'דורש אימות')}</span>
        )}
      </div>

      {!emailVerified && (
        <div className="auth-error">
          {getAuthErrorMessage('email_required', language)}
        </div>
      )}
      {error && (
        <div className="auth-error" role="alert">
          {getAuthErrorMessage(error, language)}
        </div>
      )}

      <form onSubmit={save} className="auth-form">
        <ProfileFields
          language={language}
          values={details}
          onChange={setDetails}
        />
        <p className="auth-field-note">
          {translate(
            'Your school helps us tailor your learning path.',
            'שם בית הספר עוזר לנו להתאים את מסלול הלמידה שלכם.',
          )}
        </p>

        <InterestPicker
          language={language}
          values={selectedHobbies}
          onChange={setSelectedHobbies}
          custom={customHobby}
          onCustom={setCustomHobby}
        />

        <button
          className="primary-button auth-submit"
          disabled={isBusy || !emailVerified}
        >
          {isBusy
            ? translate('Saving…', 'שומרים…')
            : translate('Save & start learning', 'שמירה והתחלת למידה')}
          <ArrowRight size={17} />
        </button>
      </form>
    </AuthLayout>
  );
}
