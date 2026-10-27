'use client';

import AccountLink from '@/components/auth/account-link';
import ThemeToggle from '@/components/theme-toggle';
import { useLanguage } from '@/hooks/use-language';
import { useDemoProgress } from '@/hooks/use-demo-progress';
import type { AccountProfile } from '@/lib/auth-validation';
import { DEMO_QUESTION_LIMIT } from '@/lib/demo-access';
import { gradeNames } from '@/lib/demo-lessons';
import {
  ArrowRight,
  Calculator,
  Code2,
  Globe2,
  LockKeyhole,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function LearningHub({
  profile,
  isDemo = false,
}: {
  profile: AccountProfile;
  isDemo?: boolean;
}) {
  const { language, setLanguage, translate } = useLanguage(profile.locale);
  const basePath = isDemo ? '/demo' : '/classroom';
  const { limitReached: demoLimitReached } = useDemoProgress(isDemo);

  return (
    <div className="hub-shell">
      <header className="hub-header">
        <Link className="brand" href={basePath} aria-label="Limud home">
          <span className="brand-mark">
            l<span>•</span>
          </span>
          limud<span className="brand-dot">.</span>
        </Link>
        <div className="top-actions">
          <ThemeToggle language={language} />
          <AccountLink language={language} />
          <button
            className="language-button"
            onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
          >
            <Globe2 size={17} />
            {language === 'en' ? 'עברית' : 'English'}
          </button>
        </div>
      </header>

      <main className="hub-main" id="main-content">
        {isDemo && demoLimitReached ? (
          <section className="demo-limit-card">
            <span className="demo-limit-icon">
              <LockKeyhole size={28} />
            </span>
            <h1>{translate('You completed the demo', 'סיימתם את הדמו')}</h1>
            <p>
              {translate(
                'You finished the lesson and three exercises. Create a free account to continue.',
                'סיימתם שיעור ושלושה תרגילים. פתחו חשבון חינם כדי להמשיך.',
              )}
            </p>
            <div className="demo-limit-actions">
              <Link className="primary-button" href="/register">
                {translate('Create a free account', 'פתיחת חשבון חינם')}
              </Link>
              <Link className="text-button" href="/login">
                {translate('Sign in', 'התחברות')}
              </Link>
            </div>
          </section>
        ) : (
          <>
            <div className="hub-intro">
              <span className="hub-grade">
                {gradeNames[profile.grade][language]}
              </span>
              <h1>
                {translate(
                  `What do you want to learn today, ${profile.first_name}?`,
                  `מה לומדים היום, ${profile.first_name}?`,
                )}
              </h1>
              <p>
                {translate(
                  'Choose a subject. Each session starts with a short explanation and moves straight to practice.',
                  'בוחרים מקצוע. כל שיעור מתחיל בהסבר קצר וממשיך ישר לתרגול.',
                )}
              </p>
            </div>

            {isDemo && (
              <div className="hub-demo-note">
                {translate(
                  `Your demo includes one full lesson and ${DEMO_QUESTION_LIMIT} exercises.`,
                  `הדמו כולל שיעור מלא ו־${DEMO_QUESTION_LIMIT} תרגילים.`,
                )}
              </div>
            )}

            <div className="subject-grid">
              <Link className="subject-card math" href={`${basePath}/math`}>
                <span className="subject-icon">
                  <Calculator size={28} />
                </span>
                <span>
                  <small>
                    {translate('Numbers and logic', 'מספרים וחשיבה')}
                  </small>
                  <strong>{translate('Mathematics', 'מתמטיקה')}</strong>
                  <p>
                    {translate(
                      'Understand the idea, then solve it yourself.',
                      'מבינים את הרעיון ואז פותרים לבד.',
                    )}
                  </p>
                </span>
                <ArrowRight className="subject-arrow" size={22} />
              </Link>

              <Link
                className="subject-card computer-science"
                href={`${basePath}/computer-science`}
              >
                <span className="subject-icon">
                  <Code2 size={28} />
                </span>
                <span>
                  <small>
                    {translate('Code and problem solving', 'קוד ופתרון בעיות')}
                  </small>
                  <strong>{translate('Computer science', 'מדעי המחשב')}</strong>
                  <p>
                    {translate(
                      'Trace code, spot patterns, and build confidence.',
                      'עוקבים אחרי קוד, מזהים תבניות וצוברים ביטחון.',
                    )}
                  </p>
                </span>
                <ArrowRight className="subject-arrow" size={22} />
              </Link>

              <button className="subject-card future" disabled>
                <span className="subject-icon">
                  <Sparkles size={28} />
                </span>
                <span>
                  <small>{translate('Coming soon', 'בקרוב')}</small>
                  <strong>
                    {translate('Learning with AI', 'ללמוד עם AI')}
                  </strong>
                  <p>
                    {translate(
                      'A future course for smarter, safer AI use.',
                      'מסלול עתידי לשימוש חכם ובטוח ב־AI.',
                    )}
                  </p>
                </span>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
