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

// 32px boxes + 4px gaps: 5 boxes = 5*32 + 4*4 = 176px, matching the
// w-44 (176px) Reset Game button below when the word has 5 phonemes.
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

  useEffect(() => {
    const current = phonemesRef.current;

    if (reveal && !wasRevealed.current) {
      timers.current.forEach(clearTimeout);
      timers.current = [];

      // Stage 1: phoneme boxes flip left to right.
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

      // Stage 2: once every phoneme box has finished, flip the word box.
      const phonemesEnd = (current.length - 1) * GUESS_FLIP_STAGGER_MS + GUESS_FLIP_DURATION_MS;

      timers.current.push(
        setTimeout(() => setWordBoxFlipping(true), phonemesEnd),
        setTimeout(() => setWordBoxRevealed(true), phonemesEnd + GUESS_FLIP_DURATION_MS / 2),
        setTimeout(() => setWordBoxFlipping(false), phonemesEnd + GUESS_FLIP_DURATION_MS)
      );

      // Stage 3: once the word box flip finishes, show the message.
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

      {/* English word box — always rendered from the start (empty/bordered),
          so it never shifts layout when it flips to filled. */}
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

      {/* Message — fixed-height row so its appearance never pushes
          Reset Game down, regardless of message length. */}
      <div className="mt-2 flex h-6 w-full items-center justify-center">
        <p className="text-sm font-bold text-foreground">{messageVisible ? message : ''}</p>
      </div>
    </div>
  );
}
