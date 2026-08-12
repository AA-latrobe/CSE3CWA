'use client';
import { useEffect, useRef, useState } from 'react';
import { CellColor } from '@/lib/wordleLogic';
import { getPhonemeHoverText } from '@/lib/phonemeData';

type Props = {
  wordSize: number;
  symbols: string[];
  colors: CellColor[] | null;
};

const FLIP_DURATION_MS = 500;
const STAGGER_MS = 150;

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
  const [displayColors, setDisplayColors] = useState<(CellColor | null)[]>(
    Array(wordSize).fill(null)
  );
  const [flipping, setFlipping] = useState<boolean[]>(Array(wordSize).fill(false));
  const wasSubmitted = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const isSubmitted = colors !== null;

    if (isSubmitted && !wasSubmitted.current) {
      timers.current.forEach(clearTimeout);
      timers.current = [];

      colors!.forEach((color, i) => {
        const delay = i * STAGGER_MS;
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
          }, delay + FLIP_DURATION_MS / 2),
          setTimeout(() => {
            setFlipping((prev) => {
              const next = [...prev];
              next[i] = false;
              return next;
            });
          }, delay + FLIP_DURATION_MS)
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
