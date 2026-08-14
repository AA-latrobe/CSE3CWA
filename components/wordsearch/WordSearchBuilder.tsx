'use client';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import PhonemeWordSelector from '@/components/shared/PhonemeWordSelector';
import WordSearchGrid from './WordSearchGrid';
import GridDimensionStepper from './GridDimensionStepper';
import WordCountIndicator from './WordCountIndicator';
import { WORD_LIST, PhonemeWordEntry } from '@/lib/phonemeData';
import { getWordCountForGridSize } from '@/lib/wordSearchData';
import { getInitialWordSearchState, saveWordSearchState } from '@/lib/wordSearchStorage';
import { generateWordSearchGrid } from '@/lib/wordSearchGenerator';

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
  const [placedGrid, setPlacedGrid] = useState<(string | null)[][] | null>(null);
  const hasRestoredScroll = useRef(false);

  const targetWordCount = getWordCountForGridSize(gridSize);

  const handleSelectedWordsChange = (words: PhonemeWordEntry[]) => {
    setSelectedWords(words.slice(0, targetWordCount));
  };

  const isFirstGridSizeEffect = useRef(true);
  useEffect(() => {
    if (isFirstGridSizeEffect.current) {
      isFirstGridSizeEffect.current = false;
      return;
    }
    setSelectedWords([]);
  }, [gridSize]);

  // Compares the SET of words (sorted, joined), not array identity or
  // order — so Randomise (which only reorders the same words) does NOT
  // clear a built puzzle, but adding/removing a word does. This keeps a
  // built grid's word positions stable across reordering, which matters
  // once "found" tracking exists: a word's placement shouldn't shuffle
  // just because the sidebar list re-sorted.
  const prevWordSetRef = useRef<string>(
    [...selectedWords.map((w) => w.word)].sort().join(',')
  );
  useEffect(() => {
    const currentWordSet = [...selectedWords.map((w) => w.word)].sort().join(',');
    if (currentWordSet === prevWordSetRef.current) return;
    prevWordSetRef.current = currentWordSet;
    setPlacedGrid(null);
  }, [selectedWords]);

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
      setSelectedWords(shuffled.slice(0, targetWordCount));
    } else {
      const remaining = targetWordCount - selectedWords.length;
      setSelectedWords([...selectedWords, ...shuffled.slice(0, remaining)]);
    }
  };

  const handleBuildPuzzle = () => {
    if (selectedWords.length !== targetWordCount) return;
    const result = generateWordSearchGrid(selectedWords, gridSize);
    setPlacedGrid(result.grid);
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        <h2 className="mb-6 text-lg font-semibold text-foreground">Configure Game</h2>
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
                  onClick={handleBuildPuzzle}
                  disabled={selectedWords.length !== targetWordCount}
                  className="rounded-md bg-match px-4 py-2 text-sm font-medium text-match-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {placedGrid ? 'Rebuild Puzzle' : 'Build Puzzle'}
                </button>
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  className="rounded-md bg-word-reveal px-4 py-2 text-sm font-medium text-word-reveal-foreground hover:opacity-80"
                >
                  Generate .html Puzzle Page
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
          placedGrid={placedGrid}
          isDarkTheme={theme === 'dark'}
          isHighContrast={highContrast}
        />
      </div>
    </div>
  );
}
