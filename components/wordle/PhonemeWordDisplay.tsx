'use client';
import { useEffect, useRef, useState } from 'react';
import { MAX_PHONEME_SLOTS } from '@/lib/phonemeData';

type SlotColor = 'green' | 'grey' | 'empty';
interface Slot {
  symbol: string | null;
  color: SlotColor;
}

type Props = {
  phonemes: string[];
  isPlayable: boolean;
};

const FLIP_DURATION_MS = 500;
const STAGGER_MS = 100;

function slotClass(color: SlotColor) {
  switch (color) {
    case 'green':
      return 'bg-match text-match-foreground';
    case 'grey':
      return 'bg-key text-key-foreground';
    case 'empty':
    default:
      return 'border-2 border-foreground/20 text-foreground';
  }
}

function computeSlots(phonemes: string[], isPlayable: boolean): Slot[] {
  return Array.from({ length: MAX_PHONEME_SLOTS }, (_, i) => {
    if (!isPlayable) return { symbol: null, color: 'empty' };
    const symbol = phonemes[i];
    return symbol ? { symbol, color: 'green' } : { symbol: null, color: 'grey' };
  });
}

export default function PhonemeWordDisplay({ phonemes, isPlayable }: Props) {
  const targetSlots = computeSlots(phonemes, isPlayable);
  const targetKey = JSON.stringify(targetSlots);

  // Always holds the latest computed target — read inside the effect
  // instead of putting the array itself in the dependency array, so a
  // fresh array reference each render doesn't fool React into thinking
  // the actual target changed.
  const latestTargetSlots = useRef(targetSlots);
  latestTargetSlots.current = targetSlots;

  const [displaySlots, setDisplaySlots] = useState<Slot[]>(targetSlots);
  const [flipping, setFlipping] = useState<boolean[]>(() => targetSlots.map(() => false));
  const prevKey = useRef(targetKey);
  const isFirstRender = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevKey.current = targetKey;
      return;
    }
    if (targetKey === prevKey.current) return;
    prevKey.current = targetKey;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    const targets = latestTargetSlots.current;

    targets.forEach((slot, i) => {
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
          setDisplaySlots((prev) => {
            const next = [...prev];
            next[i] = slot;
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

    return () => timers.current.forEach(clearTimeout);
    // targetKey is the ONLY dependency now — a stable string that only
    // changes when the actual slot content/colors change, not on every
    // render the animation's own state updates cause.
  }, [targetKey]);

  return (
    <div className="flex gap-1">
      {displaySlots.map((slot, i) => (
        <div key={i} style={{ perspective: '400px' }}>
          <div
            className={`flex h-7 w-7 items-center justify-center rounded text-sm font-semibold ${slotClass(
              slot.color
            )} ${flipping[i] ? 'animate-tile-flip' : ''}`}
          >
            {slot.symbol ?? ''}
          </div>
        </div>
      ))}
    </div>
  );
}
