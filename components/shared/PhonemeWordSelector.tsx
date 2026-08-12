'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import PhonemeKeypad from './PhonemeKeypad';
import {
  WORD_LIST,
  KEYPAD_TOP,
  KEYPAD_BOTTOM,
  MAX_PHONEME_SLOTS,
  DEFAULT_SELECTED_WORD,
  PhonemeWordEntry,
} from '@/lib/phonemeData';

type Props = {
  onSelectedWordsChange?: (words: PhonemeWordEntry[]) => void;
  // Slot for a game-specific control (e.g. Number of Guesses for Wordle,
  // something else for Word Search) rendered bottom-left, under Selected Words.
  footerSlot?: React.ReactNode;
};

export default function PhonemeWordSelector({ onSelectedWordsChange, footerSlot }: Props) {
  const defaultEntry = WORD_LIST.find((w) => w.word === DEFAULT_SELECTED_WORD)!;
  const [selectedWords, setSelectedWords] = useState<PhonemeWordEntry[]>([defaultEntry]);
  const [searchPhonemes, setSearchPhonemes] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const VISIBLE_ROWS = 5;
  const ROW_HEIGHT_PX = 44; // matches a row's py-2 + text-sm + border

  useEffect(() => {
    onSelectedWordsChange?.(selectedWords);
  }, [selectedWords, onSelectedWordsChange]);

  // Derived, not stored — guarantees "available" can never drift out of sync
  // with "selected" (no separate list to keep manually in step).
  const availableWords = useMemo(
    () => WORD_LIST.filter((w) => !selectedWords.some((s) => s.word === w.word)),
    [selectedWords]
  );

  const filteredWords = useMemo(
    () =>
      availableWords.filter((entry) =>
        searchPhonemes.every((symbol, i) => entry.phonemes[i] === symbol)
      ),
    [availableWords, searchPhonemes]
  );

  const scrollListToTop = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = 0;
    });
  };

  const handleKeypadSelect = (symbol: string) => {
    if (searchPhonemes.length >= MAX_PHONEME_SLOTS) return;
    setSearchPhonemes((prev) => [...prev, symbol]);
    scrollListToTop();
  };

  const handleBackspace = () => {
    if (searchPhonemes.length === 0) return;
    setSearchPhonemes((prev) => prev.slice(0, -1));
    scrollListToTop();
  };

  const handleRowSelect = (entry: PhonemeWordEntry) => {
    setSelectedWords((prev) => [...prev, entry]);
    setSearchPhonemes([]); // cleared, but deliberately no scrollListToTop() here
  };

  const handleClearWord = () => {
    if (!highlighted) return;
    setSelectedWords((prev) => prev.filter((w) => w.word !== highlighted));
    setHighlighted(null);
  };

  const handleClearAll = () => {
    setSelectedWords([]);
    setHighlighted(null);
  };

  const handleRandomise = () => {
    setSelectedWords((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  };

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-8">
      {/* Left column: search, browse list, selected words */}
      <div className="flex w-full max-w-[360px] flex-col gap-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Search by Phoneme
          </label>
          <div className="flex gap-2">
            {Array.from({ length: MAX_PHONEME_SLOTS }).map((_, i) => (
              <div
                key={i}
                className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-foreground/20 text-lg font-semibold text-foreground"
              >
                {searchPhonemes[i] ?? ''}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Word List ({filteredWords.length})
          </label>
          <div
            ref={listRef}
            className="overflow-y-auto rounded-md border border-foreground/10"
            style={{ height: VISIBLE_ROWS * ROW_HEIGHT_PX }}
          >
            {filteredWords.length === 0 && (
              <p className="p-4 text-sm text-foreground/50">No matching words.</p>
            )}
            {filteredWords.map((entry) => (
              <button
                key={entry.word}
                type="button"
                onClick={() => handleRowSelect(entry)}
                className="flex w-full items-center justify-between gap-4 border-b border-foreground/5 px-3 py-2 text-left last:border-b-0 hover:bg-foreground/5"
              >
                <span className="text-sm text-foreground">{entry.word}</span>
                <span className="flex gap-1">
                  {Array.from({ length: MAX_PHONEME_SLOTS }).map((_, i) => (
                    <span
                      key={i}
                      className="flex h-7 w-7 items-center justify-center rounded border border-foreground/20 text-xs text-foreground"
                    >
                      {entry.phonemes[i] ?? ''}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Selected Words ({selectedWords.length})
          </label>
          <div
            className="overflow-y-auto rounded-md border border-foreground/10"
            style={{ height: VISIBLE_ROWS * ROW_HEIGHT_PX }}
          >
            {selectedWords.length === 0 && (
              <p className="p-4 text-sm text-foreground/50">No words selected.</p>
            )}
            {selectedWords.map((entry) => (
              <button
                key={entry.word}
                type="button"
                onClick={() => setHighlighted(entry.word === highlighted ? null : entry.word)}
                className={`flex w-full items-center justify-between gap-4 border-b border-foreground/5 px-3 py-2 text-left last:border-b-0 ${
                  highlighted === entry.word ? 'bg-accent/20' : 'hover:bg-foreground/5'
                }`}
              >
                <span className="text-sm text-foreground">{entry.word}</span>
                <span className="text-xs text-foreground/60">{entry.phonemes.join(' · ')}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleClearWord}
              disabled={!highlighted}
              className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear Word
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={selectedWords.length === 0}
              className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear All Words
            </button>
            <button
              type="button"
              onClick={handleRandomise}
              disabled={selectedWords.length < 2}
              className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Randomise
            </button>
          </div>
        </div>
      </div>

      {/* Right column: keypad + footer slot underneath it.
          No items-center here — PhonemeKeypad now centers its own content internally
          while keeping its measurement box full-width. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <PhonemeKeypad
          topGrid={KEYPAD_TOP}
          bottomGrid={KEYPAD_BOTTOM}
          onSelect={handleKeypadSelect}
          onBackspace={handleBackspace}
        />
        <div className="mt-6 flex w-full justify-center">{footerSlot}</div>
      </div>
    </div>
  );
}
