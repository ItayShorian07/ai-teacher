'use client';
import ThemeToggle from '@/components/theme-toggle';
import type { Language } from '@/lib/i18n';
import {
  ArrowRight,
  BookOpen,
  Check,
  Globe2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
export function AuthLayout({
  language,
  onToggleLanguage,
  children,
  step = 0,
}: {
  language: Language;
  onToggleLanguage: () => void;
  children: ReactNode;
  step?: number;
}) {
  const translate = (en: string, he: string) => (language === 'he' ? he : en);
  return (
    <div className="auth-page" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <header className="auth-top">
        <Link href="/" className="brand auth-brand" aria-label="Limud">
          <span className="brand-mark">
            l<span>•</span>
          </span>
          limud<span className="brand-dot">.</span>
        </Link>
        <div>
          <ThemeToggle language={language} />
          <Link className="auth-demo-link" href="/demo">
            {translate('Explore the demo', 'להתנסות בדמו')}
            <ArrowRight size={16} />
          </Link>
          <button onClick={onToggleLanguage} className="language-button">
            <Globe2 size={17} />
            {language === 'he' ? 'English' : 'עברית'}
          </button>
        </div>
      </header>
      <main id="main-content" className="auth-layout">
        <aside className="auth-welcome">
          <span className="auth-welcome-icon">
            <Sparkles size={27} />
          </span>
          <div className="auth-eyebrow">
            {translate('A SPACE THAT GROWS WITH YOU', 'מרחב שגדל איתכם')}
          </div>
          <h2>
            {translate(
              'A little curiosity.\nA world of understanding.',
              'קצת סקרנות.\nעולם של הבנה.',
            )}
          </h2>
          <p>
            {translate(
              'A personal place for your questions, your interests, and those “now I get it” moments.',
              'מקום אישי לשאלות שלכם, לתחביבים שלכם ולרגעים שבהם הכול פתאום ברור.',
            )}
          </p>
          <div className="auth-steps">
            {[
              translate('Choose how to join', 'בוחרים איך להצטרף'),
              translate('Make this space yours', 'משלימים את הפרטים שלכם'),
              translate(
                'Verify and get ready to learn',
                'מאמתים ומוכנים ללמוד',
              ),
            ].map((text, index) => (
              <div className={step === index ? 'active' : ''} key={index}>
                <span>{step > index ? <Check size={16} /> : index + 1}</span>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="auth-welcome-foot">
            <BookOpen size={20} />
            <span>
              {translate(
                'Mathematics · Computer science · Learning with AI',
                'מתמטיקה · מדעי המחשב · למידה עם AI',
              )}
            </span>
          </div>
        </aside>
        <section className="auth-card">{children}</section>
      </main>
      <footer className="auth-bottom">
        <ShieldCheck size={16} />
        {translate(
          'Verification codes are personal. Never share them with anyone.',
          'קודי האימות אישיים. לא משתפים אותם עם אחרים.',
        )}
        <Link href="/contact">
          {translate('Contact & help', 'יצירת קשר ועזרה')}
        </Link>
      </footer>
    </div>
  );
}
export function RegistrationNotice({ language }: { language: Language }) {
  return (
    <div className="auth-setup" role="status">
      <Sparkles size={19} />
      <p>
        {language === 'he'
          ? 'ההרשמה עדיין לא פתוחה. בינתיים אפשר להתנסות בדמו ללא חשבון.'
          : 'Registration isn’t open yet. You can explore the demo without an account.'}
      </p>
    </div>
  );
}
export function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.5-.1-2.9-.4-4.3H24v8.1h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c3.9-3.6 6-8.8 6-15.2z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.8 1.2-4.1 1.9-6.8 1.9-5.3 0-9.8-3.6-11.4-8.4H5.7v5.4A20.4 20.4 0 0 0 24 44z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.4a12.3 12.3 0 0 1 0-7.8v-5.4H5.7A20.4 20.4 0 0 0 3.5 24c0 3.3.8 6.4 2.2 9.2l6.9-5.8z"
      />
      <path
        fill="#EA4335"
        d="M24 12.2c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4C16 4 9.1 8.6 5.7 15.2l6.9 5.4C14.2 15.8 18.7 12.2 24 12.2z"
      />
    </svg>
  );
}
