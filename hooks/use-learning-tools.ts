'use client';

import { registerLearningState, type LearningSnapshot } from '@/lib/webmcp';
import { useEffect, useRef } from 'react';

export function useLearningTools(snapshot: LearningSnapshot) {
  const currentSnapshot = useRef(snapshot);
  useEffect(() => {
    currentSnapshot.current = snapshot;
  }, [snapshot]);
  useEffect(() => registerLearningState(() => currentSnapshot.current), []);
}
