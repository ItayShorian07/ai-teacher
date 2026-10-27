'use client';
import { bilingualText } from '@/lib/i18n';
import {
  ArrowRight,
  Check,
  CircleHelp,
  Lightbulb,
  Sparkles,
} from 'lucide-react';

import type { ClassroomSession } from '@/hooks/use-classroom-session';

export default function TutorPanel({ session }: { session: ClassroomSession }) {
  const {
    isPaused,
    translate,
    localize,
    question,
    recoveryAnswer,
    setRecoveryAnswer,
    submitRecoveryAnswer,
    hasRecoveryError,
    recoveryFeedback,
    isSolved,
    view,
    showFirstHint,
    currentStep,
  } = session;

  return (
    <aside
      className={`coach-panel ${isPaused ? 'needs-attention' : ''}`}
      aria-label={translate('Learning coach', 'מורה מלווה')}
    >
      <div className="coach-header">
        <span className="coach-avatar">
          <Sparkles size={24} />
        </span>
        <div>
          <h3>{translate('Your tutor', 'המורה האישי שלכם')}</h3>
          <span>{translate('Here when you need help', 'כאן כשצריך עזרה')}</span>
        </div>
      </div>
      {isPaused ? (
        <div className="coach-content" aria-live="polite">
          <div className="pause-label">
            <Lightbulb size={16} />
            {translate("LET'S CLEAR THIS UP", 'בואו נבין את זה')}
          </div>
          <h4>
            {translate(
              "A quick detour. Then we're back.",
              'עצירה קצרה. וממשיכים.',
            )}
          </h4>
          <p>{localize(question.explanation)}</p>
          <div className="recovery-box">
            <strong>
              {translate('Try this little check', 'בדיקת הבנה קצרה')}
            </strong>
            <code dir="ltr">{question.recovery}</code>
            <label htmlFor="recovery">
              {translate('Your answer', 'התשובה שלכם')}
            </label>
            <input
              id="recovery"
              autoFocus
              value={recoveryAnswer}
              onChange={(event) => setRecoveryAnswer(event.target.value)}
              onKeyDown={(event) =>
                event.key === 'Enter' && submitRecoveryAnswer()
              }
              dir="ltr"
              placeholder="…"
            />
            {hasRecoveryError && (
              <p className="recovery-error" role="alert">
                {localize(recoveryFeedback)}
              </p>
            )}
            <button className="primary-button" onClick={submitRecoveryAnswer}>
              {translate('Check & return', 'בודקים וחוזרים')}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="coach-content">
            <div className="coach-greeting">
              {isSolved
                ? translate('Nice work!', 'עבודה מצוינת!')
                : view === 'practice'
                  ? translate(
                      'Take it one step at a time',
                      'פותרים צעד אחר צעד',
                    )
                  : translate(
                      'Start with the main idea',
                      'מתחילים מהרעיון המרכזי',
                    )}
            </div>
            <p>
              {isSolved
                ? translate(
                    'Notice what helped you solve it, then continue.',
                    'שימו לב מה עזר לכם לפתור, ואז המשיכו.',
                  )
                : view === 'practice'
                  ? translate(
                      'Write your attempt. Ask for a hint only if you need one.',
                      'כתבו ניסיון. בקשו רמז רק אם צריך.',
                    )
                  : translate(
                      'Read the short explanation, then move to practice.',
                      'קראו את ההסבר הקצר ואז עברו לתרגול.',
                    )}
            </p>
            {view === 'practice' && !isSolved && (
              <button className="coach-question" onClick={showFirstHint}>
                <CircleHelp size={16} />
                {translate('Show me a hint', 'הציגו רמז')}
              </button>
            )}
          </div>
          <div className="session-plan">
            <div className="section-label">{translate('TODAY', 'היום')}</div>
            {[
              bilingualText('Learn', 'לומדים'),
              bilingualText('Practice', 'מתרגלים'),
              bilingualText('Review progress', 'בודקים התקדמות'),
            ].map((item, index) => (
              <div
                className={`plan-step ${index === currentStep ? 'active' : ''}`}
                key={index}
              >
                <span>
                  {index < currentStep ? <Check size={14} /> : index + 1}
                </span>
                {localize(item)}
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
