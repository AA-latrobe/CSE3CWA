'use client';
import { useEffect, useRef, useState } from 'react';
import { CellColor } from '@/lib/wordleLogic';

type Props = {
  wordSize: number;
  symbols: string[]; // letters typed/submitted for this row — may be shorter than wordSize
  colors: CellColor[] | null; // null until this row is submitted
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
      // Not yet revealed (still typing, or an empty future row).
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
      // Just submitted this guess — run the staggered reveal, left to right.
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
          // Color swaps at the flip's midpoint — tile is edge-on and
          // invisible at that instant, same trick used elsewhere.
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
      // Row was cleared (e.g. Reset Game) — snap back instantly, no animation.
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
      {Array.from({ length: wordSize }).map((_, i) => (
        <div key={i} style={{ perspective: '400px' }}>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-md text-lg font-semibold ${cellClass(
              displayColors[i]
            )} ${flipping[i] ? 'animate-tile-flip' : ''}`}
          >
            {symbols[i] ?? ''}
          </div>
        </div>
      ))}
    </div>
  );
}
