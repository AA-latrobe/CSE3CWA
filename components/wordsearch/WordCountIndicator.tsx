'use client';
import { useEffect, useRef, useState } from 'react';

type Props = {
  requiredCount: number;
  currentCount: number;
};

const FLIP_DURATION_MS = 500;

export default function WordCountIndicator({ requiredCount, currentCount }: Props) {
  const isMatch = currentCount === requiredCount;
  const targetColorClass = isMatch ? 'bg-match text-match-foreground' : 'bg-partial text-partial-foreground';

  const [displayValue, setDisplayValue] = useState(requiredCount);
  const [displayColorClass, setDisplayColorClass] = useState(targetColorClass);
  const [isFlipping, setIsFlipping] = useState(false);
  const isFirstRender = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Don't animate on mount — show the correct starting state instantly,
    // same pattern used elsewhere for restored/initial values.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Nothing changed (e.g. an unrelated re-render) — skip.
    if (displayValue === requiredCount && displayColorClass === targetColorClass) return;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    setIsFlipping(true);
    timers.current.push(
      setTimeout(() => {
        setDisplayValue(requiredCount);
        setDisplayColorClass(targetColorClass);
      }, FLIP_DURATION_MS / 2),
      setTimeout(() => setIsFlipping(false), FLIP_DURATION_MS)
    );

    return () => timers.current.forEach(clearTimeout);
  }, [requiredCount, targetColorClass]);

  return (
    <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-foreground">
      <span>Select</span>
      <div style={{ perspective: '400px' }}>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-md text-base font-semibold ${displayColorClass} ${
            isFlipping ? 'animate-tile-flip' : ''
          }`}
        >
          {displayValue}
        </div>
      </div>
      <span>Words</span>
    </div>
  );
}
