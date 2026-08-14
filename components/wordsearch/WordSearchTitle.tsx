'use client';
import { useEffect, useRef, useState } from 'react';
import { KEYPAD_TOP, KEYPAD_BOTTOM, getPhonemeHoverText } from '@/lib/phonemeData';

const ALL_PHONEME_SYMBOLS = [...KEYPAD_TOP, ...KEYPAD_BOTTOM]
  .flat()
  .filter((symbol): symbol is string => symbol !== '');

function randomPhoneme(): string {
  return ALL_PHONEME_SYMBOLS[Math.floor(Math.random() * ALL_PHONEME_SYMBOLS.length)];
}

const COLS = 9;
const ROWS = 3;

const FIXED_CELLS: { row: number; col: number; symbol: string }[] = [
  { row: 2, col: 2, symbol: 'w' },
  { row: 2, col: 3, symbol: 'ɜː' },
  { row: 2, col: 4, symbol: 'd' },
  { row: 1, col: 6, symbol: 's' },
  { row: 2, col: 7, symbol: 'ɜː' },
  { row: 3, col: 8, symbol: 'tʃ' },
];

function flatIndex(row: number, col: number) {
  return (row - 1) * COLS + (col - 1);
}

const WORD1_INDICES = [flatIndex(2, 2), flatIndex(2, 3), flatIndex(2, 4)];
const WORD2_INDICES = [flatIndex(1, 6), flatIndex(2, 7), flatIndex(3, 8)];

type CellColor = 'grey' | 'yellow' | 'green';
interface CellState {
  revealed: boolean;
  flipping: boolean;
  color: CellColor;
}

type BoxColor = 'grey' | 'blue';
interface BoxState {
  revealed: boolean;
  flipping: boolean;
  color: BoxColor;
}

const INITIAL_DELAY_MS = 1000;
const FLIP_MS = 500;
const SWIPE_STAGGER_MS = 100;
const SWIPE_HOLD_MS = 500;
const SOLVE_STAGGER_MS = 150;
const GAP_BETWEEN_WORDS_MS = 500;

function emptyCellState(): CellState {
  return { revealed: false, flipping: false, color: 'grey' };
}
function emptyBoxState(): BoxState {
  return { revealed: false, flipping: false, color: 'grey' };
}

type Props = {
  resetSignal: number;
  onComplete?: () => void;
};

