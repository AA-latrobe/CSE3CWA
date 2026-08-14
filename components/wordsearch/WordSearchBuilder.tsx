'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import PhonemeWordSelector from '@/components/shared/PhonemeWordSelector';
import WordSearchGrid from './WordSearchGrid';
import GridDimensionStepper from './GridDimensionStepper';
import WordCountIndicator from './WordCountIndicator';
import ToggleSwitch from '@/components/shared/ToggleSwitch';
import { WORD_LIST, PhonemeWordEntry } from '@/lib/phonemeData';
import { getWordCountForGridSize } from '@/lib/wordSearchData';
import { getInitialWordSearchState, saveWordSearchState } from '@/lib/wordSearchStorage';
import { generateWordSearchGrid, PlacedWord } from '@/lib/wordSearchGenerator';

const SEARCH_STORAGE_KEY = 'wordsearch_search_phonemes';

interface HintState {
  word: string;
  phonemeIndex: number;
  nonce: number;
}

export interface SolveState {
  word: string;
  nonce: number;
  hintFlipping: boolean;
  hintRevealed: boolean;
  letterFlipping: boolean[];
  letterRevealed: boolean[];
  wordBoxFlipping: boolean;
  wordBoxRevealed: boolean;
}

const SOLVE_FLIP_MS = 500;
const SOLVE_STAGGER_MS = 150;
const SOLVE_HOLD_MS = 1000;

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
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const [revealWords, setRevealWords] = useState(true);
  const [hint, setHint] = useState<HintState | null>(null);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  // Multiple words can be mid-animation simultaneously — an array, not a
  // single slot, so solving word B never clobbers word A's in-flight
  // animation if the user finds them in quick succession.
  const [solves, setSolves] = useState<SolveState[]>([]);
  const hintCounter = useRef(0);
  const solveNonceRef = useRef(0);
  // Each nonce gets its OWN timer list, so clearing one solve's timers
  // (e.g. on completion) never touches another concurrent solve's timers.
  const solveTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>[]>>(new Map());
  const hasRestoredScroll = useRef(false);

  const targetWordCount = getWordCountForGridSize(gridSize);

  const wordCellKeys = useMemo(() => {
    const set = new Set<string>();
    for (const pw of placedWords) {
      for (const cell of pw.cells) set.add(`${cell.row},${cell.col}`);
    }
    return set;
  }, [placedWords]);

  const placedWordSet = useMemo(() => new Set(placedWords.map((pw) => pw.word)), [placedWords]);

  const wordPhonemeCells = useMemo(() => {
    const map: Record<string, { row: number; col: number }[]> = {};
    for (const pw of placedWords) map[pw.word] = pw.cells;
    return map;
  }, [placedWords]);

  const hintCell = useMemo(() => {
    if (!hint) return null;
    const cells = wordPhonemeCells[hint.word];
    const cell = cells?.[hint.phonemeIndex];
    if (!cell) return null;
    return { row: cell.row, col: cell.col, token: `${hint.word}-${hint.phonemeIndex}-${hint.nonce}` };
  }, [hint, wordPhonemeCells]);

  const isPuzzleComplete = placedWords.length > 0 && foundWords.size === placedWords.length;

  useEffect(() => {
    if (isPuzzleComplete) {
      // Placeholder — a full-puzzle-complete celebration animation can
      // hook in here later.
    }
  }, [isPuzzleComplete]);

  const clearAllSolves = () => {
    solveTimersRef.current.forEach((timers) => timers.forEach(clearTimeout));
    solveTimersRef.current.clear();
    setSolves([]);
  };

  const handleHintClick = (entry: PhonemeWordEntry) => {
    if (foundWords.has(entry.word)) return;
    if (solves.some((s) => s.word === entry.word)) return; // already mid-solve
    if (!wordPhonemeCells[entry.word]) return;
    const idx = Math.floor(Math.random() * entry.phonemes.length);
    hintCounter.current += 1;
    setHint({ word: entry.word, phonemeIndex: idx, nonce: hintCounter.current });
  };

  const beginSolveSequence = (word: string) => {
    const cells = wordPhonemeCells[word];
    if (!cells) return;
    const length = cells.length;

    solveNonceRef.current += 1;
    const nonce = solveNonceRef.current;

    const initialState: SolveState = {
      word,
      nonce,
      hintFlipping: false,
      hintRevealed: false,
      letterFlipping: Array(length).fill(false),
      letterRevealed: Array(length).fill(false),
      wordBoxFlipping: false,
      wordBoxRevealed: false,
    };
    setSolves((prev) => [...prev, initialState]);

    const timers: ReturnType<typeof setTimeout>[] = [];
    solveTimersRef.current.set(nonce, timers);

    const update = (patch: Partial<SolveState>) => {
      setSolves((prev) => prev.map((s) => (s.nonce === nonce ? { ...s, ...patch } : s)));
    };
    const updateLetter = (index: number, key: 'letterFlipping' | 'letterRevealed', value: boolean) => {
      setSolves((prev) =>
        prev.map((s) => {
          if (s.nonce !== nonce) return s;
          const next = [...s[key]];
          next[index] = value;
          return { ...s, [key]: next };
        })
      );
    };

    const hintStart = SOLVE_HOLD_MS;
    timers.push(
      setTimeout(() => update({ hintFlipping: true }), hintStart),
      setTimeout(() => update({ hintRevealed: true }), hintStart + SOLVE_FLIP_MS / 2),
      setTimeout(() => update({ hintFlipping: false }), hintStart + SOLVE_FLIP_MS)
    );

    const lettersStart = hintStart + SOLVE_FLIP_MS;
    for (let i = 0; i < length; i++) {
      const start = lettersStart + i * SOLVE_STAGGER_MS;
      timers.push(
        setTimeout(() => updateLetter(i, 'letterFlipping', true), start),
        setTimeout(() => updateLetter(i, 'letterRevealed', true), start + SOLVE_FLIP_MS / 2),
        setTimeout(() => updateLetter(i, 'letterFlipping', false), start + SOLVE_FLIP_MS)
      );
    }

    const lettersEnd = lettersStart + (length - 1) * SOLVE_STAGGER_MS + SOLVE_FLIP_MS;
    timers.push(
      setTimeout(() => update({ wordBoxFlipping: true }), lettersEnd),
      setTimeout(() => update({ wordBoxRevealed: true }), lettersEnd + SOLVE_FLIP_MS / 2),
      setTimeout(() => {
        setFoundWords((prev) => {
          const next = new Set(prev);
          next.add(word);
          return next;
        });
        setSolves((prev) => prev.filter((s) => s.nonce !== nonce));
        solveTimersRef.current.delete(nonce);
      }, lettersEnd + SOLVE_FLIP_MS)
    );
  };

  const handleWordMatched = (word: string) => {
    if (solves.some((s) => s.word === word)) return; // duplicate match on an already-solving word — ignore
    beginSolveSequence(word);
  };

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

  const prevWordSetRef = useRef<string>(
    [...selectedWords.map((w) => w.word)].sort().join(',')
  );
  useEffect(() => {
    const currentWordSet = [...selectedWords.map((w) => w.word)].sort().join(',');
    if (currentWordSet === prevWordSetRef.current) return;
    prevWordSetRef.current = currentWordSet;
    setPlacedGrid(null);
    setPlacedWords([]);
    setHint(null);
    setFoundWords(new Set());
    clearAllSolves();
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
    setPlacedWords(result.placedWords);
    setHint(null);
    setFoundWords(new Set());
    clearAllSolves();
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

  useEffect(() => {
    return () => {
      solveTimersRef.current.forEach((timers) => timers.forEach(clearTimeout));
    };
  }, []);

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
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Preview</h2>
          <div className="flex items-center gap-3 rounded-md border border-foreground/10 px-3 py-2">
            <span className="whitespace-nowrap text-sm text-foreground">Reveal Words</span>
            <ToggleSwitch checked={revealWords} onChange={setRevealWords} />
          </div>
        </div>
        <WordSearchGrid
          gridSize={gridSize}
          selectedWords={selectedWords}
          placedGrid={placedGrid}
          wordCellKeys={wordCellKeys}
          wordPhonemeCells={wordPhonemeCells}
          hintCell={hintCell}
          revealWords={revealWords}
          placedWordSet={placedWordSet}
          hint={hint}
          onHintClick={handleHintClick}
          foundWords={foundWords}
          solves={solves}
          onWordMatched={handleWordMatched}
          isDarkTheme={theme === 'dark'}
          isHighContrast={highContrast}
        />
      </div>
    </div>
  );
}
