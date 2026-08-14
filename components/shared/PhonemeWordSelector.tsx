'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import PhonemeKeypad from './PhonemeKeypad';
import { useContainerWidth } from '@/lib/useContainerWidth';
import {
  WORD_LIST,
  KEYPAD_TOP,
  KEYPAD_BOTTOM,
  MAX_PHONEME_SLOTS,
  PhonemeWordEntry,
} from '@/lib/phonemeData';
import { getCookie, setCookie } from '@/lib/cookies';

type Props = {
  selectedWords: PhonemeWordEntry[];
  onSelectedWordsChange: (words: PhonemeWordEntry[]) => void;
  footerSlot?: React.ReactNode;
  searchStorageKey?: string;
  addButtonLabel?: string;
  onAddButtonClick?: (filteredWords: PhonemeWordEntry[]) => void;
  // When true, the add button also disables itself whenever a phoneme
  // search is active — Word Search needs this (its "Add Random" logic
  // ignores filtering entirely, so a filtered click would be misleading);
  // Wordle's "Add All" intentionally does NOT set this, since adding
  // exactly the filtered subset is its whole purpose.
  disableAddWhenFiltered?: boolean;
};

type CellColor = 'empty' | 'grey' | 'yellow' | 'green';
type SearchBoxColor = 'none' | 'yellow' | 'green';

interface ListRow {
  entry: PhonemeWordEntry;
  colors: CellColor[];
}

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_PX = 44;
const DEFAULT_SEARCH_STORAGE_KEY = 'wordle_search_phonemes';

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

function loadSearchPhonemes(storageKey: string): string[] {
  const raw = getCookie(storageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
      return parsed.slice(0, MAX_PHONEME_SLOTS);
    }
  } catch {
    // fall through to empty
  }
  return [];
}