export default function WordSearchTitle({ resetSignal, onComplete }: Props) {
  const symbolsRef = useRef<string[]>([]);
  const [cellStates, setCellStates] = useState<CellState[]>(() =>
    Array.from({ length: ROWS * COLS }, emptyCellState)
  );
  const [wordBox, setWordBox] = useState<BoxState>(emptyBoxState);
  const [searchBox, setSearchBox] = useState<BoxState>(emptyBoxState);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Always call the LATEST onComplete, not whichever version was current
  // when this effect first scheduled its timers — important since the
  // parent (WordSearchBuilder) redefines this callback every render, and
  // by the time this fires (several seconds later) it needs fresh state.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const fixedMap = new Map<string, string>();
    for (const cell of FIXED_CELLS) fixedMap.set(`${cell.row},${cell.col}`, cell.symbol);
    symbolsRef.current = Array.from({ length: ROWS * COLS }, (_, i) => {
      const row = Math.floor(i / COLS) + 1;
      const col = (i % COLS) + 1;
      return fixedMap.get(`${row},${col}`) ?? randomPhoneme();
    });

    timers.current.forEach(clearTimeout);
    timers.current = [];
    setCellStates(Array.from({ length: ROWS * COLS }, emptyCellState));
    setWordBox(emptyBoxState());
    setSearchBox(emptyBoxState());

    const t = (fn: () => void, delay: number) => {
      timers.current.push(setTimeout(fn, delay));
    };

    const setCellsFlipping = (indices: number[], flipping: boolean) => {
      setCellStates((prev) => {
        const next = [...prev];
        indices.forEach((i) => (next[i] = { ...next[i], flipping }));
        return next;
      });
    };
    const revealCells = (indices: number[], color: CellColor) => {
      setCellStates((prev) => {
        const next = [...prev];
        indices.forEach((i) => (next[i] = { ...next[i], revealed: true, color }));
        return next;
      });
    };
    const setCellColorInstant = (index: number, color: CellColor) => {
      setCellStates((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], color };
        return next;
      });
    };
    const setCellFlipping = (index: number, flipping: boolean) => {
      setCellStates((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], flipping };
        return next;
      });
    };
    const setCellColorFlip = (index: number, color: CellColor) => {
      setCellStates((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], color };
        return next;
      });
    };

    const setBoxFlipping = (which: 'word' | 'search', flipping: boolean) => {
      const setter = which === 'word' ? setWordBox : setSearchBox;
      setter((prev) => ({ ...prev, flipping }));
    };
    const revealBox = (which: 'word' | 'search', color: BoxColor) => {
      const setter = which === 'word' ? setWordBox : setSearchBox;
      setter((prev) => ({ ...prev, revealed: true, color }));
    };
    const setBoxColor = (which: 'word' | 'search', color: BoxColor) => {
      const setter = which === 'word' ? setWordBox : setSearchBox;
      setter((prev) => ({ ...prev, color }));
    };

    let time = INITIAL_DELAY_MS;
    const REVEAL_STAGGER_MS = FLIP_MS / 2;

    for (let row = 1; row <= ROWS; row++) {
      const rowIndices = Array.from({ length: COLS }, (_, c) => flatIndex(row, c + 1));
      t(() => setCellsFlipping(rowIndices, true), time);
      t(() => revealCells(rowIndices, 'grey'), time + FLIP_MS / 2);
      t(() => setCellsFlipping(rowIndices, false), time + FLIP_MS);
      time += REVEAL_STAGGER_MS;
    }

    t(() => setBoxFlipping('word', true), time);
    t(() => revealBox('word', 'grey'), time + FLIP_MS / 2);
    t(() => setBoxFlipping('word', false), time + FLIP_MS);
    time += REVEAL_STAGGER_MS;

    t(() => setBoxFlipping('search', true), time);
    t(() => revealBox('search', 'grey'), time + FLIP_MS / 2);
    t(() => setBoxFlipping('search', false), time + FLIP_MS);
    time += REVEAL_STAGGER_MS;

    time += 1000;
    WORD1_INDICES.forEach((idx, i) => {
      t(() => setCellColorInstant(idx, 'yellow'), time + i * SWIPE_STAGGER_MS);
    });
    time += (WORD1_INDICES.length - 1) * SWIPE_STAGGER_MS;
    time += SWIPE_HOLD_MS;

    WORD1_INDICES.forEach((idx, i) => {
      const start = time + i * SOLVE_STAGGER_MS;
      t(() => setCellFlipping(idx, true), start);
      t(() => setCellColorFlip(idx, 'green'), start + FLIP_MS / 2);
      t(() => setCellFlipping(idx, false), start + FLIP_MS);
    });
    const word1LettersEnd = time + (WORD1_INDICES.length - 1) * SOLVE_STAGGER_MS + FLIP_MS;

    t(() => setBoxFlipping('word', true), word1LettersEnd);
    t(() => setBoxColor('word', 'blue'), word1LettersEnd + FLIP_MS / 2);
    t(() => setBoxFlipping('word', false), word1LettersEnd + FLIP_MS);

    time = word1LettersEnd + FLIP_MS + GAP_BETWEEN_WORDS_MS;
    WORD2_INDICES.forEach((idx, i) => {
      t(() => setCellColorInstant(idx, 'yellow'), time + i * SWIPE_STAGGER_MS);
    });
    time += (WORD2_INDICES.length - 1) * SWIPE_STAGGER_MS;
    time += SWIPE_HOLD_MS;

    WORD2_INDICES.forEach((idx, i) => {
      const start = time + i * SOLVE_STAGGER_MS;
      t(() => setCellFlipping(idx, true), start);
      t(() => setCellColorFlip(idx, 'green'), start + FLIP_MS / 2);
      t(() => setCellFlipping(idx, false), start + FLIP_MS);
    });
    const word2LettersEnd = time + (WORD2_INDICES.length - 1) * SOLVE_STAGGER_MS + FLIP_MS;

    t(() => setBoxFlipping('search', true), word2LettersEnd);
    t(() => setBoxColor('search', 'blue'), word2LettersEnd + FLIP_MS / 2);
    t(() => setBoxFlipping('search', false), word2LettersEnd + FLIP_MS);

    // Closing flourish
    time = word2LettersEnd + FLIP_MS + SWIPE_HOLD_MS;
    const FLOURISH_STAGGER_MS = REVEAL_STAGGER_MS / 2;

    for (let row = 1; row <= ROWS; row++) {
      const rowIndices = Array.from({ length: COLS }, (_, c) => flatIndex(row, c + 1));
      t(() => setCellsFlipping(rowIndices, true), time);
      t(() => setCellsFlipping(rowIndices, false), time + FLIP_MS);
      time += FLOURISH_STAGGER_MS;
    }

    t(() => setBoxFlipping('word', true), time);
    t(() => setBoxFlipping('word', false), time + FLIP_MS);
    time += FLOURISH_STAGGER_MS;

    t(() => setBoxFlipping('search', true), time);
    t(() => setBoxFlipping('search', false), time + FLIP_MS);

    const finalTime = time + FLIP_MS;
    t(() => onCompleteRef.current?.(), finalTime);

    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, [resetSignal]);

  function cellClass(state: CellState) {
    if (!state.revealed) return 'border-2 border-foreground/20 bg-background';
    if (state.color === 'green') return 'bg-match text-match-foreground';
    if (state.color === 'yellow') return 'bg-partial text-partial-foreground';
    return 'bg-key text-key-foreground';
  }
  function boxClass(state: BoxState) {
    if (!state.revealed) return 'border border-foreground/20 bg-background';
    if (state.color === 'blue') return 'bg-word-reveal text-word-reveal-foreground';
    return 'bg-key text-key-foreground';
  }

  return (
    <div>
      <div className="flex justify-center" style={{ marginBottom: 44 }}>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 40px)` }}>
          {cellStates.map((state, i) => {
            const symbol = symbolsRef.current[i];
            return (
              <div key={i} style={{ perspective: '400px' }}>
                <div
                  title={state.revealed ? getPhonemeHoverText(symbol) : undefined}
                  className={`flex items-center justify-center rounded-md text-base font-medium ${cellClass(
                    state
                  )} ${state.flipping ? 'animate-tile-flip' : ''}`}
                  style={{ width: 40, height: 40 }}
                >
                  {state.revealed ? symbol : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="flex items-center justify-center gap-1 text-lg text-foreground/70"
        style={{ marginBottom: 44 }}
      >
        <span>A Phoneme</span>
        <div style={{ perspective: '400px' }}>
          <div
            className={`flex items-center justify-center rounded-md text-lg font-semibold ${boxClass(
              wordBox
            )} ${wordBox.flipping ? 'animate-tile-flip' : ''}`}
            style={{ width: 128, height: 40 }}
          >
            {wordBox.revealed ? 'word' : ''}
          </div>
        </div>
        <div style={{ perspective: '400px' }}>
          <div
            className={`flex items-center justify-center rounded-md text-lg font-semibold ${boxClass(
              searchBox
            )} ${searchBox.flipping ? 'animate-tile-flip' : ''}`}
            style={{ width: 128, height: 40 }}
          >
            {searchBox.revealed ? 'search' : ''}
          </div>
        </div>
        <span>Game</span>
      </div>
    </div>
  );
}
