'use client';
import { useContainerWidth } from '@/lib/useContainerWidth';
import { useHintFlip } from '@/lib/useHintFlip';
import { useSelectionReleaseFlip } from '@/lib/useSelectionReleaseFlip';
import { matchDragToWord } from '@/lib/wordSearchMatching';
import { useEffect, useMemo, useRef, useState } from 'react';
import ToggleSwitch from '@/components/shared/ToggleSwitch';
import WordSearchWordListPreview from './WordSearchWordListPreview';
import type { SolveState } from './WordSearchBuilder';
import { PhonemeWordEntry, WORD_LIST, getPhonemeHoverText } from '@/lib/phonemeData';
import { getWordCountForGridSize, GREAT_WORD_POSITIONS } from '@/lib/wordSearchData';

const MAX_CELL_SIZE = 40;
const MIN_CELL_SIZE = 24;
const MIN_GAP = 4;
const LEFT_COL_WIDTH = 176;
const ROW_GAP = 24;
const COMPLETION_CELL_STAGGER_MS = 15;
const COMPLETION_ROW_STAGGER_MS = 80;
const COMPLETION_FLIP_MS = 500;
const FINALE_WAIT_MS = 1000; // pause between each finale stage

type HintState = { word: string; phonemeIndex: number; nonce: number } | null;
type Cell = { row: number; col: number };
type SolveCellInfo = { flipping: boolean; revealed: boolean } | null;
type FinaleCellState = { stage: 0 | 1 | 2; flipping: boolean };

interface IntroLetterState {
  word: string;
  revealed: boolean[];
  flipping: boolean[];
}

type Props = {
  gridSize: number;
  selectedWords: PhonemeWordEntry[];
  placedGrid: (string | null)[][] | null;
  wordCellKeys: Set<string>;
  wordPhonemeCells: Record<string, Cell[]>;
  hintCell: { row: number; col: number; token: string } | null;
  revealWords: boolean;
  placedWordSet: Set<string>;
  hint: HintState;
  onHintClick: (entry: PhonemeWordEntry) => void;
  foundWords: Set<string>;
  solves: SolveState[];
  onWordMatched: (word: string) => void;
  gridCellFlip: { revealed: boolean; flipping: boolean }[][];
  englishRevealed: Set<string>;
  englishFlippingWords: Set<string>;
  hintRevealed: Set<string>;
  hintFlippingWords: Set<string>;
  letterStates: IntroLetterState[];
  isPlayable: boolean;
  completionFlipSignal: number;
  isDarkTheme: boolean;
  isHighContrast: boolean;
};

function computeStraightPath(start: Cell, end: Cell): Cell[] | null {
  const dRow = end.row - start.row;
  const dCol = end.col - start.col;
  if (dRow === 0 && dCol === 0) return [start];

  const isHorizontal = dRow === 0;
  const isVertical = dCol === 0;
  const isDiagonal = Math.abs(dRow) === Math.abs(dCol);
  if (!isHorizontal && !isVertical && !isDiagonal) return null;

  const steps = Math.max(Math.abs(dRow), Math.abs(dCol));
  const stepRow = Math.sign(dRow);
  const stepCol = Math.sign(dCol);

  return Array.from({ length: steps + 1 }, (_, i) => ({
    row: start.row + stepRow * i,
    col: start.col + stepCol * i,
  }));
}

