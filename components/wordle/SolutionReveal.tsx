'use client';
import { useEffect, useRef, useState } from 'react';
import { getPhonemeHoverText } from '@/lib/phonemeData';
import { GUESS_FLIP_DURATION_MS, GUESS_FLIP_STAGGER_MS } from '@/lib/wordleLogic';

type Props = {
  phonemes: string[];
  englishWord: string;
  message: string;
  reveal: boolean;
};

export default function SolutionReveal({ phonemes, englishWord, message, reveal }: Props) {
  const [displayed, setDisplayed] = useState<(string | null)[]>(phonemes.map(() => null));
  const [flipping, setFlipping] = useState<boolean[]>(phonemes.map(() => false));
  const wasRevealed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phonemesRef = useRef(phonemes);
  phonemesRef.current = phonemes;

  useEffect(() => {
    const current = phonemesRef.current;

    if (reveal && !wasRevealed.current) {
      timers.current.forEach(clearTimeout);
      timers.current = [];

      current.forEach((symbol, i) => {
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
            setDisplayed((prev) => {
              const next = [...prev];
              next[i] = symbol;
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

    if (!reveal && wasRevealed.current) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setDisplayed(current.map(() => null));
      setFlipping(current.map(() => false));
    }

    wasRevealed.current = reveal;

    return () => timers.current.forEach(clearTimeout);
  }, [reveal]);

  return (
    <div className="w-full">
      <p className="mb-2 text-sm font-medium text-foreground">Solution:</p>
      <div className="flex gap-1">
        {phonemes.map((symbol, i) => (
          <div key={i} style={{ perspective: '400px' }}>
            <div
              title={displayed[i] ? getPhonemeHoverText(displayed[i]!) : undefined}
              className={`flex h-7 w-7 items-center justify-center rounded text-xs font-semibold ${
                displayed[i]
                  ? 'bg-match text-match-foreground'
                  : 'border border-foreground/20 text-foreground'
              } ${flipping[i] ? 'animate-tile-flip' : ''}`}
            >
              {displayed[i] ?? ''}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 min-h-[1.25rem] text-sm text-foreground">
        {reveal ? (
          <>
            English word: <span className="text-base font-semibold">{englishWord}</span>
          </>
        ) : (
          ''
        )}
      </p>
      <p className="min-h-[1.25rem] text-sm font-bold text-foreground">{reveal ? message : ''}</p>
    </div>
  );
}
