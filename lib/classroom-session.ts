import type { AnswerFeedback } from './answer-checker';
import type { AccountProfile } from './auth-validation';
import type { Hobby } from './demo-lessons';
import { bilingualText } from './i18n';
import type { TutorFeedback } from './tutor-contract';

export type ClassroomView = 'story' | 'practice' | 'summary';
export interface PracticeRecord {
  question: string;
  neededHelp: boolean;
  topic: string;
}

export function getDefaultHobby(profile: AccountProfile): Hobby {
  const interests = [...(profile.hobbies || []), profile.custom_hobby || ''];
  for (const interest of interests) {
    const name = interest.toLowerCase();
    if (name.includes('basket') || name.includes('כדורסל')) return 'basketball';
    if (name.includes('fortnite') || name.includes('פורטנייט'))
      return 'fortnite';
    if (name.includes('foot') || name.includes('כדורגל')) return 'football';
    if (name.includes('gam') || name.includes('גיי') || name.includes('משח'))
      return 'gaming';
    if (name.includes('music') || name.includes('מוז')) return 'music';
    if (name.includes('space') || name.includes('חלל')) return 'space';
  }
  return 'football';
}

export function getNextPracticeLevel(
  history: PracticeRecord[],
  level: number,
): number {
  const readyForNextLevel =
    history.length >= 2 &&
    history.length % 2 === 0 &&
    history.slice(-2).every((record) => !record.neededHelp);
  return readyForNextLevel ? Math.min(level + 1, 3) : level;
}

export function toAnswerFeedback(feedback: TutorFeedback): AnswerFeedback {
  return {
    status: feedback.status === 'partial' ? 'continue' : feedback.status,
    message: bilingualText(feedback.feedback, feedback.feedback),
  };
}
