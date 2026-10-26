'use client';
import AccountLink from '@/components/auth/account-link';
import ThemeToggle from '@/components/theme-toggle';
import type { AccountProfile } from '@/lib/auth-validation';
import { getLessonTopic, stages, Subject, subjects } from '@/lib/demo-lessons';
import {
  Calculator,
  Check,
  ChevronRight,
  Code2,
  Globe2,
  GraduationCap,
  LockKeyhole,
  PanelLeftClose,
  Settings2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useClassroomSession } from '@/hooks/use-classroom-session';
import type { ClassroomView } from '@/lib/classroom-session';
import ClassroomSidebar from './classroom-sidebar';
import LearningSettings from './learning-settings';
import LessonView from './lesson-view';
import PracticeView from './practice-view';
import SessionSummary from './session-summary';
import TutorPanel from './tutor-panel';
export default function Classroom({
  profile,
  isDemo = false,
  hasProAccess = false,
}: {
  profile: AccountProfile;
  isDemo?: boolean;
  hasProAccess?: boolean;
}) {
  const session = useClassroomSession(profile, { isDemo, hasProAccess });
  const {
    translate,
    localize,
    preferences,
    language,
    updatePreferences,
    view,
    currentStep,
    setView,
    notice,
  } = session;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  return (
    <div className="app-shell">
      <ClassroomSidebar
        session={session}
        profile={profile}
        isNavigationOpen={isNavigationOpen}
        onCloseNavigation={() => setIsNavigationOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-toggle icon-button"
              onClick={() => setIsNavigationOpen(!isNavigationOpen)}
              aria-label={translate('Toggle navigation', 'פתיחת ניווט')}
            >
              <PanelLeftClose size={20} />
            </button>
            {translate('My classroom', 'הכיתה שלי')}
            <ChevronRight size={14} />
            <strong>{localize(subjects[preferences.subject])}</strong>
          </div>
          <div className="top-actions">
            <ThemeToggle language={language} />
            <AccountLink language={language} />
            <button
              className="language-button"
              onClick={() =>
                updatePreferences({ lang: language === 'en' ? 'he' : 'en' })
              }
            >
              <Globe2 size={17} />
              {language === 'en' ? 'עברית' : 'English'}
            </button>
          </div>
        </header>
        <main id="main-content">
          {isDemo && (
            <div className="demo-banner">
              {translate(
                'You’re exploring the demo. AI generation and PDF reading require an account.',
                'אתם בדמו. יצירת תוכן עם AI וקריאת PDF דורשות חשבון.',
              )}{' '}
              <Link href="/register">
                {translate('Create an account', 'יצירת חשבון')}
              </Link>
            </div>
          )}
          <div className="page-intro">
            <div>
              <div className="eyebrow">
                {translate(
                  'A LITTLE CURIOSITY. A LOT OF POSSIBILITY.',
                  'קצת סקרנות. הרבה אפשרויות.',
                )}
              </div>
              <h1>
                {view === 'summary'
                  ? translate('Look how far you’ve come.', 'תראו כמה התקדמתם.')
                  : translate('Let’s make it click.', 'בואו נבין את זה יחד.')}
              </h1>
              <p>
                {translate(
                  'Your interests. Your pace. A way of learning that feels like you.',
                  'התחביבים שלכם. הקצב שלכם. דרך ללמוד שמתאימה לכם.',
                )}
              </p>
            </div>
            <button
              className="stage-button"
              onClick={() => setIsSettingsOpen(true)}
            >
              <GraduationCap size={19} />
              {localize(stages[preferences.stage])}
              <Settings2 size={15} />
            </button>
          </div>
          <div
            className="subject-tabs"
            aria-label={translate('Subject', 'מקצוע')}
          >
            {(Object.keys(subjects) as Subject[]).map((option) => {
              const Icon =
                option === 'math'
                  ? Calculator
                  : option === 'cs'
                    ? Code2
                    : Sparkles;
              return (
                <button
                  key={option}
                  className={preferences.subject === option ? 'selected' : ''}
                  onClick={() => updatePreferences({ subject: option })}
                >
                  <Icon size={19} />
                  {localize(subjects[option])}
                  {preferences.subject === option && (
                    <span className="tab-dot" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="learning-grid">
            <div className="lesson-column">
              <div className="lesson-topline">
                <span>
                  <span className="lesson-label">
                    {translate('YOUR NEXT DISCOVERY', 'התגלית הבאה שלכם')}
                  </span>
                  <h2>{localize(getLessonTopic(preferences))}</h2>
                </span>
                <span className="lesson-number">
                  01<span>/</span>03
                </span>
              </div>
              <div
                className="journey"
                aria-label={translate('Lesson steps', 'שלבי השיעור')}
              >
                {(['story', 'practice', 'summary'] as ClassroomView[]).map(
                  (value, i) => (
                    <button
                      key={value}
                      className={
                        view === value
                          ? 'current'
                          : currentStep > i
                            ? 'done'
                            : ''
                      }
                      onClick={() => setView(value)}
                    >
                      <span>
                        {currentStep > i ? <Check size={13} /> : i + 1}
                      </span>
                      {i === 0
                        ? translate('The story', 'הסיפור')
                        : i === 1
                          ? translate('Try it yourself', 'מנסים בעצמנו')
                          : translate('Reflect & grow', 'מסכמים ומתקדמים')}
                    </button>
                  ),
                )}
              </div>
              {notice && (
                <div className="notice" role="alert">
                  {notice}
                </div>
              )}
              {view === 'story' && <LessonView session={session} />}
              {view === 'practice' && <PracticeView session={session} />}
              {view === 'summary' && <SessionSummary session={session} />}
              <div className="bottom-note">
                <Link href="/contact">
                  {translate('Contact & help', 'יצירת קשר ועזרה')}
                </Link>{' '}
                · <LockKeyhole size={13} />
                {translate(
                  'A space to explore. No grades, no pressure.',
                  'מרחב לחקור. בלי ציונים, בלי לחץ.',
                )}
              </div>
            </div>
            <TutorPanel session={session} />
          </div>
        </main>
      </div>
      {isSettingsOpen && (
        <LearningSettings
          session={session}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
