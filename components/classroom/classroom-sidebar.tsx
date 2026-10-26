'use client';
import type { AccountProfile } from '@/lib/auth-validation';
import { stages } from '@/lib/demo-lessons';
import {
  BookOpen,
  Lightbulb,
  Settings2,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';

import type { ClassroomSession } from '@/hooks/use-classroom-session';

export default function ClassroomSidebar({
  session,
  profile,
  isNavigationOpen,
  onCloseNavigation,
  onOpenSettings,
}: {
  session: ClassroomSession;
  profile: AccountProfile;
  isNavigationOpen: boolean;
  onCloseNavigation: () => void;
  onOpenSettings: () => void;
}) {
  const {
    setView,
    translate,
    view,
    updatePreferences,
    language,
    localize,
    preferences,
  } = session;

  return (
    <aside className={`sidebar ${isNavigationOpen ? 'mobile-open' : ''}`}>
      <a
        className="brand"
        href="#"
        onClick={(event) => {
          event.preventDefault();
          setView('story');
        }}
        aria-label="Limud home"
      >
        <span className="brand-mark">
          l<span>•</span>
        </span>
        limud<span className="brand-dot">.</span>
      </a>
      <div className="workspace-label">
        {translate('YOUR LEARNING SPACE', 'מרחב הלמידה שלכם')}
      </div>
      <nav>
        <button
          className={view === 'story' ? 'nav-item active' : 'nav-item'}
          onClick={() => {
            setView('story');
            onCloseNavigation();
          }}
        >
          <BookOpen size={20} />
          {translate('My classroom', 'הכיתה שלי')}
        </button>
        <button
          className={view === 'practice' ? 'nav-item active' : 'nav-item'}
          onClick={() => {
            setView('practice');
            onCloseNavigation();
          }}
        >
          <Target size={20} />
          {translate('Practice studio', 'מרחב התרגול')}
        </button>
        <button
          className={view === 'summary' ? 'nav-item active' : 'nav-item'}
          onClick={() => {
            setView('summary');
            onCloseNavigation();
          }}
        >
          <Trophy size={20} />
          {translate('My progress', 'ההתקדמות שלי')}
        </button>
      </nav>
      <div className="sidebar-rule" />
      <div className="workspace-label">
        {translate('A SKILL FOR LIFE', 'מיומנות לחיים')}
      </div>
      <button
        className="nav-item"
        onClick={() => {
          updatePreferences({ subject: 'ai' });
          onCloseNavigation();
        }}
      >
        <Sparkles size={20} />
        {translate('Learning with AI', 'ללמוד עם AI')}
        <span className="tiny-new">{translate('NEW', 'חדש')}</span>
      </button>
      <div className="sidebar-bottom">
        <div className="mindset-card">
          <Lightbulb size={23} />
          <p>
            {translate(
              'Understanding starts with a good question.',
              'הבנה מתחילה בשאלה טובה.',
            )}
          </p>
          <span>
            {translate(
              'Take your time. Make it yours.',
              'בקצב שלכם. בדרך שלכם.',
            )}
          </span>
        </div>
        <button className="profile-button" onClick={() => onOpenSettings()}>
          <span className="avatar">
            {profile.first_name?.[0]?.toUpperCase() ||
              (language === 'he' ? 'ל' : 'L')}
          </span>
          <span>
            <strong>
              {profile.first_name} {profile.last_name}
            </strong>
            <small>{localize(stages[preferences.stage]).split(' · ')[0]}</small>
          </span>
          <Settings2 size={17} />
        </button>
      </div>
    </aside>
  );
}
