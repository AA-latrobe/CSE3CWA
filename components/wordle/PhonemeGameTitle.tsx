'use client';
import { useEffect, useRef, useState } from 'react';
import { getPhonemeHoverText } from '@/lib/phonemeData';

type CellColor = 'empty' | 'grey' | 'yellow' | 'green';

type Props = {
  phonemes: string[];
  resetSignal: number; // bump this number to re-trigger the animation
};

const FLIP_DURATION_MS = 500;
const STAGGER_MS = 150; // delay between each tile starting its flip, left to right
const INITIAL_DELAY_MS = 1000;

function cellColorClass(color: CellColor) {
  switch (color) {
    case 'green':
      return 'bg-match text-match-foreground';
    case 'yellow':
      return 'bg-partial text-partial-foreground';
    case 'grey':
      return 'bg-key text-key-foreground';
    case 'empty':
    default:
      return 'border-2 border-foreground/20 text-foreground';
  }
}

// Exactly one green, one yellow, the rest grey — order shuffled each call.
function randomColorSequence(length: number): CellColor[] {
  const colors: CellColor[] = ['green', 'yellow', ...Array(length - 2).fill('grey')];
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }
  return colors;
}

export default function PhonemeGameTitle({ phonemes, resetSignal }: Props) {
  const [colors, setColors] = useState<CellColor[]>(() => phonemes.map(() => 'empty'));
  const [flipping, setFlipping] = useState<boolean[]>(() => phonemes.map(() => false));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Cancel any timers still pending from a previous run (e.g. rapid Reset clicks).
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Back to uncoloured immediately, ready to animate again.
    setColors(phonemes.map(() => 'empty'));
    setFlipping(phonemes.map(() => false));

    const targetColors = randomColorSequence(phonemes.length);

    const start = setTimeout(() => {
      phonemes.forEach((_, i) => {
        const tileDelay = i * STAGGER_MS; // left-to-right stagger

        timers.current.push(
          setTimeout(() => {
            setFlipping((prev) => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
          }, tileDelay),

          // Color swaps at the flip's midpoint — tile is edge-on and
          // invisible at that instant, same trick as FlipTile.
          setTimeout(() => {
            setColors((prev) => {
              const next = [...prev];
              next[i] = targetColors[i];
              return next;
            });
          }, tileDelay + FLIP_DURATION_MS / 2),

          setTimeout(() => {
            setFlipping((prev) => {
              const next = [...prev];
              next[i] = false;
              return next;
            });
          }, tileDelay + FLIP_DURATION_MS)
        );
      });
    }, INITIAL_DELAY_MS);

    timers.current.push(start);

    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, [phonemes, resetSignal]);

  return (
    <div className="flex gap-2">
      {phonemes.map((symbol, i) => (
        <div key={i} style={{ perspective: '400px' }}>
          <div
            title={getPhonemeHoverText(symbol)}
            className={`flex h-16 w-16 items-center justify-center rounded-md text-3xl font-semibold transition-colors ${cellColorClass(
              colors[i]
            )} ${flipping[i] ? 'animate-tile-flip' : ''}`}
          >
            {symbol}
          </div>
        </div>
      ))}
    </div>
  );
}
