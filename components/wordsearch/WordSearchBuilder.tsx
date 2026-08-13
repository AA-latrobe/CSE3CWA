'use client';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import PhonemeWordSelector from '@/components/shared/PhonemeWordSelector';
import WordSearchGrid from './WordSearchGrid';
import { PhonemeWordEntry } from '@/lib/phonemeData';
import { getInitialWordSearchState, saveWordSearchState } from '@/lib/wordSearchStorage';

const SEARCH_STORAGE_KEY = 'wordsearch_search_phonemes';

export default function WordSearchBuilder() {
  const { theme, highContrast } = useTheme();

  const initialRef = useRef<ReturnType<typeof getInitialWordSearchState> | null>(null);
  if (initialRef.current === null) {
    initialRef.current = getInitialWordSearchState();
  }
  const initial = initialRef.current;

  const [selectedWords, setSelectedWords] = useState<PhonemeWordEntry[]>(initial.selectedWords);

  useEffect(() => {
    saveWordSearchState({ selectedWords });
  }, [selectedWords]);

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
            <p className="text-sm text-foreground/50">
              [Word Search controls placeholder — grid size, etc.]
            </p>
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
