'use client';
import { useEffect, useRef, useState } from 'react';

const FLIP_DURATION_MS = 500;
const HOLD_MS = 2000; // how long the reveal stays up before flipping back

// Drives a "flip to revealed, hold, flip back" sequence whenever triggerId
// changes to a genuinely NEW non-null value. Multiple components can each
// call this with their own triggerId, computed from the same shared click
// event — since they all receive the updated trigger in the same render,
// their independent timelines start together, giving the "simultaneous"
// three-way flip the feature calls for.
export function useHintFlip(triggerId: string | null) {
  const [flipping, setFlipping] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const lastHandled = useRef<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!triggerId) {
      // A different cell became the active hint target — snap this one
      // back immediately (no animation) so it doesn't stay stuck
      // revealed if it was interrupted mid-sequence.
      if (lastHandled.current !== null) {
        timers.current.forEach(clearTimeout);
        timers.current = [];
        setFlipping(false);
        setRevealed(false);
        lastHandled.current = null;
      }
      return;
    }

    if (lastHandled.current === triggerId) return;
    lastHandled.current = triggerId;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    setFlipping(true);
    timers.current.push(
      setTimeout(() => setRevealed(true), FLIP_DURATION_MS / 2),
      setTimeout(() => setFlipping(false), FLIP_DURATION_MS),
      setTimeout(() => setFlipping(true), HOLD_MS),
      setTimeout(() => setRevealed(false), HOLD_MS + FLIP_DURATION_MS / 2),
      setTimeout(() => setFlipping(false), HOLD_MS + FLIP_DURATION_MS)
    );

    return () => timers.current.forEach(clearTimeout);
  }, [triggerId]);

  return { flipping, revealed };
}
