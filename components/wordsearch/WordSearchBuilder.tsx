'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import PhonemeWordSelector from '@/components/shared/PhonemeWordSelector';
import WordSearchGrid from './WordSearchGrid';
import WordSearchTitle from './WordSearchTitle';
import GridDimensionStepper from './GridDimensionStepper';
import WordCountIndicator from './WordCountIndicator';
import ToggleSwitch from '@/components/shared/ToggleSwitch';
import { WORD_LIST, PhonemeWordEntry } from '@/lib/phonemeData';
import { getWordCountForGridSize } from '@/lib/wordSearchData';
import { getInitialWordSearchState, saveWordSearchState } from '@/lib/wordSearchStorage';
import { generateWordSearchGrid, PlacedWord } from '@/lib/wordSearchGenerator';
import { downloadStandaloneWordSearchHtml } from '@/lib/wordSearchExport';

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

interface IntroLetterState {
  word: string;
  revealed: boolean[];
  flipping: boolean[];
}

const SOLVE_FLIP_MS = 500;
const SOLVE_STAGGER_MS = 150;
const SOLVE_HOLD_MS = 1000;

const INTRO_FLIP_MS = 500;
const CELL_STAGGER_MS = 60;
const LETTER_STAGGER_MS = 60;
const GRID_ROW_STAGGER_MS = 80;

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
  const [placedGrid, setPlacedGrid] = useState<(string | null)[][] | null>(initial.placedGrid);
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>(initial.placedWords);
  const [revealWords, setRevealWords] = useState(initial.revealWords);
  const [hint, setHint] = useState<HintState | null>(null);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set(initial.foundWords));
  const [solves, setSolves] = useState<SolveState[]>([]);
  const [titleSignal, setTitleSignal] = useState(0);

  // Set once at mount: true only if there's a genuinely restored puzzle
  // to resume. Consumed (flipped to false) the first time the title demo
  // finishes — after that, every subsequent Build/Rebuild/Start New
  // Puzzle goes through the normal animated intro as usual.
  const pendingRestoreRef = useRef(Boolean(initial.placedGrid));
  const hasMountedRef = useRef(false);

  // --- intro reveal sequence state ---
  const [gridCellFlip, setGridCellFlip] = useState<{ revealed: boolean; flipping: boolean }[][]>([]);
  const [englishRevealed, setEnglishRevealed] = useState<Set<string>>(new Set());
  const [englishFlippingWords, setEnglishFlippingWords] = useState<Set<string>>(new Set());
  const [hintRevealed, setHintRevealed] = useState<Set<string>>(new Set());
  const [hintFlippingWords, setHintFlippingWords] = useState<Set<string>>(new Set());
  const [letterStates, setLetterStates] = useState<IntroLetterState[]>([]);
  const [isPlayable, setIsPlayable] = useState(false);
  const introTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // --- click-to-replay a found word's letters on the grid ---
  const [replayFlippingKeys, setReplayFlippingKeys] = useState<Set<string>>(new Set());
  const replayTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // --- completion flourish state ---
  const [completionFlipSignal, setCompletionFlipSignal] = useState(0);
  const hasTriggeredCompletionRef = useRef(false);

  const hintCounter = useRef(0);
  const solveNonceRef = useRef(0);
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

  const clearReplay = () => {
    replayTimersRef.current.forEach(clearTimeout);
    replayTimersRef.current = [];
    setReplayFlippingKeys(new Set());
  };

  // Fires the completion flourish exactly once per puzzle, the moment
  // the last word gets found (or, on a restore of an already-completed
  // puzzle, once isPlayable first becomes true after the title demo).
  useEffect(() => {
    if (isPuzzleComplete && !hasTriggeredCompletionRef.current) {
      hasTriggeredCompletionRef.current = true;
      clearReplay();
      setCompletionFlipSignal((n) => n + 1);
    }
  }, [isPuzzleComplete]);

  const clearAllSolves = () => {
    solveTimersRef.current.forEach((timers) => timers.forEach(clearTimeout));
    solveTimersRef.current.clear();
    setSolves([]);
  };

  const clearIntroTimers = () => {
    introTimersRef.current.forEach(clearTimeout);
    introTimersRef.current = [];
  };

  const resetIntroState = (size: number, words: PhonemeWordEntry[]) => {
    clearIntroTimers();
    clearReplay();
    setGridCellFlip(
      Array.from({ length: size }, () =>
        Array.from({ length: size }, () => ({ revealed: false, flipping: false }))
      )
    );
    setEnglishRevealed(new Set());
    setEnglishFlippingWords(new Set());
    setHintRevealed(new Set());
    setHintFlippingWords(new Set());
    setLetterStates(
      words.map((w) => ({
        word: w.word,
        revealed: Array(w.phonemes.length).fill(false),
        flipping: Array(w.phonemes.length).fill(false),
      }))
    );
    setIsPlayable(false);
    hasTriggeredCompletionRef.current = false;
    setCompletionFlipSignal(0);
  };

  // Skips the staged reveal entirely — used only when resuming a puzzle
  // restored from cookies, so navigating back to this tab doesn't replay
  // the whole grid/word-list animation every time. Jumps straight to
  // "fully revealed and playable."
  const applyRestoredState = (size: number, words: PhonemeWordEntry[]) => {
    clearIntroTimers();
    setGridCellFlip(
      Array.from({ length: size }, () =>
        Array.from({ length: size }, () => ({ revealed: true, flipping: false }))
      )
    );
    setEnglishRevealed(new Set(words.map((w) => w.word)));
    setEnglishFlippingWords(new Set());
    setHintRevealed(new Set(words.filter((w) => wordPhonemeCells[w.word]).map((w) => w.word)));
    setHintFlippingWords(new Set());
    setLetterStates(
      words.map((w) => ({
        word: w.word,
        revealed: Array(w.phonemes.length).fill(true),
        flipping: Array(w.phonemes.length).fill(false),
      }))
    );
    setIsPlayable(true);
  };

  // Orchestrates the post-title reveal: grid rows (cells within a row
  // stagger slightly, rows overlap with each other), then a pass
  // revealing only English word boxes, then a per-row pass revealing the
  // hint "?" box followed by each phoneme letter (letters within a word
  // stagger slightly too — fast but not simultaneous).
  const startIntroSequence = () => {
    clearIntroTimers();

    const t = (fn: () => void, delay: number) => {
      introTimersRef.current.push(setTimeout(fn, delay));
    };

    const STAGGER_MS = INTRO_FLIP_MS / 2;
    let time = 1000;

    let stage1End = time;
    for (let row = 0; row < gridSize; row++) {
      let rowEnd = time;
      for (let col = 0; col < gridSize; col++) {
        const cellStart = time + col * CELL_STAGGER_MS;
        t(
          () =>
            setGridCellFlip((prev) => {
              const next = prev.map((r) => [...r]);
              if (next[row]?.[col]) next[row][col] = { ...next[row][col], flipping: true };
              return next;
            }),
          cellStart
        );
        t(
          () =>
            setGridCellFlip((prev) => {
              const next = prev.map((r) => [...r]);
              if (next[row]?.[col]) next[row][col] = { ...next[row][col], revealed: true };
              return next;
            }),
          cellStart + INTRO_FLIP_MS / 2
        );
        t(
          () =>
            setGridCellFlip((prev) => {
              const next = prev.map((r) => [...r]);
              if (next[row]?.[col]) next[row][col] = { ...next[row][col], flipping: false };
              return next;
            }),
          cellStart + INTRO_FLIP_MS
        );
        rowEnd = Math.max(rowEnd, cellStart + INTRO_FLIP_MS);
      }
      stage1End = Math.max(stage1End, rowEnd);
      time += GRID_ROW_STAGGER_MS;
    }
    time = stage1End;

    selectedWords.forEach((entry, idx) => {
      const word = entry.word;
      const start = time + idx * STAGGER_MS;
      t(() => setEnglishFlippingWords((prev) => new Set(prev).add(word)), start);
      t(() => setEnglishRevealed((prev) => new Set(prev).add(word)), start + INTRO_FLIP_MS / 2);
      t(
        () =>
          setEnglishFlippingWords((prev) => {
            const next = new Set(prev);
            next.delete(word);
            return next;
          }),
        start + INTRO_FLIP_MS
      );
    });
    const stage2End =
      selectedWords.length > 0 ? time + (selectedWords.length - 1) * STAGGER_MS + INTRO_FLIP_MS : time;
    time = stage2End;

    let stage3MaxEnd = time;
    selectedWords.forEach((entry, idx) => {
      const word = entry.word;
      const isPlaced = Boolean(wordPhonemeCells[word]);
      let cursor = time + idx * STAGGER_MS;

      if (isPlaced) {
        const hintStart = cursor;
        t(() => setHintFlippingWords((prev) => new Set(prev).add(word)), hintStart);
        t(() => setHintRevealed((prev) => new Set(prev).add(word)), hintStart + INTRO_FLIP_MS / 2);
        t(
          () =>
            setHintFlippingWords((prev) => {
              const next = new Set(prev);
              next.delete(word);
              return next;
            }),
          hintStart + INTRO_FLIP_MS
        );
        cursor += INTRO_FLIP_MS;
      }

      let letterEnd = cursor;
      entry.phonemes.forEach((_, letterIndex) => {
        const letterStart = cursor;
        t(
          () =>
            setLetterStates((prev) =>
              prev.map((s) =>
                s.word === word ? { ...s, flipping: s.flipping.map((f, i) => (i === letterIndex ? true : f)) } : s
              )
            ),
          letterStart
        );
        t(
          () =>
            setLetterStates((prev) =>
              prev.map((s) =>
                s.word === word ? { ...s, revealed: s.revealed.map((r, i) => (i === letterIndex ? true : r)) } : s
              )
            ),
          letterStart + INTRO_FLIP_MS / 2
        );
        t(
          () =>
            setLetterStates((prev) =>
              prev.map((s) =>
                s.word === word ? { ...s, flipping: s.flipping.map((f, i) => (i === letterIndex ? false : f)) } : s
              )
            ),
          letterStart + INTRO_FLIP_MS
        );
        letterEnd = letterStart + INTRO_FLIP_MS;
        cursor += LETTER_STAGGER_MS;
      });
      cursor = letterEnd;

      stage3MaxEnd = Math.max(stage3MaxEnd, cursor);
    });

    t(() => setIsPlayable(true), stage3MaxEnd);
  };

  const handleTitleComplete = () => {
    if (!placedGrid) return;
    startIntroSequence();
  };

  const handleHintClick = (entry: PhonemeWordEntry) => {
    if (!isPlayable) return;
    if (foundWords.has(entry.word)) return;
    if (solves.some((s) => s.word === entry.word)) return;
    if (!wordPhonemeCells[entry.word]) return;
    const idx = Math.floor(Math.random() * entry.phonemes.length);
    hintCounter.current += 1;
    setHint({ word: entry.word, phonemeIndex: idx, nonce: hintCounter.current });
  };

  // Click-to-replay on a found word's tick box: flips that word's grid
  // cells (only the grid — the word list is already fully green) one at
  // a time, in order, with no color change. Disabled once the puzzle is
  // complete and the completion flourish has begun.
  const handleFoundWordClick = (word: string) => {
    if (isPuzzleComplete) return;
    if (!foundWords.has(word)) return;
    const cells = wordPhonemeCells[word];
    if (!cells || cells.length === 0) return;

    clearReplay();

    cells.forEach((cell, i) => {
      const key = `${cell.row},${cell.col}`;
      const start = i * SOLVE_STAGGER_MS;
      replayTimersRef.current.push(
        setTimeout(() => setReplayFlippingKeys((prev) => new Set(prev).add(key)), start),
        setTimeout(
          () =>
            setReplayFlippingKeys((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            }),
          start + SOLVE_FLIP_MS
        )
      );
    });
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
    if (!isPlayable) return;
    if (solves.some((s) => s.word === word)) return;
    beginSolveSequence(word);
  };

  const handleSelectedWordsChange = (words: PhonemeWordEntry[]) => {
    setSelectedWords(words.slice(0, targetWordCount));
  };

  const prevGridSizeRef = useRef(gridSize);
    useEffect(() => {
      if (prevGridSizeRef.current === gridSize) return;
      prevGridSizeRef.current = gridSize;
      setSelectedWords([]);
    }, [gridSize]);

  const prevWordSetRef = useRef<string>(
    [...selectedWords.map((w) => w.word)].sort().join(',')
  );
  useEffect(() => {
    const currentWordSet = [...selectedWords.map((w) => w.word)].sort().join(',');
    if (currentWordSet === prevWordSetRef.current) return;
    prevWordSetRef.current = currentWordSet;
    // A genuine word-set change invalidates any pending restore — treat
    // it the same as a fresh Build Puzzle from here on.
    pendingRestoreRef.current = false;
    setPlacedGrid(null);
    setPlacedWords([]);
    setHint(null);
    setFoundWords(new Set());
    clearAllSolves();
    resetIntroState(gridSize, selectedWords);
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
    pendingRestoreRef.current = false;
    const result = generateWordSearchGrid(selectedWords, gridSize);
    setPlacedGrid(result.grid);
    setPlacedWords(result.placedWords);
    setHint(null);
    setFoundWords(new Set());
    clearAllSolves();
    resetIntroState(gridSize, selectedWords);
    setTitleSignal((n) => n + 1);
  };

  const handleGenerateWordSearchPage = () => {
    if (!placedGrid) return;
    downloadStandaloneWordSearchHtml(selectedWords, gridSize);
  };

  useEffect(() => {
    if (hasMountedRef.current) return; // Strict Mode's phantom second invocation — no-op
    hasMountedRef.current = true;

    if (pendingRestoreRef.current) {
      pendingRestoreRef.current = false;
      applyRestoredState(gridSize, selectedWords);
      return;
    }
    setTitleSignal((n) => n + 1);
  }, []);

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
    saveWordSearchState({
      selectedWords,
      gridSize,
      scrollY,
      revealWords,
      placedGrid,
      placedWords,
      foundWords: Array.from(foundWords),
    });
  }, [selectedWords, gridSize, scrollY, revealWords, placedGrid, placedWords, foundWords]);

  useEffect(() => {
    return () => {
      solveTimersRef.current.forEach((timers) => timers.forEach(clearTimeout));
      clearIntroTimers();
      replayTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const gridIsPlayable = isPlayable && !isPuzzleComplete;

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-foreground/10 bg-background p-4 text-sm text-foreground/80">
        <p>
          Configure a phoneme-based Word Search activity below. Search the word list using
          the phoneme keypad and add words to your selection. [Dummy instructions — replace with final copy.]
        </p>
      </div>

      <div className="rounded-md border border-foreground/10 bg-background p-4 sm:p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Configure Word Search</h2>
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
                  onClick={handleGenerateWordSearchPage}
                  disabled={!placedGrid}
                  className="rounded-md bg-word-reveal px-4 py-2 text-sm font-medium text-word-reveal-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
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

        <WordSearchTitle
          resetSignal={titleSignal}
          isPlayable={gridIsPlayable}
          skipAnimation={pendingRestoreRef.current}
          onComplete={handleTitleComplete}
        />

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
          onFoundWordClick={handleFoundWordClick}
          replayFlippingKeys={replayFlippingKeys}
          foundWords={foundWords}
          solves={solves}
          onWordMatched={handleWordMatched}
          gridCellFlip={gridCellFlip}
          englishRevealed={englishRevealed}
          englishFlippingWords={englishFlippingWords}
          hintRevealed={hintRevealed}
          hintFlippingWords={hintFlippingWords}
          letterStates={letterStates}
          isPlayable={gridIsPlayable}
          completionFlipSignal={completionFlipSignal}
          onStartNewPuzzle={handleBuildPuzzle}
          isDarkTheme={theme === 'dark'}
          isHighContrast={highContrast}
        />
      </div>
    </div>
  );
}
