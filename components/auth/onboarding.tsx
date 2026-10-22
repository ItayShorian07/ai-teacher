'use client';
import { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import { AccountProfile, profileSchema } from '@/lib/auth-validation';
import { AuthFrame, AuthLang, useAuthLanguage, authErrorText } from './shared';

import { InterestPicker } from './interests';
import { interests } from '@/lib/interests';

export default function Onboarding({ email, initialProfile, initialLang, emailVerified }: { email: string; initialProfile: Partial<AccountProfile>; initialLang: AuthLang; emailVerified: boolean }) {
  const { lang, setLang, t } = useAuthLanguage(initialLang);

  const [details, setDetails] = useState({
    username: initialProfile.username || '',
    first_name: initialProfile.first_name || '',
    last_name: initialProfile.last_name || '',
    city: initialProfile.city || '',
    age: initialProfile.age?.toString() || '',
    phone: initialProfile.phone || '',
    school: initialProfile.school || '',
  });
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>((initialProfile.hobbies||[]).map(h=>interests.find(row=>row.includes(h))?.[0]||h));
  const [customHobby, setCustomHobby] = useState(initialProfile.custom_hobby || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function request(path: string, body: unknown) {
    const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'unavailable');
    return data;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    const parsed = profileSchema.safeParse({
      ...details,
      locale: lang,
      hobbies: selectedHobbies,
      custom_hobby: customHobby,
    });
    if (!parsed.success) { setError('invalid_profile'); return; }
    setBusy(true);
    try {
      await request('/api/account/profile', parsed.data);
      window.location.assign('/classroom');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unavailable');
    } finally {
      setBusy(false);
    }
  }

  const input = (field: keyof typeof details, label: string, extra: Record<string, unknown> = {}) =>
    <label className="auth-field">{label}<input value={details[field]} onChange={e => setDetails({ ...details, [field]: e.target.value })} required maxLength={field === 'school' ? 120 : field === 'city' ? 100 : 60} {...extra} /></label>;

  return (
    <AuthFrame lang={lang} onLanguage={() => setLang(lang === 'he' ? 'en' : 'he')} step={1}>
      <div className="auth-card-label">{t('ONE ACCOUNT. ALL YOUR LEARNING.', 'חשבון אחד. כל הלמידה שלכם.')}</div>
      <h1>{t('Make yourself at home', 'עכשיו זה המקום שלכם')}</h1>
      <p className="auth-subtitle">{t('Fill in your details to personalize your learning experience.', 'מלאו את הפרטים כדי להתאים את חוויית הלמידה שלכם.')}</p>

      <div className={`auth-verified ${emailVerified ? '' : 'unverified'}`}>
        <Mail size={18} /><bdi dir="ltr">{email}</bdi>
        {emailVerified ? <><CheckCircle2 size={17} /><span>{t('Verified', 'מאומת')}</span></> : <span>{t('Needs verification', 'דורש אימות')}</span>}
      </div>

      {!emailVerified && <div className="auth-error">{authErrorText('email_required', lang)}</div>}
      {error && <div className="auth-error" role="alert">{authErrorText(error, lang)}</div>}

      <form onSubmit={save} className="auth-form">
        {input('username',t('Username','שם משתמש'),{dir:'ltr',autoComplete:'username',autoCapitalize:'none',spellCheck:false,minLength:3,maxLength:30,pattern:'[A-Za-z][A-Za-z0-9_]{2,29}'})}
        <p className="auth-field-note">{t('3–30 English letters, numbers or underscores. Start with a letter.','3–30 אותיות באנגלית, ספרות או קו תחתון. מתחילים באות.')}</p>
        {/* Required fields */}
        <div className="auth-field-row">
          {input('first_name', t('First name', 'שם פרטי'), { autoComplete: 'given-name' })}
          {input('last_name', t('Last name', 'שם משפחה'), { autoComplete: 'family-name' })}
        </div>
        <div className="auth-field-row city-age">
          {input('city', t('City / town', 'עיר / יישוב'), { autoComplete: 'address-level2' })}
          {input('age', t('Age', 'גיל'), { type: 'number', min: 1, max: 120, maxLength: undefined })}
        </div>
        {input('phone', t('Mobile number', 'טלפון נייד'), { type: 'tel', dir: 'ltr', autoComplete: 'tel', placeholder: '050-123-4567', maxLength: 24, required: true })}

        {/* School — required */}
        {input('school', t('School name', 'שם בית הספר'), { autoComplete: 'organization', placeholder: t('e.g. Tel Aviv High School', 'לדוגמה: תיכון תל אביב') })}
        <p className="auth-field-note">{t('Your school helps us tailor your learning path.', 'שם בית הספר עוזר לנו להתאים את מסלול הלמידה שלכם.')}</p>

        <InterestPicker lang={lang} values={selectedHobbies} onChange={setSelectedHobbies} custom={customHobby} onCustom={setCustomHobby}/>

        <button className="primary-button auth-submit" disabled={busy || !emailVerified}>
          {busy ? t('Saving…', 'שומרים…') : t('Save & start learning', 'שמירה והתחלת למידה')}
          <ArrowRight size={17} />
        </button>
      </form>
    </AuthFrame>
  );
}
