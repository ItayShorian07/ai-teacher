'use client';
import { useEffect, useState } from 'react';
export function useResendCooldown() {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!remaining) return;
    const timer = setTimeout(
      () => setRemaining((secondsLeft) => Math.max(0, secondsLeft - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [remaining]);
  return { remaining, start: () => setRemaining(60) };
}
