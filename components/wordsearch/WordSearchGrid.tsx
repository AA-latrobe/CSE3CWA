'use client';
import { useContainerWidth } from '@/lib/useContainerWidth';
import { useHintFlip } from '@/lib/useHintFlip';
import { useSelectionReleaseFlip } from '@/lib/useSelectionReleaseFlip';
import { useEffect, useRef, useState } from 'react';
import ToggleSwitch from '@/components/shared/ToggleSwitch';
import WordSearchWordListPreview from './WordSearchWordListPreview';
import { PhonemeWordEntry, getPhonemeHoverText } from '@/lib/phonemeData';
import { getWordCountForGridSize } from '@/lib/wordSearchData';

const MAX_CELL_SIZE = 40;
const MIN_CELL_SIZE = 24;
const MIN_GAP = 4;
const LEFT_COL_WIDTH = 176;
const ROW_GAP = 24;

type HintState = { word: string; phonemeIndex: number; nonce: number } | null;

type Props = {
  gridSize: number;
  selectedWords: PhonemeWordEntry[];
  placedGrid: (string | null)[][] | null;
  wordCellKeys: Set<string>;
  hintCell: { row: number; col: number; token: string } | null;
  revealWords: boolean;
  placedWordSet: Set<string>;
  hint: HintState;
  onHintClick: (entry: PhonemeWordEntry) => void;
  isDarkTheme: boolean;
  isHighContrast: boolean;
};

function computeStraightPath(
  start: { row: number; col: number },
  end: { row: number; col: number }
): { row: number; col: number }[] | null {
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
  cellSize,
  onMouseDown,
  onMouseEnter,
}: {
  symbol: string | null;
  isWordCell: boolean;
  revealWords: boolean;
  hintTriggerId: string | null;
  liveSelected: boolean;
  releaseToken: string | null;
  cellSize: number;
  onMouseDown: () => void;
  onMouseEnter: () => void;
}) {
  const { flipping: hintFlipping, revealed: hintRevealed } = useHintFlip(hintTriggerId);
  const { flipping: selFlipping, highlighted: selHighlighted } = useSelectionReleaseFlip(releaseToken);

  const isFlipping = hintFlipping || selFlipping;
  const isYellow = liveSelected || selHighlighted || hintRevealed;

  const colorClass = isYellow
    ? 'bg-partial text-partial-foreground'
    : isWordCell && revealWords
    ? 'bg-key-used text-key-used-foreground'
    : 'bg-key text-key-foreground';

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
  hintCell,
  revealWords,
  placedWordSet,
  hint,
  onHintClick,
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

  // --- play-selection state ---
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPath, setDragPath] = useState<{ row: number; col: number }[]>([]);
  const [releaseInfo, setReleaseInfo] = useState<{ cells: Set<string>; token: string } | null>(null);
  const dragStartRef = useRef<{ row: number; col: number } | null>(null);
  const dragPathRef = useRef<{ row: number; col: number }[]>([]);
  const isDraggingRef = useRef(false);
  const releaseCounter = useRef(0);

  useEffect(() => {
    dragPathRef.current = dragPath;
  }, [dragPath]);
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    setIsDragging(false);
    setDragPath([]);
    setReleaseInfo(null);
    setHoverKey(null);
    dragStartRef.current = null;
  }, [placedGrid]);

  // Global listener: catches mouse release even if it happens outside the
  // grid (or outside the browser window entirely, in most browsers).
  useEffect(() => {
    function onMouseUp() {
      if (!isDraggingRef.current) return;
      setIsDragging(false);
      const cells = dragPathRef.current;
      const cellsSet = new Set(cells.map((c) => `${c.row},${c.col}`));
      releaseCounter.current += 1;
      setReleaseInfo({ cells: cellsSet, token: `sel-${releaseCounter.current}` });
      setDragPath([]);
      dragStartRef.current = null;
    }
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  const handleCellMouseDown = (row: number, col: number) => {
    if (!placedGrid) return;
    setIsDragging(true);
    dragStartRef.current = { row, col };
    setDragPath([{ row, col }]);
    setReleaseInfo(null); // cancel any pending release-hold immediately, no lingering flip
    setHoverKey(null);
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!placedGrid) return;
    if (isDragging && dragStartRef.current) {
      const path = computeStraightPath(dragStartRef.current, { row, col });
      if (path) setDragPath(path); // invalid (non-straight) moves simply keep the last valid path
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

            const gridIsValidSize =
              placedGrid && placedGrid.length === gridSize && placedGrid[row]?.length === gridSize;

            if (!gridIsValidSize) {
              return (
                <div
                  key={i}
                  className="flex items-center justify-center rounded-md border-2 border-foreground/20"
                  style={{ width: cellSize, height: cellSize, fontSize: Math.max(10, cellSize * 0.4) }}
                />
              );
            }

            const key = `${row},${col}`;
            const symbol = placedGrid![row][col];
            const isWordCell = wordCellKeys.has(key);
            const hintTriggerId = hintCell && hintCell.row === row && hintCell.col === col ? hintCell.token : null;

            const liveSelected = isDragging
              ? dragPath.some((c) => c.row === row && c.col === col)
              : hoverKey === key;
            const releaseToken = releaseInfo && releaseInfo.cells.has(key) ? releaseInfo.token : null;

            return (
              <GridCellView
                key={i}
                symbol={symbol}
                isWordCell={isWordCell}
                revealWords={revealWords}
                hintTriggerId={hintTriggerId}
                liveSelected={liveSelected}
                releaseToken={releaseToken}
                cellSize={cellSize}
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
