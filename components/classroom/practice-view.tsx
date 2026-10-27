'use client';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Send,
} from 'lucide-react';

import type { ClassroomSession } from '@/hooks/use-classroom-session';
import Link from 'next/link';

export default function PracticeView({
  session,
}: {
  session: ClassroomSession;
}) {
  const {
    translate,
    level,
    variant,
    localize,
    question,
    preferences,
    isCoachingEnabled,
    isPaused,
    isDemo,
    hasProAccess,
    setIsCoachingEnabled,
    inputRef,
    answerDraft,
    isSolved,
    isBusy,
    updateAnswerDraft,
    submitAnswer,
    answerFeedback,
    isHintVisible,
    toggleHint,
    nextQuestion,
    uploadAnswerPdf,
    generatedQuestion,
    demoLimitReached,
  } = session;

  return (
    <section className="practice-card">
      <div className="practice-heading">
        <span className="level-pill">
          {translate('LEVEL', 'רמה')} {level} ·{' '}
          {level === 1
            ? translate('Building confidence', 'בונים ביטחון')
            : level === 2
              ? translate('Going deeper', 'מעמיקים')
              : translate('Ready for a challenge', 'מוכנים לאתגר')}
        </span>
        <span className="question-index">
          {translate('Question', 'שאלה')} {variant + 1}
        </span>
      </div>
      <h3>{localize(question.prompt)}</h3>
      <pre
        className={
          preferences.subject === 'cs' ? 'code-block' : 'question-equation'
        }
        dir="ltr"
      >
        {question.expression}
      </pre>
      <div className="answer-heading">
        <label htmlFor="answer">
          {translate('Your thinking space', 'המקום שלכם לחשוב')}
        </label>
        <label className="switch-label">
          <input
            type="checkbox"
            checked={isCoachingEnabled}
            disabled={isPaused || (!isDemo && !hasProAccess)}
            onChange={(event) => setIsCoachingEnabled(event.target.checked)}
          />
          <span className="switch" />
          {translate('Coach as I solve', 'ליווי בזמן הפתרון')}
          {!isDemo && ' · Pro'}
        </label>
      </div>
      <textarea
        id="answer"
        ref={inputRef}
        value={answerDraft}
        dir="ltr"
        disabled={isPaused || isSolved || isBusy}
        onChange={(event) => updateAnswerDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && isCoachingEnabled) {
            event.preventDefault();
            submitAnswer(false);
          }
        }}
        placeholder={translate(
          'Write your working or final answer here…',
          'כתבו כאן את הדרך או את התשובה…',
        )}
        rows={5}
      />
      <div className="input-help">
        {isCoachingEnabled
          ? translate(
              'Enter checks a completed step · Shift + Enter adds a line',
              'Enter בודק שלב שהושלם · Shift + Enter מוסיף שורה',
            )
          : translate(
              'Take your time. Feedback comes when you submit.',
              'קחו את הזמן. המשוב יגיע כשתשלחו את התשובה.',
            )}
      </div>
      {answerFeedback && (
        <div role="status" className={`answer-result ${answerFeedback.status}`}>
          <span>
            {answerFeedback.status === 'correct' ? (
              <CheckCircle2 size={20} />
            ) : (
              <Lightbulb size={20} />
            )}
          </span>
          <p>{localize(answerFeedback.message)}</p>
        </div>
      )}
      {isHintVisible && (
        <div className="hint-box">
          <Lightbulb size={18} />
          <p>{localize(question.hint)}</p>
        </div>
      )}
      <div className="practice-actions">
        <button
          className="text-button"
          onClick={toggleHint}
          disabled={isSolved}
        >
          <Lightbulb size={17} />
          {translate('A little hint', 'רמז קטן')}
        </button>
        {isSolved && demoLimitReached ? (
          <Link className="primary-button" href="/register">
            {translate('Continue with a free account', 'ממשיכים עם חשבון חינם')}
            <ArrowRight size={17} />
          </Link>
        ) : isSolved ? (
          <button
            className="primary-button"
            onClick={nextQuestion}
            disabled={isBusy}
          >
            {translate('Next challenge', 'האתגר הבא')}
            <ArrowRight size={17} />
          </button>
        ) : (
          <button
            className="primary-button"
            onClick={() => submitAnswer(!isCoachingEnabled)}
            disabled={!answerDraft.trim() || isPaused || isBusy}
          >
            {isBusy
              ? translate('Checking…', 'בודקים…')
              : isCoachingEnabled
                ? translate('Check my step', 'בדיקת השלב שלי')
                : translate('Submit answer', 'שליחת תשובה')}
            <Send size={16} />
          </button>
        )}
      </div>
      {!isDemo && (
        <>
          <div className="pdf-answer">
            <label>
              {translate(
                'Handwritten answer? Attach a PDF (up to 3 MB)',
                'פתרתם בכתב יד? צרפו PDF (עד 3MB)',
              )}
              <input
                type="file"
                accept="application/pdf,.pdf"
                disabled={isBusy || isPaused || isSolved}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) void uploadAnswerPdf(file);
                }}
              />
            </label>
            <p className="auth-field-note">
              {translate(
                'The file is sent to AI for transcription and is not saved on this site.',
                'הקובץ נשלח ל־AI לזיהוי הטקסט ואינו נשמר באתר.',
              )}
            </p>
          </div>
          <button
            className="text-button"
            disabled={isBusy || isPaused}
            onClick={nextQuestion}
          >
            {translate('Create a new AI question', 'יצירת שאלה חדשה עם AI')}
          </button>
        </>
      )}
      <div className="practice-source">
        <BookOpen size={13} />
        {generatedQuestion
          ? translate('Original AI question', 'שאלה מקורית של AI')
          : localize(question.source)}
      </div>
    </section>
  );
}
