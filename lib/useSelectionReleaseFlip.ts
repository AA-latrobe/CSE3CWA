'use client';
import { useEffect, useRef, useState } from 'react';

const FLIP_DURATION_MS = 500;
const HOLD_MS = 1000;

// Opposite of useHintFlip's shape: this cell is ALREADY highlighted the
// instant releaseToken is set (mirroring the moment the mouse was
// released while dragging over it, live-highlighted with no animation),
// holds for HOLD_MS, then flips back to normal.
export function useSelectionReleaseFlip(releaseToken: string | null) {
  const [highlighted, setHighlighted] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const lastToken = useRef<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!releaseToken) {
      // New drag started (or selection cleared) before this cell's hold
      // finished — snap back immediately, no lingering animation.
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setHighlighted(false);
      setFlipping(false);
      lastToken.current = null;
      return;
    }

    if (lastToken.current === releaseToken) return;
    lastToken.current = releaseToken;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    setHighlighted(true);
    setFlipping(false);

    timers.current.push(
      setTimeout(() => setFlipping(true), HOLD_MS),
      setTimeout(() => setHighlighted(false), HOLD_MS + FLIP_DURATION_MS / 2),
      setTimeout(() => setFlipping(false), HOLD_MS + FLIP_DURATION_MS)
    );

    return () => timers.current.forEach(clearTimeout);
  }, [releaseToken]);

  return { highlighted, flipping };
}