export default function PhonemeWordSelector({
  selectedWords,
  onSelectedWordsChange,
  footerSlot,
  searchStorageKey = DEFAULT_SEARCH_STORAGE_KEY,
  addButtonLabel,
  onAddButtonClick,
  disableAddWhenFiltered = false,
}: Props) {
  const { ref: rowRef, isWide: rowWide } = useContainerWidth<HTMLDivElement>(560);

  // Read once, synchronously, on first render — this component only ever
  // mounts client-side (inside WordleBuilder, which itself only mounts
  // when its tab is selected), so there's no server/client mismatch risk.
  const initialSearchRef = useRef<string[] | null>(null);
  if (initialSearchRef.current === null) {
    initialSearchRef.current = loadSearchPhonemes(searchStorageKey);
  }

  const [searchPhonemes, setSearchPhonemes] = useState<string[]>(initialSearchRef.current);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setCookie(searchStorageKey, JSON.stringify(searchPhonemes));
    } catch {
      // fail silently — search restore is a nice-to-have, not critical
    }
  }, [searchPhonemes, searchStorageKey]);

  const availableWords = useMemo(
    () => WORD_LIST.filter((w) => !selectedWords.some((s) => s.word === w.word)),
    [selectedWords]
  );

  const usedSymbols = useMemo(() => {
    const set = new Set<string>();
    for (const w of selectedWords) {
      for (const p of w.phonemes) set.add(p);
    }
    return set;
  }, [selectedWords]);

  const searchBoxColors: SearchBoxColor[] = useMemo(() => {
    const colors: SearchBoxColor[] = Array(MAX_PHONEME_SLOTS).fill('none');
    if (searchPhonemes.length === 0) return colors;

    if (searchPhonemes.length === 1) {
      const symbol = searchPhonemes[0];
      const startsWord = availableWords.some((w) => w.phonemes[0] === symbol);
      const appearsAnywhere = availableWords.some((w) => w.phonemes.includes(symbol));
      colors[0] = startsWord ? 'green' : appearsAnywhere ? 'yellow' : 'none';
      return colors;
    }

    const hasMatch = availableWords.some((w) =>
      searchPhonemes.every((symbol, i) => w.phonemes[i] === symbol)
    );
    if (hasMatch) {
      for (let i = 0; i < searchPhonemes.length; i++) colors[i] = 'green';
    }
    return colors;
  }, [availableWords, searchPhonemes]);

  const listRows: ListRow[] = useMemo(() => {
    if (searchPhonemes.length === 0) {
      return availableWords.map((entry) => ({
        entry,
        colors: Array.from({ length: MAX_PHONEME_SLOTS }, (_, i) =>
          entry.phonemes[i] ? 'grey' : 'empty'
        ) as CellColor[],
      }));
    }

    if (searchPhonemes.length === 1) {
      const symbol = searchPhonemes[0];
      const groups: ListRow[][] = Array.from({ length: MAX_PHONEME_SLOTS }, () => []);

      for (const entry of availableWords) {
        const primaryIndex = entry.phonemes.findIndex((p) => p === symbol);
        if (primaryIndex === -1) continue;

        const colors: CellColor[] = Array.from({ length: MAX_PHONEME_SLOTS }, (_, i) => {
          if (!entry.phonemes[i]) return 'empty';
          if (i === primaryIndex) return primaryIndex === 0 ? 'green' : 'yellow';
          if (entry.phonemes[i] === symbol) return 'yellow';
          return 'grey';
        });

        groups[primaryIndex].push({ entry, colors });
      }

      return groups.flat();
    }

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
    onSelectedWordsChange([...selectedWords, entry]);
    setSearchPhonemes([]);
  };

  const handleClearWord = () => {
    if (!highlighted) return;
    onSelectedWordsChange(selectedWords.filter((w) => w.word !== highlighted));
    setHighlighted(null);
  };

  const handleClearAll = () => {
    onSelectedWordsChange([]);
    setHighlighted(null);
  };

  const handleRandomise = () => {
    const shuffled = [...selectedWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    onSelectedWordsChange(shuffled);
  };

  return (
    <div ref={rowRef} className={`flex gap-8 ${rowWide ? 'flex-row items-start' : 'flex-col items-stretch'}`}>
      <div className="flex w-full max-w-[350px] flex-shrink-0 flex-col">
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
                  className={`flex h-12 w-12 items-center justify-center rounded-md text-xl font-semibold ${
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

        <div className="mt-6 mb-3">
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
                      className={`flex h-7 w-7 items-center justify-center rounded text-sm ${cellClass(colors[i])}`}
                    >
                      {entry.phonemes[i] ?? ''}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>

          {addButtonLabel && onAddButtonClick && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => onAddButtonClick(listRows.map((row) => row.entry))}
                disabled={listRows.length === 0 || (disableAddWhenFiltered && searchPhonemes.length > 0)}
                className="rounded-md bg-key px-3 py-1.5 text-sm font-medium text-key-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {addButtonLabel}
              </button>
            </div>
          )}
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
                        className={`flex h-7 w-7 items-center justify-center rounded text-sm ${
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
              className="rounded-md bg-key px-3 py-1.5 text-sm font-medium text-key-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear Word
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={selectedWords.length === 0}
              className="rounded-md bg-key px-3 py-1.5 text-sm font-medium text-key-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear All Words
            </button>
            <button
              type="button"
              onClick={handleRandomise}
              disabled={selectedWords.length < 2}
              className="rounded-md bg-key px-3 py-1.5 text-sm font-medium text-key-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Randomise
            </button>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mt-8">
          <PhonemeKeypad
            topGrid={KEYPAD_TOP}
            bottomGrid={KEYPAD_BOTTOM}
            onSelect={handleKeypadSelect}
            onBackspace={handleBackspace}
            usedSymbols={usedSymbols}
            align="center"
          />
          <div className="mt-12 flex w-full justify-center">{footerSlot}</div>
        </div>
      </div>
    </div>
  );
}
