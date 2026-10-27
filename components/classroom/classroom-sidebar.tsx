'use client';
import type { AccountProfile } from '@/lib/auth-validation';
import { gradeNames } from '@/lib/demo-lessons';
import {
  BookOpen,
  LayoutGrid,
  Settings2,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

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
  const { setView, translate, view, language, localize, preferences, isDemo } =
    session;
  const classroomHome = isDemo ? '/demo' : '/classroom';

  return (
    <aside className={`sidebar ${isNavigationOpen ? 'mobile-open' : ''}`}>
      <Link className="brand" href={classroomHome} aria-label="Limud home">
        <span className="brand-mark">
          l<span>•</span>
        </span>
        limud<span className="brand-dot">.</span>
      </Link>
      <div className="workspace-label">
        {translate('YOUR LEARNING SPACE', 'מרחב הלמידה שלכם')}
      </div>
      <nav>
        <Link className="nav-item" href={classroomHome}>
          <LayoutGrid size={20} />
          {translate('All subjects', 'כל המקצועות')}
        </Link>
        <button
          className={view === 'story' ? 'nav-item active' : 'nav-item'}
          onClick={() => {
            setView('story');
            onCloseNavigation();
          }}
        >
          <BookOpen size={20} />
          {translate('Learn', 'לומדים')}
        </button>
        <button
          className={view === 'practice' ? 'nav-item active' : 'nav-item'}
          onClick={() => {
            setView('practice');
            onCloseNavigation();
          }}
        >
          <Target size={20} />
          {translate('Practice', 'מתרגלים')}
        </button>
        <button
          className={view === 'summary' ? 'nav-item active' : 'nav-item'}
          onClick={() => {
            setView('summary');
            onCloseNavigation();
          }}
        >
          <Trophy size={20} />
          {translate('Progress', 'התקדמות')}
        </button>
      </nav>
      <div className="sidebar-rule" />
      <div className="workspace-label">
        {translate('A SKILL FOR LIFE', 'מיומנות לחיים')}
      </div>
      <button className="nav-item" disabled>
        <Sparkles size={20} />
        {translate('Learning with AI', 'ללמוד עם AI')}
        <span className="tiny-new">{translate('SOON', 'בקרוב')}</span>
      </button>
      <div className="sidebar-bottom">
        <button className="profile-button" onClick={() => onOpenSettings()}>
          <span className="avatar">
            {profile.first_name?.[0]?.toUpperCase() ||
              (language === 'he' ? 'ל' : 'L')}
          </span>
          <span>
            <strong>
              {profile.first_name} {profile.last_name}
            </strong>
            <small>{localize(gradeNames[preferences.grade])}</small>
          </span>
          <Settings2 size={17} />
        </button>
      </div>
    </aside>
  );
}
