'use client';
import { ArrowRight, Brain, CheckCircle2, Trophy } from 'lucide-react';

import type { ClassroomSession } from '@/hooks/use-classroom-session';

export default function SessionSummary({
  session,
}: {
  session: ClassroomSession;
}) {
  const { practiceHistory, translate, level, setView } = session;

  return (
    <section className="summary-card">
      <div className="summary-icon">
        <Trophy size={28} />
      </div>
      <h3>
        {practiceHistory.length
          ? translate(
              'Every step counts. Including the tricky ones.',
              'כל צעד חשוב. גם אלה שהיו מאתגרים.',
            )
          : translate(
              'Your progress starts with one try.',
              'ההתקדמות מתחילה בניסיון אחד.',
            )}
      </h3>
      <p>
        {practiceHistory.length
          ? translate(
              "Here's what you practiced in this session.",
              'הנה מה שתרגלתם במפגש הזה.',
            )
          : translate(
              'Solve a question to see your learning take shape here.',
              'פתרו שאלה כדי לראות כאן את הלמידה שלכם מתקדמת.',
            )}
      </p>
      <div className="stats-grid">
        <div>
          <strong>{practiceHistory.length}</strong>
          <span>{translate('Questions solved', 'שאלות שנפתרו')}</span>
        </div>
        <div>
          <strong>
            {practiceHistory.filter((record) => record.neededHelp).length}
          </strong>
          <span>{translate('Solved with support', 'נפתרו עם תמיכה')}</span>
        </div>
        <div>
          <strong>{level}/3</strong>
          <span>{translate('Practice level', 'רמת התרגול')}</span>
        </div>
      </div>
      {practiceHistory.map((record, i) => (
        <div className="record" key={i}>
          <CheckCircle2 size={18} />
          <span>
            <strong>{record.topic}</strong>
            <code dir="ltr">{record.question}</code>
          </span>
          <small>
            {record.neededHelp
              ? translate('With a little help', 'עם קצת עזרה')
              : translate('Independently', 'באופן עצמאי')}
          </small>
        </div>
      ))}
      <div className="reflection">
        <Brain size={22} />
        <div>
          <strong>
            {translate('One thought before you go', 'מחשבה אחת לפני שמסיימים')}
          </strong>
          <p>
            {practiceHistory.length
              ? translate(
                  'Could you explain the idea to a friend without looking at your answer?',
                  'האם תוכלו להסביר את הרעיון לחבר בלי להסתכל בתשובה?',
                )
              : translate(
                  'Your first question is ready.',
                  'השאלה הראשונה שלכם מוכנה.',
                )}
          </p>
        </div>
      </div>
      <button className="primary-button" onClick={() => setView('practice')}>
        {translate('Back to practice', 'בחזרה לתרגול')}
        <ArrowRight size={17} />
      </button>
    </section>
  );
}