function GridCellView({
  symbol,
  isWordCell,
  revealWords,
  hintTriggerId,
  liveSelected,
  releaseToken,
  isFoundCell,
  solveInfo,
  cellSize,
  introRevealed,
  introFlipping,
  completionFlipping,
  finaleStage,
  finaleFlipping,
  isSpecialCell,
  specialSymbol,
  onMouseDown,
  onMouseEnter,
}: {
  symbol: string | null;
  isWordCell: boolean;
  revealWords: boolean;
  hintTriggerId: string | null;
  liveSelected: boolean;
  releaseToken: string | null;
  isFoundCell: boolean;
  solveInfo: SolveCellInfo;
  cellSize: number;
  introRevealed: boolean;
  introFlipping: boolean;
  completionFlipping: boolean;
  finaleStage: 0 | 1 | 2;
  finaleFlipping: boolean;
  isSpecialCell: boolean;
  specialSymbol: string | undefined;
  onMouseDown: () => void;
  onMouseEnter: () => void;
}) {
  const { flipping: hintFlipping, revealed: hintRevealed } = useHintFlip(hintTriggerId);
  const { flipping: selFlipping, highlighted: selHighlighted } = useSelectionReleaseFlip(releaseToken);

  // Finale sequence overrides everything else — grid is already
  // unplayable and fully solved by the time this ever activates.
  if (finaleStage > 0) {
    let cls: string;
    let content = '';
    let titleAttr: string | undefined;

    if (finaleStage === 1) {
      if (isSpecialCell) {
        cls = 'bg-match text-match-foreground';
        content = specialSymbol ?? '';
        titleAttr = specialSymbol ? getPhonemeHoverText(specialSymbol) : undefined;
      } else {
        cls = 'border-2 border-match bg-background';
      }
    } else {
      // stage 2 — special cells disappear entirely (no border, no fill)
      cls = isSpecialCell ? 'border-2 border-transparent bg-transparent' : 'border-2 border-word-reveal bg-background';
    }

    return (
      <div style={{ perspective: '400px' }}>
        <div
          title={titleAttr}
          className={`flex items-center justify-center rounded-md ${cls} ${
            finaleFlipping ? 'animate-tile-flip' : ''
          }`}
          style={{ width: cellSize, height: cellSize, fontSize: Math.max(10, cellSize * 0.4) }}
        >
          {content}
        </div>
      </div>
    );
  }

  if (!introRevealed) {
    return (
      <div style={{ perspective: '400px' }}>
        <div
          className={`flex items-center justify-center rounded-md border-2 border-foreground/20 bg-background ${
            introFlipping ? 'animate-tile-flip' : ''
          }`}
          style={{ width: cellSize, height: cellSize }}
        />
      </div>
    );
  }

  let baseColorClass: string;
  let baseFlipping: boolean;
  if (solveInfo) {
    baseColorClass = solveInfo.revealed ? 'bg-match text-match-foreground' : 'bg-partial text-partial-foreground';
    baseFlipping = solveInfo.flipping;
  } else if (isFoundCell) {
    baseColorClass = 'bg-match text-match-foreground';
    baseFlipping = false;
  } else {
    baseFlipping = hintFlipping;
    baseColorClass = hintRevealed
      ? 'bg-partial text-partial-foreground'
      : isWordCell && revealWords
      ? 'bg-key-used text-key-used-foreground'
      : 'bg-key text-key-foreground';
  }

  let colorClass = baseColorClass;
  let isFlipping = baseFlipping;

  if (liveSelected) {
    colorClass = 'bg-partial text-partial-foreground';
    isFlipping = false;
  } else if (selHighlighted) {
    colorClass = 'bg-partial text-partial-foreground';
    isFlipping = selFlipping;
  } else if (selFlipping) {
    colorClass = baseColorClass;
    isFlipping = true;
  }

  if (completionFlipping) {
    isFlipping = true;
  }

  return (
    <div style={{ perspective: '400px' }}>
      <div
        title={symbol ? getPhonemeHoverText(symbol) : undefined}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onDragStart={(e) => e.preventDefault()}
        className={`flex select-none items-center justify-center rounded-md ${colorClass} ${
          isFlipping ? 'animate-tile-flip' : ''
        } cursor-pointer`}
        style={{ width: cellSize, height: cellSize, fontSize: Math.max(10, cellSize * 0.4) }}
      >
        {symbol ?? ''}
      </div>
    </div>
  );
}

