'use client';
import { hobbies, Hobby, SchoolStage, stages } from '@/lib/demo-lessons';
import { Language } from '@/lib/i18n';
import { ArrowRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import type { ClassroomSession } from '@/hooks/use-classroom-session';

export default function LearningSettings({
  session,
  onClose,
}: {
  session: ClassroomSession;
  onClose: () => void;
}) {
  const { translate, preferences, updatePreferences, localize, language } =
    session;
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
      >
        <div className="modal-heading">
          <h2 id="settings-title">
            {translate('Make this space yours', 'המרחב הזה שלכם')}
          </h2>
          <button
            ref={closeRef}
            className="icon-button"
            onClick={() => onClose()}
            aria-label={translate('Close settings', 'סגירת הגדרות')}
          >
            <X size={21} />
          </button>
        </div>
        <p>
          {translate(
            'Choose a starting point. You can change it anytime.',
            'בחרו נקודת התחלה. אפשר לשנות בכל רגע.',
          )}
        </p>
        <label>
          {translate('School stage', 'שלב לימודים')}
          <select
            value={preferences.stage}
            onChange={(event) =>
              updatePreferences({ stage: event.target.value as SchoolStage })
            }
          >
            {(Object.keys(stages) as SchoolStage[]).map((option) => (
              <option value={option} key={option}>
                {localize(stages[option])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {translate('Language', 'שפה')}
          <select
            value={language}
            onChange={(event) =>
              updatePreferences({ lang: event.target.value as Language })
            }
          >
            <option value="en">English</option>
            <option value="he">עברית</option>
          </select>
        </label>
        <label>
          {translate('Something you love', 'משהו שאתם אוהבים')}
          <select
            value={preferences.hobby}
            onChange={(event) =>
              updatePreferences({ hobby: event.target.value as Hobby })
            }
          >
            {(Object.keys(hobbies) as Hobby[]).map((hobby) => (
              <option value={hobby} key={hobby}>
                {localize(hobbies[hobby])}
              </option>
            ))}
          </select>
        </label>
        <div className="settings-divider" />
        <button className="primary-button full-width" onClick={() => onClose()}>
          {translate('Back to learning', 'בחזרה ללמידה')}
          <ArrowRight size={17} />
        </button>
      </section>
    </div>
  );
}
