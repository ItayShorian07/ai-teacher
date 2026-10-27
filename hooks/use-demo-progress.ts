'use client';

import {
  DEMO_PROGRESS_KEY,
  DEMO_QUESTION_LIMIT,
  parseDemoCompletions,
} from '@/lib/demo-access';
import { useSyncExternalStore } from 'react';

const progressEvent = 'limud:demo-progress';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(progressEvent, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(progressEvent, onChange);
  };
}

function getProgress() {
  return parseDemoCompletions(window.localStorage.getItem(DEMO_PROGRESS_KEY));
}

export function useDemoProgress(enabled: boolean) {
  const completions = useSyncExternalStore(
    enabled ? subscribe : () => () => {},
    enabled ? getProgress : () => 0,
    () => 0,
  );

  return {
    completions,
    limitReached: enabled && completions >= DEMO_QUESTION_LIMIT,
    questionsRemaining: enabled
      ? Math.max(0, DEMO_QUESTION_LIMIT - completions)
      : DEMO_QUESTION_LIMIT,
  };
}

export function recordDemoCompletion() {
  const current = getProgress();
  const next = Math.min(current + 1, DEMO_QUESTION_LIMIT);
  window.localStorage.setItem(DEMO_PROGRESS_KEY, String(next));
  window.dispatchEvent(new Event(progressEvent));
}