export default function WordSearchGrid({
  gridSize,
  selectedWords,
  placedGrid,
  wordCellKeys,
  wordPhonemeCells,
  hintCell,
  revealWords,
  placedWordSet,
  hint,
  onHintClick,
  foundWords,
  solves,
  onWordMatched,
  gridCellFlip,
  englishRevealed,
  englishFlippingWords,
  hintRevealed,
  hintFlippingWords,
  letterStates,
  isPlayable,
  completionFlipSignal,
  isDarkTheme,
  isHighContrast,
}: Props) {
  const naturalGridWidth = gridSize * MAX_CELL_SIZE + (gridSize - 1) * MIN_GAP;
  const minGridWidth = gridSize * MIN_CELL_SIZE + (gridSize - 1) * MIN_GAP;
  const sideBySideThreshold = LEFT_COL_WIDTH + ROW_GAP + minGridWidth;

  const { ref: rowRef, width: rowWidth, isWide: rowWide } = useContainerWidth<HTMLDivElement>(
    sideBySideThreshold
  );
  const { ref: gridColRef, width: gridColWidth } = useContainerWidth<HTMLDivElement>(0);

  const availableWidth = rowWide ? gridColWidth : rowWidth;

  const cellSize =
    availableWidth && availableWidth < naturalGridWidth
      ? Math.max(MIN_CELL_SIZE, (availableWidth - (gridSize - 1) * MIN_GAP) / gridSize)
      : MAX_CELL_SIZE;

  const foundCellKeys = useMemo(() => {
    const set = new Set<string>();
    for (const word of foundWords) {
      const cells = wordPhonemeCells[word];
      if (!cells) continue;
      for (const cell of cells) set.add(`${cell.row},${cell.col}`);
    }
    return set;
  }, [foundWords, wordPhonemeCells]);

  const solveCellMap = useMemo(() => {
    const map = new Map<string, { solve: SolveState; index: number }>();
    for (const s of solves) {
      const cells = wordPhonemeCells[s.word];
      if (!cells) continue;
      cells.forEach((c, i) => map.set(`${c.row},${c.col}`, { solve: s, index: i }));
    }
    return map;
  }, [solves, wordPhonemeCells]);

  // "great" special-cell positions for the finale — computed once per grid size.
  const { specialCells, specialKeySet, greatPhonemes } = useMemo(() => {
    const pos = GREAT_WORD_POSITIONS[gridSize];
    const entry = WORD_LIST.find((w) => w.word === 'great');
    const phonemes = entry ? entry.phonemes : [];
    const cells: Cell[] = pos
      ? Array.from({ length: 4 }, (_, i) => ({ row: pos.row - 1, col: pos.startCol - 1 + i }))
      : [];
    const keySet = new Set(cells.map((c) => `${c.row},${c.col}`));
    return { specialCells: cells, specialKeySet: keySet, greatPhonemes: phonemes };
  }, [gridSize]);

  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPath, setDragPath] = useState<Cell[]>([]);
  const [releaseInfo, setReleaseInfo] = useState<{ cells: Set<string>; token: string } | null>(null);
  const dragStartRef = useRef<Cell | null>(null);
  const dragPathRef = useRef<Cell[]>([]);
  const isDraggingRef = useRef(false);
  const releaseCounter = useRef(0);

  // --- completion flourish + finale sequence ---
  const [completionFlipping, setCompletionFlipping] = useState<Set<string>>(new Set());
  const [finaleCellState, setFinaleCellState] = useState<FinaleCellState[][]>([]);
  const [showEnglishBox, setShowEnglishBox] = useState(false);
  const [englishBoxFlipping, setEnglishBoxFlipping] = useState(false);
  const [englishBoxRevealed, setEnglishBoxRevealed] = useState(false);
  const completionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (completionFlipSignal === 0) return; // 0 is the initial/reset value — don't fire on mount

    completionTimersRef.current.forEach(clearTimeout);
    completionTimersRef.current = [];

    setCompletionFlipping(new Set());
    setFinaleCellState(
      Array.from({ length: gridSize }, () =>
        Array.from({ length: gridSize }, () => ({ stage: 0 as const, flipping: false }))
      )
    );
    setShowEnglishBox(false);
    setEnglishBoxFlipping(false);
    setEnglishBoxRevealed(false);

    const t = (fn: () => void, delay: number) => {
      completionTimersRef.current.push(setTimeout(fn, delay));
    };

    const flourishDuration =
      (gridSize - 1) * COMPLETION_ROW_STAGGER_MS + (gridSize - 1) * COMPLETION_CELL_STAGGER_MS + COMPLETION_FLIP_MS;

    // Stage 0: existing "colors preserved" flourish.
    for (let row = 0; row < gridSize; row++) {
      const rowStart = row * COMPLETION_ROW_STAGGER_MS;
      for (let col = 0; col < gridSize; col++) {
        const key = `${row},${col}`;
        const start = rowStart + col * COMPLETION_CELL_STAGGER_MS;
        t(() => setCompletionFlipping((prev) => new Set(prev).add(key)), start);
        t(
          () =>
            setCompletionFlipping((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            }),
          start + COMPLETION_FLIP_MS
        );
      }
    }

    let time = flourishDuration + FINALE_WAIT_MS;

    // Stage 1: green phase — every cell gets a green border/empty white,
    // except the 4 special cells, which fill green with "great"'s letters.
    for (let row = 0; row < gridSize; row++) {
      const rowStart = time + row * COMPLETION_ROW_STAGGER_MS;
      for (let col = 0; col < gridSize; col++) {
        const r = row;
        const c = col;
        const start = rowStart + col * COMPLETION_CELL_STAGGER_MS;
        t(
          () =>
            setFinaleCellState((prev) => {
              const next = prev.map((rr) => [...rr]);
              if (next[r]?.[c]) next[r][c] = { ...next[r][c], flipping: true };
              return next;
            }),
          start
        );
        t(
          () =>
            setFinaleCellState((prev) => {
              const next = prev.map((rr) => [...rr]);
              if (next[r]?.[c]) next[r][c] = { ...next[r][c], stage: 1 };
              return next;
            }),
          start + COMPLETION_FLIP_MS / 2
        );
        t(
          () =>
            setFinaleCellState((prev) => {
              const next = prev.map((rr) => [...rr]);
              if (next[r]?.[c]) next[r][c] = { ...next[r][c], flipping: false };
              return next;
            }),
          start + COMPLETION_FLIP_MS
        );
      }
    }

    time += flourishDuration + FINALE_WAIT_MS;

    // Stage 2: blue phase — every cell gets a blue border/empty white,
    // except the 4 special cells, which disappear entirely.
    for (let row = 0; row < gridSize; row++) {
      const rowStart = time + row * COMPLETION_ROW_STAGGER_MS;
      for (let col = 0; col < gridSize; col++) {
        const r = row;
        const c = col;
        const start = rowStart + col * COMPLETION_CELL_STAGGER_MS;
        t(
          () =>
            setFinaleCellState((prev) => {
              const next = prev.map((rr) => [...rr]);
              if (next[r]?.[c]) next[r][c] = { ...next[r][c], flipping: true };
              return next;
            }),
          start
        );
        t(
          () =>
            setFinaleCellState((prev) => {
              const next = prev.map((rr) => [...rr]);
              if (next[r]?.[c]) next[r][c] = { ...next[r][c], stage: 2 };
              return next;
            }),
          start + COMPLETION_FLIP_MS / 2
        );
        t(
          () =>
            setFinaleCellState((prev) => {
              const next = prev.map((rr) => [...rr]);
              if (next[r]?.[c]) next[r][c] = { ...next[r][c], flipping: false };
              return next;
            }),
          start + COMPLETION_FLIP_MS
        );
      }
    }

    const stage2End = time + flourishDuration;

    // Stage 3: once the grid has FULLY finished flipping (no extra wait),
    // flip in the "Great!" box where the 4 special cells used to be.
    t(() => setShowEnglishBox(true), stage2End);
    t(() => setEnglishBoxFlipping(true), stage2End);
    t(() => setEnglishBoxRevealed(true), stage2End + COMPLETION_FLIP_MS / 2);
    t(() => setEnglishBoxFlipping(false), stage2End + COMPLETION_FLIP_MS);

    return () => completionTimersRef.current.forEach(clearTimeout);
  }, [completionFlipSignal, gridSize]);

  useEffect(() => {
    dragPathRef.current = dragPath;
  }, [dragPath]);
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    function onMouseUp() {
      if (!isDraggingRef.current) return;
      setIsDragging(false);
      const cells = dragPathRef.current;
      setDragPath([]);
      dragStartRef.current = null;

      const matchedWord = matchDragToWord(cells, wordPhonemeCells, foundWords);
      if (matchedWord) {
        onWordMatched(matchedWord);
        return;
      }

      const cellsSet = new Set(cells.map((c) => `${c.row},${c.col}`));
      releaseCounter.current += 1;
      setReleaseInfo({ cells: cellsSet, token: `sel-${releaseCounter.current}` });
    }
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [wordPhonemeCells, foundWords, onWordMatched]);

  useEffect(() => {
    setIsDragging(false);
    setDragPath([]);
    setReleaseInfo(null);
    setHoverKey(null);
    dragStartRef.current = null;
  }, [placedGrid]);

  const handleCellMouseDown = (row: number, col: number) => {
    if (!placedGrid || !isPlayable) return;
    setIsDragging(true);
    dragStartRef.current = { row, col };
    setDragPath([{ row, col }]);
    setReleaseInfo(null);
    setHoverKey(null);
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!placedGrid || !isPlayable) return;
    if (isDragging && dragStartRef.current) {
      const path = computeStraightPath(dragStartRef.current, { row, col });
      if (path) setDragPath(path);
    } else {
      setHoverKey(`${row},${col}`);
    }
  };

  const wordList = (
    <div className="w-44 flex-shrink-0">
      <WordSearchWordListPreview
        words={selectedWords}
        count={getWordCountForGridSize(gridSize)}
        revealWords={revealWords}
        placedWordSet={placedWordSet}
        hint={hint}
        onHintClick={onHintClick}
        foundWords={foundWords}
        solves={solves}
        englishRevealed={englishRevealed}
        englishFlippingWords={englishFlippingWords}
        hintRevealed={hintRevealed}
        hintFlippingWords={hintFlippingWords}
        letterStates={letterStates}
      />
    </div>
  );

  const grid = (
    <div>
      <div
        className="flex justify-center"
        onMouseLeave={() => {
          if (!isDragging) setHoverKey(null);
        }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            gap: MIN_GAP,
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const key = `${row},${col}`;

            const gridIsValidSize =
              placedGrid && placedGrid.length === gridSize && placedGrid[row]?.length === gridSize;

            if (!gridIsValidSize) {
              return (
                <div key={i} style={{ perspective: '400px' }}>
                  <div
                    className="flex items-center justify-center rounded-md border-2 border-foreground/20 bg-background"
                    style={{ width: cellSize, height: cellSize }}
                  />
                </div>
              );
            }

            const specialIndex = specialCells.findIndex((c) => c.row === row && c.col === col);
            const isSpecialCell = specialIndex !== -1;

            // Once the "Great!" box is showing, the first special cell
            // becomes a single spanning item; the other 3 aren't rendered
            // at all — CSS Grid packs everything else around it correctly
            // since the spanned item consumes the same 4 tracks they did.
            if (showEnglishBox && isSpecialCell) {
              if (specialIndex === 0) {
                return (
                  <div key={i} style={{ gridColumn: 'span 4', perspective: '400px' }}>
                    <div
                      className={`flex items-center justify-center rounded-md font-semibold ${
                        englishBoxRevealed
                          ? 'bg-word-reveal text-word-reveal-foreground'
                          : 'border-2 border-transparent bg-transparent'
                      } ${englishBoxFlipping ? 'animate-tile-flip' : ''}`}
                      style={{ height: cellSize, fontSize: Math.max(10, cellSize * 0.4) }}
                    >
                      {englishBoxRevealed ? 'Great!' : ''}
                    </div>
                  </div>
                );
              }
              return null;
            }

            const cellFinale = finaleCellState[row]?.[col];
            const finaleStage = cellFinale?.stage ?? 0;
            const finaleFlipping = cellFinale?.flipping ?? false;
            const specialSymbol = isSpecialCell ? greatPhonemes[specialIndex] : undefined;

            const cellFlipInfo = gridCellFlip[row]?.[col];
            const introRevealed = Boolean(cellFlipInfo?.revealed);
            const introFlipping = Boolean(cellFlipInfo?.flipping);

            const symbol = placedGrid![row][col];
            const isWordCell = wordCellKeys.has(key);
            const isFoundCell = foundCellKeys.has(key);
            const hintTriggerId = hintCell && hintCell.row === row && hintCell.col === col ? hintCell.token : null;

            const solveEntry = solveCellMap.get(key);
            const solveInfo: SolveCellInfo = solveEntry
              ? {
                  flipping: solveEntry.solve.letterFlipping[solveEntry.index],
                  revealed: solveEntry.solve.letterRevealed[solveEntry.index],
                }
              : null;

            const liveSelected = isDragging
              ? dragPath.some((c) => c.row === row && c.col === col)
              : hoverKey === key;
            const releaseToken = releaseInfo && releaseInfo.cells.has(key) ? releaseInfo.token : null;
            const isCompletionFlipping = completionFlipping.has(key);

            return (
              <GridCellView
                key={i}
                symbol={symbol}
                isWordCell={isWordCell}
                revealWords={revealWords}
                hintTriggerId={hintTriggerId}
                liveSelected={liveSelected}
                releaseToken={releaseToken}
                isFoundCell={isFoundCell}
                solveInfo={solveInfo}
                cellSize={cellSize}
                introRevealed={introRevealed}
                introFlipping={introFlipping}
                completionFlipping={isCompletionFlipping}
                finaleStage={finaleStage}
                finaleFlipping={finaleFlipping}
                isSpecialCell={isSpecialCell}
                specialSymbol={specialSymbol}
                onMouseDown={() => handleCellMouseDown(row, col)}
                onMouseEnter={() => handleCellMouseEnter(row, col)}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-8">
        <div className="flex items-center gap-3 rounded-md border border-foreground/10 px-3 py-2">
          <span className="whitespace-nowrap text-sm text-foreground">Dark Theme</span>
          <ToggleSwitch checked={isDarkTheme} onChange={() => {}} disabled />
        </div>
        <div className="flex items-center gap-3 rounded-md border border-foreground/10 px-3 py-2">
          <span className="whitespace-nowrap text-sm text-foreground">High Contrast</span>
          <ToggleSwitch checked={isHighContrast} onChange={() => {}} disabled />
        </div>
      </div>
    </div>
  );

  return (
    <div ref={rowRef} className={`flex gap-6 ${rowWide ? 'flex-row items-start' : 'flex-col items-stretch'}`}>
      {wordList}
      <div
        ref={gridColRef}
        className={`min-w-0 flex-1 ${rowWide ? 'border-l border-foreground/10 pl-6' : 'border-t border-foreground/10 pt-6'}`}
      >
        {grid}
      </div>
    </div>
  );
}
