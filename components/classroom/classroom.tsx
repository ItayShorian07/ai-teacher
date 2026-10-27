'use client';
import AccountLink from '@/components/auth/account-link';
import ThemeToggle from '@/components/theme-toggle';
import type { AccountProfile } from '@/lib/auth-validation';
import {
  getLessonTopic,
  gradeNames,
  type Subject,
  subjects,
} from '@/lib/demo-lessons';
import {
  Check,
  ChevronRight,
  Globe2,
  GraduationCap,
  PanelLeftClose,
  Settings2,
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
  subject,
  isDemo = false,
  hasProAccess = false,
}: {
  profile: AccountProfile;
  subject: Exclude<Subject, 'ai'>;
  isDemo?: boolean;
  hasProAccess?: boolean;
}) {
  const session = useClassroomSession(profile, {
    isDemo,
    hasProAccess,
    subject,
  });
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
    demoLimitReached,
    demoQuestionsRemaining,
    isSolved,
  } = session;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const classroomHome = isDemo ? '/demo' : '/classroom';
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
            <Link href={classroomHome}>
              {translate('My classroom', 'הכיתה שלי')}
            </Link>
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
                `The demo includes a full lesson and 3 exercises. ${demoQuestionsRemaining} exercises remain.`,
                `הדמו כולל שיעור מלא ו־3 תרגילים. נשארו ${demoQuestionsRemaining} תרגילים.`,
              )}
              {' · '}
              <Link href="/register">
                {translate('Create an account', 'יצירת חשבון')}
              </Link>
            </div>
          )}
          {demoLimitReached && !(view === 'practice' && isSolved) ? (
            <section className="demo-limit-card">
              <span className="demo-limit-icon">
                <GraduationCap size={30} />
              </span>
              <h1>{translate('You completed the demo', 'סיימתם את הדמו')}</h1>
              <p>
                {translate(
                  'You learned the topic and completed three exercises. Create a free account to keep your progress and continue learning.',
                  'למדתם את הנושא ופתרתם שלושה תרגילים. פתחו חשבון חינם כדי לשמור התקדמות ולהמשיך ללמוד.',
                )}
              </p>
              <div className="demo-limit-actions">
                <Link className="primary-button" href="/register">
                  {translate('Create a free account', 'פתיחת חשבון חינם')}
                </Link>
                <Link className="text-button" href="/login">
                  {translate('I already have an account', 'כבר יש לי חשבון')}
                </Link>
              </div>
            </section>
          ) : (
            <>
              <div className="page-intro">
                <div>
                  <h1>
                    {view === 'summary'
                      ? translate('Session complete', 'סיימתם את הסבב')
                      : view === 'practice'
                        ? translate('Time to practice', 'עכשיו מתרגלים')
                        : translate(
                            'Learn it step by step',
                            'לומדים צעד אחר צעד',
                          )}
                  </h1>
                  <p>
                    {translate(
                      'One short explanation, focused practice, and immediate feedback.',
                      'הסבר קצר, תרגול ממוקד ומשוב מיידי.',
                    )}
                  </p>
                </div>
                <button
                  className="grade-button"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <GraduationCap size={19} />
                  {localize(gradeNames[preferences.grade])}
                  <Settings2 size={15} />
                </button>
              </div>
              <div className="learning-grid">
                <div className="lesson-column">
                  <div className="lesson-topline">
                    <span>
                      <span className="lesson-label">
                        {localize(subjects[preferences.subject])}
                      </span>
                      <h2>{localize(getLessonTopic(preferences))}</h2>
                    </span>
                    <span className="lesson-number">
                      0{currentStep + 1}
                      <span>/</span>03
                    </span>
                  </div>
                  <div
                    className="journey"
                    aria-label={translate('Lesson steps', 'שלבי השיעור')}
                  >
                    {(['story', 'practice', 'summary'] as ClassroomView[]).map(
                      (value, index) => (
                        <button
                          key={value}
                          className={
                            view === value
                              ? 'current'
                              : currentStep > index
                                ? 'done'
                                : ''
                          }
                          onClick={() => setView(value)}
                        >
                          <span>
                            {currentStep > index ? (
                              <Check size={13} />
                            ) : (
                              index + 1
                            )}
                          </span>
                          {index === 0
                            ? translate('Learn', 'לומדים')
                            : index === 1
                              ? translate('Practice', 'מתרגלים')
                              : translate('Summary', 'מסכמים')}
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
                    </Link>
                  </div>
                </div>
                <TutorPanel session={session} />
              </div>
            </>
          )}
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
