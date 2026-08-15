'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KEYPAD_TOP, KEYPAD_BOTTOM, getPhonemeHoverText } from '@/lib/phonemeData';
import { computeSegmentsForCellSequence, CONNECTOR_THICKNESS, CONNECTOR_OVERLAP } from '@/lib/wordSearchConnectors';

const ALL_PHONEME_SYMBOLS = [...KEYPAD_TOP, ...KEYPAD_BOTTOM]
  .flat()
  .filter((symbol): symbol is string => symbol !== '');

function randomPhoneme(): string {
  return ALL_PHONEME_SYMBOLS[Math.floor(Math.random() * ALL_PHONEME_SYMBOLS.length)];
}

const COLS = 9;
const ROWS = 3;
const TITLE_CELL_SIZE = 40;
const TITLE_GAP = 4; // matches gap-1

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

// Same positions as WORD1_INDICES/WORD2_INDICES, but as 0-indexed
// row/col pairs — what computeSegmentsForCellSequence expects.
const WORD1_CELLS = [
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
];
const WORD2_CELLS = [
  { row: 0, col: 5 },
  { row: 1, col: 6 },
  { row: 2, col: 7 },
];

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
const CELL_STAGGER_MS = 60; // gap between successive cells starting within one row

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
  const [word1ConnectedCount, setWord1ConnectedCount] = useState(0);
  const [word2ConnectedCount, setWord2ConnectedCount] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Always call the LATEST onComplete, not whichever version was current
  // when this effect first scheduled its timers — important since the
  // parent (WordSearchBuilder) redefines this callback every render, and
  // by the time this fires (several seconds later) it needs fresh state.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const word1Segments = useMemo(
    () =>
      computeSegmentsForCellSequence(
        WORD1_CELLS,
        TITLE_CELL_SIZE,
        TITLE_GAP,
        CONNECTOR_THICKNESS,
        CONNECTOR_OVERLAP,
        'title-word1'
      ),
    []
  );
  const word2Segments = useMemo(
    () =>
      computeSegmentsForCellSequence(
        WORD2_CELLS,
        TITLE_CELL_SIZE,
        TITLE_GAP,
        CONNECTOR_THICKNESS,
        CONNECTOR_OVERLAP,
        'title-word2'
      ),
    []
  );

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
    setWord1ConnectedCount(0);
    setWord2ConnectedCount(0);

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

      rowIndices.forEach((idx, i) => {
        const start = time + i * CELL_STAGGER_MS;
        t(() => setCellsFlipping([idx], true), start);
        t(() => revealCells([idx], 'grey'), start + FLIP_MS / 2);
        t(() => setCellsFlipping([idx], false), start + FLIP_MS);
      });

      time += REVEAL_STAGGER_MS; // next ROW still starts on the same schedule as before
    }

    t(() => setBoxFlipping('word', true), time);
    t(() => revealBox('word', 'blue'), time + FLIP_MS / 2);
    t(() => setBoxFlipping('word', false), time + FLIP_MS);
    time += REVEAL_STAGGER_MS;

    t(() => setBoxFlipping('search', true), time);
    t(() => revealBox('search', 'blue'), time + FLIP_MS / 2);
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
      // Segment i-1 connects THIS cell back to the previous one — reveal
      // it the instant this cell turns green, so connectors grow
      // progressively alongside the letters instead of all appearing at
      // once at the end.
      if (i > 0) {
        t(() => setWord1ConnectedCount(i), start + FLIP_MS / 2);
      }
    });
    const word1LettersEnd = time + (WORD1_INDICES.length - 1) * SOLVE_STAGGER_MS + FLIP_MS;

    t(() => setBoxFlipping('word', true), word1LettersEnd);
    t(() => setBoxColor('word', 'grey'), word1LettersEnd + FLIP_MS / 2);
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
      if (i > 0) {
        t(() => setWord2ConnectedCount(i), start + FLIP_MS / 2);
      }
    });
    const word2LettersEnd = time + (WORD2_INDICES.length - 1) * SOLVE_STAGGER_MS + FLIP_MS;

    t(() => setBoxFlipping('search', true), word2LettersEnd);
    t(() => setBoxColor('search', 'grey'), word2LettersEnd + FLIP_MS / 2);
    t(() => setBoxFlipping('search', false), word2LettersEnd + FLIP_MS);

    // Closing flourish
    time = word2LettersEnd + FLIP_MS + SWIPE_HOLD_MS;
    const FLOURISH_STAGGER_MS = REVEAL_STAGGER_MS / 2;
    const FLOURISH_CELL_STAGGER_MS = CELL_STAGGER_MS / 2; // keep the flourish's cell ripple proportionally faster too

    for (let row = 1; row <= ROWS; row++) {
      const rowIndices = Array.from({ length: COLS }, (_, c) => flatIndex(row, c + 1));

      rowIndices.forEach((idx, i) => {
        const start = time + i * FLOURISH_CELL_STAGGER_MS;
        t(() => setCellsFlipping([idx], true), start);
        t(() => setCellsFlipping([idx], false), start + FLIP_MS);
      });

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
    return 'border-2 border-word-reveal bg-background text-foreground line-through';
  }

  return (
    <div>
      <div className="flex justify-center" style={{ marginBottom: 44 }}>
        <div
          style={{
            position: 'relative',
            width: COLS * TITLE_CELL_SIZE + (COLS - 1) * TITLE_GAP,
            height: ROWS * TITLE_CELL_SIZE + (ROWS - 1) * TITLE_GAP,
          }}
        >
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

          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {[...word1Segments.slice(0, word1ConnectedCount), ...word2Segments.slice(0, word2ConnectedCount)].map(
              (seg) => (
                <div
                  key={seg.key}
                  className="bg-match"
                  style={{
                    position: 'absolute',
                    left: seg.left,
                    top: seg.top,
                    width: seg.width,
                    height: seg.height,
                    borderRadius: 1,
                    transform: seg.rotationDeg ? `rotate(${seg.rotationDeg}deg)` : undefined,
                  }}
                />
              )
            )}
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-center gap-1 text-lg text-foreground/70"
        style={{ marginBottom: 30 }}
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
      <div
        className="flex items-center justify-center gap-2 text-base text-foreground/70"
        style={{ marginBottom: 44 }}
      >
        <span>To make a guess, click on a phoneme symbol and hold down your mouse while dragging, then release.</span>
      </div>
    </div>
  );
}
