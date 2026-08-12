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
  // something else for Word Search) rendered under the keypad on the right.
  footerSlot?: React.ReactNode;
};

type CellColor = 'empty' | 'grey' | 'yellow' | 'green';
type SearchBoxColor = 'none' | 'yellow' | 'green';

interface ListRow {
  entry: PhonemeWordEntry;
  colors: CellColor[];
}

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_PX = 44; // matches a row's py-2 + text-sm + border

function cellClass(color: CellColor) {
  switch (color) {
    case 'green':
      return 'bg-match font-semibold text-match-foreground';
    case 'yellow':
      return 'bg-partial font-semibold text-partial-foreground';
    case 'grey':
      return 'bg-key text-key-foreground';
    case 'empty':
    default:
      return 'border border-foreground/20 text-foreground';
  }
}

export default function PhonemeWordSelector({ onSelectedWordsChange, footerSlot }: Props) {
  const defaultEntry = WORD_LIST.find((w) => w.word === DEFAULT_SELECTED_WORD)!;
  const [selectedWords, setSelectedWords] = useState<PhonemeWordEntry[]>([defaultEntry]);
  const [searchPhonemes, setSearchPhonemes] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSelectedWordsChange?.(selectedWords);
  }, [selectedWords, onSelectedWordsChange]);

  // Derived, not stored — guarantees "available" can never drift out of sync
  // with "selected" (no separate list to keep manually in step).
  const availableWords = useMemo(
    () => WORD_LIST.filter((w) => !selectedWords.some((s) => s.word === w.word)),
    [selectedWords]
  );

  // Every symbol present anywhere across the current Selected Words —
  // used to grey out "already covered" keys on the config-panel keypad.
  const usedSymbols = useMemo(() => {
    const set = new Set<string>();
    for (const w of selectedWords) {
      for (const p of w.phonemes) set.add(p);
    }
    return set;
  }, [selectedWords]);

  // Colors for the "Search by Phoneme" boxes themselves.
  const searchBoxColors: SearchBoxColor[] = useMemo(() => {
    const colors: SearchBoxColor[] = Array(MAX_PHONEME_SLOTS).fill('none');
    if (searchPhonemes.length === 0) return colors;

    if (searchPhonemes.length === 1) {
      // Single phoneme: green if some word STARTS with it, otherwise yellow
      // if it merely appears somewhere in at least one word, otherwise plain.
      const symbol = searchPhonemes[0];
      const startsWord = availableWords.some((w) => w.phonemes[0] === symbol);
      const appearsAnywhere = availableWords.some((w) => w.phonemes.includes(symbol));
      colors[0] = startsWord ? 'green' : appearsAnywhere ? 'yellow' : 'none';
      return colors;
    }

    // Two or more phonemes: strict prefix mode. If the full typed sequence
    // matches at least one word's prefix, every typed box goes green.
    const hasMatch = availableWords.some((w) =>
      searchPhonemes.every((symbol, i) => w.phonemes[i] === symbol)
    );
    if (hasMatch) {
      for (let i = 0; i < searchPhonemes.length; i++) colors[i] = 'green';
    }
    return colors;
  }, [availableWords, searchPhonemes]);

  // Word List rows: three modes depending on how much has been typed.
  const listRows: ListRow[] = useMemo(() => {
    // Nothing typed — plain alphabetical list, no highlighting.
    if (searchPhonemes.length === 0) {
      return availableWords.map((entry) => ({
        entry,
        colors: Array.from({ length: MAX_PHONEME_SLOTS }, (_, i) =>
          entry.phonemes[i] ? 'grey' : 'empty'
        ) as CellColor[],
      }));
    }

    // Exactly one phoneme typed — grouped/position-priority mode.
    // Words are grouped by the FIRST position the symbol occurs at (0-based),
    // group 0 (starts with it) first, then group 1, 2, 3, 4 in order.
    // A word can only appear once, under its earliest occurrence's group.
    if (searchPhonemes.length === 1) {
      const symbol = searchPhonemes[0];
      const groups: ListRow[][] = Array.from({ length: MAX_PHONEME_SLOTS }, () => []);

      for (const entry of availableWords) {
        const primaryIndex = entry.phonemes.findIndex((p) => p === symbol);
        if (primaryIndex === -1) continue; // word doesn't contain this phoneme at all

        const colors: CellColor[] = Array.from({ length: MAX_PHONEME_SLOTS }, (_, i) => {
          if (!entry.phonemes[i]) return 'empty';
          if (i === primaryIndex) return primaryIndex === 0 ? 'green' : 'yellow';
          if (entry.phonemes[i] === symbol) return 'yellow'; // repeated occurrence, bonus highlight
          return 'grey';
        });

        groups[primaryIndex].push({ entry, colors });
      }

      return groups.flat();
    }

    // Two or more phonemes typed — straightforward prefix filtering.
    return availableWords
      .filter((entry) => searchPhonemes.every((symbol, i) => entry.phonemes[i] === symbol))
      .map((entry) => ({
        entry,
        colors: Array.from({ length: MAX_PHONEME_SLOTS }, (_, i) => {
          if (!entry.phonemes[i]) return 'empty';
          return i < searchPhonemes.length ? 'green' : 'grey';
        }) as CellColor[],
      }));
  }, [availableWords, searchPhonemes]);

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
    setSearchPhonemes([]); // cleared, but deliberately no scrollListToTop() here —
    // the full list should stay scrolled where it was so browsing continues naturally.
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
      {/* Left column: search, browse list, selected words. Fixed max-width so
          it never grows wider even as the keypad column reflows around it. */}
      <div className="flex w-full max-w-[360px] flex-col gap-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Search by Phoneme
          </label>
          <div className="flex gap-2">
            {Array.from({ length: MAX_PHONEME_SLOTS }).map((_, i) => {
              const color = searchBoxColors[i];
              return (
                <div
                  key={i}
                  className={`flex h-12 w-12 items-center justify-center rounded-md text-lg font-semibold ${
                    color === 'green'
                      ? 'bg-match text-match-foreground'
                      : color === 'yellow'
                      ? 'bg-partial text-partial-foreground'
                      : 'border-2 border-foreground/20 text-foreground'
                  }`}
                >
                  {searchPhonemes[i] ?? ''}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Word List ({listRows.length})
          </label>
          <div
            ref={listRef}
            className="overflow-y-auto rounded-md border border-foreground/10"
            style={{ height: VISIBLE_ROWS * ROW_HEIGHT_PX }}
          >
            {listRows.length === 0 && (
              <p className="p-4 text-sm text-foreground/50">No matching words.</p>
            )}
            {listRows.map(({ entry, colors }) => (
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
                      className={`flex h-7 w-7 items-center justify-center rounded text-xs ${cellClass(
                        colors[i]
                      )}`}
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
                <span className="flex gap-1">
                  {Array.from({ length: MAX_PHONEME_SLOTS }).map((_, i) => {
                    const symbol = entry.phonemes[i];
                    return (
                      <span
                        key={i}
                        className={`flex h-7 w-7 items-center justify-center rounded text-xs ${
                          symbol
                            ? 'bg-match font-semibold text-match-foreground'
                            : 'border border-foreground/20 text-foreground'
                        }`}
                      >
                        {symbol ?? ''}
                      </span>
                    );
                  })}
                </span>
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

      {/* Right column: keypad + footer slot underneath it, both centered
          within this column's full available width. */}
      <div className="min-w-0 flex-1">
        <PhonemeKeypad
          topGrid={KEYPAD_TOP}
          bottomGrid={KEYPAD_BOTTOM}
          onSelect={handleKeypadSelect}
          onBackspace={handleBackspace}
          usedSymbols={usedSymbols}
        />
        <div className="mt-6 flex w-full justify-center">{footerSlot}</div>
      </div>
    </div>
  );
}
