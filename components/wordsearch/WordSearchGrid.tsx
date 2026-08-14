'use client';
import { useContainerWidth } from '@/lib/useContainerWidth';
import ToggleSwitch from '@/components/shared/ToggleSwitch';
import WordSearchWordListPreview from './WordSearchWordListPreview';
import { useHintFlip } from '../../lib/useHintFlip';
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

function GridCellView({
  symbol,
  isWordCell,
  revealWords,
  triggerId,
  cellSize,
}: {
  symbol: string | null;
  isWordCell: boolean;
  revealWords: boolean;
  triggerId: string | null;
  cellSize: number;
}) {
  const { flipping, revealed } = useHintFlip(triggerId);

  const colorClass = revealed
    ? 'bg-partial text-partial-foreground'
    : isWordCell && revealWords
    ? 'bg-key-used text-key-used-foreground'
    : 'bg-key text-key-foreground';

  return (
    <div style={{ perspective: '400px' }}>
      <div
        title={symbol ? getPhonemeHoverText(symbol) : undefined}
        className={`flex items-center justify-center rounded-md ${colorClass} ${
          flipping ? 'animate-tile-flip' : ''
        }`}
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
      <div className="flex justify-center">
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

            const symbol = placedGrid![row][col];
            const isWordCell = wordCellKeys.has(`${row},${col}`);
            const triggerId =
              hintCell && hintCell.row === row && hintCell.col === col ? hintCell.token : null;

            return (
              <GridCellView
                key={i}
                symbol={symbol}
                isWordCell={isWordCell}
                revealWords={revealWords}
                triggerId={triggerId}
                cellSize={cellSize}
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
