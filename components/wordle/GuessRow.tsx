'use client';
import { useEffect, useRef, useState } from 'react';
import { CellColor, GUESS_FLIP_DURATION_MS, GUESS_FLIP_STAGGER_MS } from '@/lib/wordleLogic';
import { getPhonemeHoverText } from '@/lib/phonemeData';

type Props = {
  wordSize: number;
  symbols: string[];
  colors: CellColor[] | null;
};

function cellClass(color: CellColor | null) {
  switch (color) {
    case 'green':
      return 'bg-match text-match-foreground';
    case 'yellow':
      return 'bg-partial text-partial-foreground';
    case 'grey':
      return 'bg-key text-key-foreground';
    default:
      return 'border-2 border-foreground/20 text-foreground';
  }
}

export default function GuessRow({ wordSize, symbols, colors }: Props) {
  const isFirstRender = useRef(true);

  // If this row arrives already submitted (restored from a saved cookie),
  // start with those colors already applied — no animation.
  const [displayColors, setDisplayColors] = useState<(CellColor | null)[]>(() =>
    colors ? colors : Array(wordSize).fill(null)
  );
  const [flipping, setFlipping] = useState<boolean[]>(Array(wordSize).fill(false));
  const wasSubmitted = useRef(colors !== null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const isSubmitted = colors !== null;

    // First render only: if already submitted, we've already painted the
    // colors synchronously above — nothing to animate. Animating here
    // would also be unsafe: Strict Mode's dev-only double-invoke of mount
    // effects can cancel the scheduled timers before they ever fire,
    // leaving the row stuck uncolored (the bug this guard fixes).
    if (isFirstRender.current) {
      isFirstRender.current = false;
      wasSubmitted.current = isSubmitted;
      return;
    }

    if (isSubmitted && !wasSubmitted.current) {
      timers.current.forEach(clearTimeout);
      timers.current = [];

      colors!.forEach((color, i) => {
        const delay = i * GUESS_FLIP_STAGGER_MS;
        timers.current.push(
          setTimeout(() => {
            setFlipping((prev) => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
          }, delay),
          setTimeout(() => {
            setDisplayColors((prev) => {
              const next = [...prev];
              next[i] = color;
              return next;
            });
          }, delay + GUESS_FLIP_DURATION_MS / 2),
          setTimeout(() => {
            setFlipping((prev) => {
              const next = [...prev];
              next[i] = false;
              return next;
            });
          }, delay + GUESS_FLIP_DURATION_MS)
        );
      });
    }

    if (!isSubmitted && wasSubmitted.current) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setDisplayColors(Array(wordSize).fill(null));
      setFlipping(Array(wordSize).fill(false));
    }

    wasSubmitted.current = isSubmitted;

    return () => timers.current.forEach(clearTimeout);
  }, [colors, wordSize]);

  return (
    <div className="flex gap-1">
      {Array.from({ length: wordSize }).map((_, i) => {
        const symbol = symbols[i];
        return (
          <div key={i} style={{ perspective: '400px' }}>
            <div
              title={symbol ? getPhonemeHoverText(symbol) : undefined}
              className={`flex h-12 w-12 items-center justify-center rounded-md text-lg font-semibold ${cellClass(
                displayColors[i]
              )} ${flipping[i] ? 'animate-tile-flip' : ''}`}
            >
              {symbol ?? ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}
