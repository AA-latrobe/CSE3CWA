'use client';
import { useContainerWidth } from '@/lib/useContainerWidth';
import ToggleSwitch from '@/components/shared/ToggleSwitch';

const GRID_SIZE = 15;
const MAX_CELL_SIZE = 40;
const MIN_CELL_SIZE = 24; // floor before the grid drops below the toggles column instead of shrinking further
const MIN_GAP = 4;
const LEFT_COL_WIDTH = 176; // matches w-44

const NATURAL_GRID_WIDTH = GRID_SIZE * MAX_CELL_SIZE + (GRID_SIZE - 1) * MIN_GAP;
const MIN_GRID_WIDTH = GRID_SIZE * MIN_CELL_SIZE + (GRID_SIZE - 1) * MIN_GAP;
const ROW_GAP = 24; // gap-6

// Below this, the grid can no longer fit beside the toggles column without
// shrinking past MIN_CELL_SIZE — so the whole row switches to stacked.
const SIDE_BY_SIDE_THRESHOLD = LEFT_COL_WIDTH + ROW_GAP + MIN_GRID_WIDTH;

type Props = {
  isDarkTheme: boolean;
  isHighContrast: boolean;
};

export default function WordSearchGrid({ isDarkTheme, isHighContrast }: Props) {
  const { ref: rowRef, width: rowWidth, isWide: rowWide } = useContainerWidth<HTMLDivElement>(
    SIDE_BY_SIDE_THRESHOLD
  );
  const { ref: gridColRef, width: gridColWidth } = useContainerWidth<HTMLDivElement>(0);

  // Whichever column the grid currently lives in reports its own width —
  // side-by-side, that's the space right of the divider; stacked, it's
  // the full row width instead.
  const availableWidth = rowWide ? gridColWidth : rowWidth;

  const cellSize =
    availableWidth && availableWidth < NATURAL_GRID_WIDTH
      ? Math.max(MIN_CELL_SIZE, (availableWidth - (GRID_SIZE - 1) * MIN_GAP) / GRID_SIZE)
      : MAX_CELL_SIZE;

  const toggles = (
    <div className="flex w-44 flex-shrink-0 flex-col gap-3">
      <div className="flex w-full items-center justify-between gap-3 rounded-md border border-foreground/10 px-3 py-2">
        <span className="whitespace-nowrap text-sm text-foreground">Dark Theme</span>
        <div className="flex-shrink-0">
          <ToggleSwitch checked={isDarkTheme} onChange={() => {}} disabled />
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-3 rounded-md border border-foreground/10 px-3 py-2">
        <span className="whitespace-nowrap text-sm text-foreground">High Contrast</span>
        <div className="flex-shrink-0">
          <ToggleSwitch checked={isHighContrast} onChange={() => {}} disabled />
        </div>
      </div>
    </div>
  );

  const grid = (
    <div className="flex justify-center">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
          gap: MIN_GAP,
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-center rounded-md border-2 border-foreground/20"
            style={{ width: cellSize, height: cellSize }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div ref={rowRef} className={`flex gap-6 ${rowWide ? 'flex-row items-start' : 'flex-col items-stretch'}`}>
      {toggles}
      <div
        ref={gridColRef}
        className={`min-w-0 flex-1 ${rowWide ? 'border-l border-foreground/10 pl-6' : 'border-t border-foreground/10 pt-6'}`}
      >
        {grid}
      </div>
    </div>
  );
}
