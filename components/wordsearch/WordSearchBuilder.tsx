'use client';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import PhonemeWordSelector from '@/components/shared/PhonemeWordSelector';
import WordSearchGrid from './WordSearchGrid';
import GridDimensionStepper from './GridDimensionStepper';
import { PhonemeWordEntry } from '@/lib/phonemeData';
import { getInitialWordSearchState, saveWordSearchState } from '@/lib/wordSearchStorage';

const SEARCH_STORAGE_KEY = 'wordsearch_search_phonemes';
const MIN_GRID_SIZE = 8;
const MAX_GRID_SIZE = 15;

export default function WordSearchBuilder() {
  const { theme, highContrast } = useTheme();

  const initialRef = useRef<ReturnType<typeof getInitialWordSearchState> | null>(null);
  if (initialRef.current === null) {
    initialRef.current = getInitialWordSearchState();
  }
  const initial = initialRef.current;

  const [selectedWords, setSelectedWords] = useState<PhonemeWordEntry[]>(initial.selectedWords);
  const [gridSize, setGridSize] = useState(initial.gridSize);
  const [scrollY, setScrollY] = useState(initial.scrollY);
  const hasRestoredScroll = useRef(false);

  // Track scroll continuously from mount — not gated by any condition,
  // same lesson learned with WordleBuilder: a listener that only starts
  // existing after some later event misses whatever scrolling already
  // happened before that event.
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore once, waiting for fonts + polling until the page is tall
  // enough to actually reach the saved position — same approach as
  // WordleBuilder's scroll restore.
  useEffect(() => {
    if (initial.scrollY <= 0) return;
    if (hasRestoredScroll.current) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30;

    const tryScroll = () => {
      if (cancelled) return;
      attempts++;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll >= initial.scrollY || attempts >= maxAttempts) {
        window.scrollTo(0, initial.scrollY);
        hasRestoredScroll.current = true;
      } else {
        requestAnimationFrame(tryScroll);
      }
    };

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) requestAnimationFrame(tryScroll);
      });
    } else {
      requestAnimationFrame(tryScroll);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveWordSearchState({ selectedWords, gridSize, scrollY });
  }, [selectedWords, gridSize, scrollY]);

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-foreground/10 bg-background p-4 text-sm text-foreground/80">
        <p>
          Configure a phoneme-based Word Search activity below. Search the word list using
          the phoneme keypad and add words to your selection. [Dummy instructions — replace with final copy.]
        </p>
      </div>

      <div className="rounded-md border border-foreground/10 bg-background p-4 sm:p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Configure Activity</h2>
        <PhonemeWordSelector
          selectedWords={selectedWords}
          onSelectedWordsChange={setSelectedWords}
          searchStorageKey={SEARCH_STORAGE_KEY}
          footerSlot={
            <GridDimensionStepper
              value={gridSize}
              min={MIN_GRID_SIZE}
              max={MAX_GRID_SIZE}
              onChange={setGridSize}
            />
          }
        />
      </div>

      <div className="rounded-md border border-foreground/10 bg-background p-4 sm:p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Preview</h2>
        <WordSearchGrid isDarkTheme={theme === 'dark'} isHighContrast={highContrast} />
      </div>
    </div>
  );
}
