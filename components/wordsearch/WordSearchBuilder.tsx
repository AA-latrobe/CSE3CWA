'use client';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import PhonemeWordSelector from '@/components/shared/PhonemeWordSelector';
import WordSearchGrid from './WordSearchGrid';
import GridDimensionStepper from './GridDimensionStepper';
import { WORD_LIST, PhonemeWordEntry } from '@/lib/phonemeData';
import { getWordCountForGridSize } from '@/lib/wordSearchData';
import { getInitialWordSearchState, saveWordSearchState } from '@/lib/wordSearchStorage';
import WordCountIndicator from './WordCountIndicator';

const SEARCH_STORAGE_KEY = 'wordsearch_search_phonemes';

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

  const targetWordCount = getWordCountForGridSize(gridSize);

  // Every path that can change selectedWords (manual row clicks inside
  // PhonemeWordSelector, Randomise, Clear Word, Add Random) funnels through
  // here — enforcing the cap in ONE place means manual selection can never
  // exceed the current grid's required count, without needing to touch the
  // shared component's internal row-click logic at all.
  const handleSelectedWordsChange = (words: PhonemeWordEntry[]) => {
    setSelectedWords(words.slice(0, targetWordCount));
  };

  // Grid size changing invalidates any existing selection's "correctness"
  // for the new target count, so start fresh rather than leaving a
  // mismatched leftover list. Skipped on the very first render (mount),
  // same guard pattern used elsewhere for restored-from-cookie state.
  const isFirstGridSizeEffect = useRef(true);
  useEffect(() => {
    if (isFirstGridSizeEffect.current) {
      isFirstGridSizeEffect.current = false;
      return;
    }
    setSelectedWords([]);
  }, [gridSize]);

  const handleAddRandom = () => {
    const availableWords = WORD_LIST.filter(
      (w) => !selectedWords.some((s) => s.word === w.word)
    );
    const shuffled = [...availableWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    if (selectedWords.length >= targetWordCount) {
      // Already full — clear out and replace with a brand new random set.
      setSelectedWords(shuffled.slice(0, targetWordCount));
    } else {
      // Only top up the missing amount, keeping whatever's already selected.
      const remaining = targetWordCount - selectedWords.length;
      setSelectedWords([...selectedWords, ...shuffled.slice(0, remaining)]);
    }
  };

  // Track scroll continuously from mount.
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore once, waiting for fonts + polling until the page is tall
  // enough to actually reach the saved position.
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
          onSelectedWordsChange={handleSelectedWordsChange}
          searchStorageKey={SEARCH_STORAGE_KEY}
          footerSlot={
            <div>
              <GridDimensionStepper value={gridSize} onChange={setGridSize} />
              <WordCountIndicator requiredCount={targetWordCount} currentCount={selectedWords.length} />
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  disabled={selectedWords.length !== targetWordCount}
                  className="rounded-md bg-match px-4 py-2 text-sm font-medium text-match-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Build Puzzle
                </button>
              </div>
            </div>
          }
          addButtonLabel="Add Random"
          onAddButtonClick={handleAddRandom}
          disableAddWhenFiltered
        />
      </div>

      <div className="rounded-md border border-foreground/10 bg-background p-4 sm:p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Preview</h2>
        <WordSearchGrid
        gridSize={gridSize}
        selectedWords={selectedWords}
        isDarkTheme={theme === 'dark'}
        isHighContrast={highContrast}
      />
      </div>
    </div>
  );
}
