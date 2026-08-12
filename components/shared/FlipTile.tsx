'use client';
import { useEffect, useRef, useState } from 'react';

type Props = {
  value: string | number;
  className?: string; // sizing/color classes, e.g. "h-12 w-14 bg-match text-match-foreground"
};

const FLIP_DURATION_MS = 500;

export default function FlipTile({ value, className = '' }: Props) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    prevValue.current = value;
    setIsFlipping(true);

    // Swap the visible value at the animation's midpoint — the tile is
    // edge-on and invisible at that instant, so the change reads as
    // happening "underneath" the flip, exactly like Wordle's tiles.
    const swapTimer = setTimeout(() => setDisplayValue(value), FLIP_DURATION_MS / 2);
    const endTimer = setTimeout(() => setIsFlipping(false), FLIP_DURATION_MS);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(endTimer);
    };
  }, [value]);

  return (
    <div style={{ perspective: '400px' }}>
      <div
        className={`flex items-center justify-center rounded-md font-semibold ${className} ${
          isFlipping ? 'animate-tile-flip' : ''
        }`}
      >
        {displayValue}
      </div>
    </div>
  );
}
