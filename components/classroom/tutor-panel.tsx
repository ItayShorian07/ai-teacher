'use client';
import { bilingualText } from '@/lib/i18n';
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
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
          <h3>{translate('Your learning companion', 'השותף שלכם ללמידה')}</h3>
          <span>
            {translate('Here for the aha moments', 'כאן לרגעי ההבנה')}
          </span>
        </div>
        <span className="online-dot" />
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
              {translate('Hey, curious mind.', 'היי, טוב שאתם כאן.')}{' '}
              <span>✦</span>
            </div>
            <p>
              {isSolved
                ? translate(
                    'You did it! Take a moment to notice what made the answer click.',
                    'הצלחתם! עצרו רגע וחשבו מה עזר לכם להבין.',
                  )
                : view === 'practice'
                  ? translate(
                      'Show me your thinking, one step at a time.',
                      'הראו לי את דרך החשיבה שלכם, צעד אחר צעד.',
                    )
                  : translate(
                      'Big ideas feel smaller when they start with something you love.',
                      'רעיונות גדולים נעשים פשוטים יותר כשהם מתחילים במשהו שאוהבים.',
                    )}
            </p>
            <div className="coach-prompt">
              <span>&quot;</span>
              {translate(
                "You don't have to know it yet. That's why we're here.",
                'אתם לא חייבים לדעת עדיין. בשביל זה אנחנו כאן.',
              )}
            </div>
            <button className="coach-question" onClick={showFirstHint}>
              <CircleHelp size={16} />
              {translate('Help me take the first step', 'עזרו לי בצעד הראשון')}
              <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="session-plan">
            <div className="section-label">
              {translate('OUR PLAN FOR TODAY', 'התוכנית שלנו להיום')}
            </div>
            {[
              bilingualText('Connect it to your world', 'מחברים לעולם שלכם'),
              bilingualText(
                'Build understanding, step by step',
                'בונים הבנה, צעד אחר צעד',
              ),
              bilingualText('Leave with an "I get it"', 'מסיימים עם ״הבנתי״'),
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
          <div className="coach-footer">
            <span className="leaf-icon">
              <Brain size={18} />
            </span>
            <p>
              {translate(
                'Built around understanding, not memorizing answers.',
                'לומדים כדי להבין, לא כדי לשנן תשובות.',
              )}
            </p>
          </div>
        </>
      )}
    </aside>
  );
}
