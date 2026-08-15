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

const BOX_SIZE = 32;
const BOX_GAP = 4;

function rowWidth(count: number) {
  return count * BOX_SIZE + Math.max(0, count - 1) * BOX_GAP;
}

export default function SolutionReveal({ phonemes, englishWord, message, reveal }: Props) {
  const [displayed, setDisplayed] = useState<(string | null)[]>(phonemes.map(() => null));
  const [flipping, setFlipping] = useState<boolean[]>(phonemes.map(() => false));
  const [wordBoxRevealed, setWordBoxRevealed] = useState(false);
  const [wordBoxFlipping, setWordBoxFlipping] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);

  const wasRevealed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phonemesRef = useRef(phonemes);
  phonemesRef.current = phonemes;

  // If the WORD itself changed (Play Next Word / Start Over), snap the
  // display back to blank immediately, synchronously with the prop
  // change — not deferred to the effect below, which only fires after
  // render and would otherwise show the PREVIOUS word's revealed letters
  // against the NEW word's boxes for one frame.
  const wordKey = phonemes.join('|');
  const prevWordKeyRef = useRef(wordKey);
  if (prevWordKeyRef.current !== wordKey) {
    prevWordKeyRef.current = wordKey;
    // Safe to call setState during render when it's this kind of
    // "derive from a changed prop" reset — React bails out of the
    // in-progress render and re-renders with the new state immediately.
    if (displayed.length !== phonemes.length || displayed.some((d) => d !== null)) {
      setDisplayed(phonemes.map(() => null));
    }
    if (flipping.some((f) => f)) {
      setFlipping(phonemes.map(() => false));
    }
    if (wordBoxRevealed) setWordBoxRevealed(false);
    if (wordBoxFlipping) setWordBoxFlipping(false);
    if (messageVisible) setMessageVisible(false);
    wasRevealed.current = false;
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

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

      const phonemesEnd = (current.length - 1) * GUESS_FLIP_STAGGER_MS + GUESS_FLIP_DURATION_MS;

      timers.current.push(
        setTimeout(() => setWordBoxFlipping(true), phonemesEnd),
        setTimeout(() => setWordBoxRevealed(true), phonemesEnd + GUESS_FLIP_DURATION_MS / 2),
        setTimeout(() => setWordBoxFlipping(false), phonemesEnd + GUESS_FLIP_DURATION_MS)
      );

      const wordBoxEnd = phonemesEnd + GUESS_FLIP_DURATION_MS;
      timers.current.push(setTimeout(() => setMessageVisible(true), wordBoxEnd));
    }

    if (!reveal && wasRevealed.current) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setDisplayed(current.map(() => null));
      setFlipping(current.map(() => false));
      setWordBoxRevealed(false);
      setWordBoxFlipping(false);
      setMessageVisible(false);
    }

    wasRevealed.current = reveal;

    return () => timers.current.forEach(clearTimeout);
  }, [reveal]);

  const width = rowWidth(phonemes.length);

  return (
    <div className="w-full">
      <p className="mb-2 text-sm font-medium text-foreground">Solution:</p>

      <div className="flex gap-1" style={{ width }}>
        {phonemes.map((symbol, i) => (
          <div key={i} style={{ perspective: '400px' }}>
            <div
              title={displayed[i] ? getPhonemeHoverText(displayed[i]!) : undefined}
              className={`flex items-center justify-center rounded-md text-base font-semibold ${
                displayed[i]
                  ? 'bg-match text-match-foreground'
                  : 'border border-foreground/20 text-foreground'
              } ${flipping[i] ? 'animate-tile-flip' : ''}`}
              style={{ height: BOX_SIZE, width: BOX_SIZE }}
            >
              {displayed[i] ?? ''}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2" style={{ perspective: '400px', width }}>
        <div
          className={`flex items-center justify-center rounded-md text-lg font-semibold ${
            wordBoxRevealed
              ? 'bg-word-reveal text-word-reveal-foreground'
              : 'border border-foreground/20 text-foreground'
          } ${wordBoxFlipping ? 'animate-tile-flip' : ''}`}
          style={{ height: 36, width }}
        >
          {wordBoxRevealed ? englishWord : ''}
        </div>
      </div>

      <div className="mt-2 flex h-6 w-full items-center justify-center">
        <p className="text-sm font-bold text-foreground">{messageVisible ? message : ''}</p>
      </div>
    </div>
  );
}
