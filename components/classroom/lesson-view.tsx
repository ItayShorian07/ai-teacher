'use client';
import { InterestPicker } from '@/components/auth/interest-picker';
import { hobbies, Hobby } from '@/lib/demo-lessons';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Gamepad2,
  Music2,
  Rocket,
  Sparkles,
  Volleyball,
} from 'lucide-react';
import { useState } from 'react';

import type { ClassroomSession } from '@/hooks/use-classroom-session';
const hobbyIcons = {
  football: Volleyball,
  gaming: Gamepad2,
  music: Music2,
  space: Rocket,
};

export default function LessonView({ session }: { session: ClassroomSession }) {
  const {
    translate,
    generatedLesson,
    localize,
    lesson,
    preferences,
    selectHobby,
    isDemo,
    language,
    interests,
    customHobby,
    setView,
    generateLesson,
    isBusy,
    updateInterests,
    updateCustomHobby,
  } = session;
  const [isSourceVisible, setIsSourceVisible] = useState(false);
  return (
    <>
      <section className="story-card">
        <div className="card-kicker">
          <span>
            <Sparkles size={16} />
            {translate('A LESSON THAT GETS YOU', 'שיעור שמבין אתכם')}
          </span>
          <span>{translate('4 min read', '4 דקות קריאה')}</span>
        </div>
        <div className="story-title">
          <h3>
            {generatedLesson
              ? translate('Your personalized lesson', 'השיעור האישי שלכם')
              : localize(lesson.title)}
          </h3>
        </div>
        <div className="hobby-row">
          <span>{translate('Make it about', 'נלמד דרך')}</span>
          {(Object.keys(hobbies) as Hobby[]).map((hobby) => {
            const Icon = hobbyIcons[hobby];
            return (
              <button
                key={hobby}
                className={preferences.hobby === hobby ? 'chosen' : ''}
                onClick={() => selectHobby(hobby)}
              >
                <Icon size={14} />
                {localize(hobbies[hobby])}
              </button>
            );
          })}
        </div>
        {!isDemo && (
          <div className="story-interests">
            <details>
              <summary>
                {translate(
                  'More interests & your own ideas',
                  'עוד תחביבים ודברים שאתם אוהבים',
                )}
              </summary>
              <InterestPicker
                language={language}
                values={interests}
                onChange={updateInterests}
                custom={customHobby}
                onCustom={updateCustomHobby}
              />
            </details>
          </div>
        )}
        <div className="story-text">
          {generatedLesson
            ? generatedLesson.text
                .split('\n')
                .filter(Boolean)
                .map((line, index) => <p key={index}>{line}</p>)
            : lesson.paragraphs.map((line, index) => (
                <p key={index}>{localize(line)}</p>
              ))}
        </div>
        <button
          className="source-toggle"
          onClick={() => setIsSourceVisible(!isSourceVisible)}
        >
          <BookOpen size={14} />
          {translate('Learning source', 'מקור הלימוד')}
          <ChevronRight size={13} className={isSourceVisible ? 'rotate' : ''} />
        </button>
        {isSourceVisible && (
          <p className="source-text">
            {generatedLesson
              ? generatedLesson.sources.length
                ? generatedLesson.sources.join(' · ')
                : translate(
                    'Original AI explanation · not a reviewed curriculum source',
                    'הסבר מקורי של AI · אינו מקור לימודי מאושר',
                  )
              : localize(lesson.source)}
          </p>
        )}
      </section>
      <div className="lesson-footer">
        <span>
          <CheckCircle2 size={16} />
          {translate(
            'A small idea. A strong foundation.',
            'רעיון קטן. בסיס חזק.',
          )}
        </span>
        <button className="primary-button" onClick={() => setView('practice')}>
          {translate("Let's practice", 'בואו נתרגל')}
          <ArrowRight size={17} />
        </button>
      </div>
      <button
        className="text-button"
        onClick={generateLesson}
        disabled={isBusy || isDemo}
      >
        <Sparkles size={16} />
        {isBusy
          ? translate('Creating your lesson…', 'יוצרים את השיעור…')
          : translate(
              'Create a personalized story with AI',
              'יצירת סיפור אישי עם AI',
            )}
      </button>
    </>
  );
}
