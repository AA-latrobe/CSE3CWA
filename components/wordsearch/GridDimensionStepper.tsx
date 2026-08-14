'use client';
import FlipTile from '@/components/shared/FlipTile';

const GRID_SIZE_OPTIONS = [8, 10, 12, 15];

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export default function GridDimensionStepper({ value, onChange }: Props) {
  const currentIndex = GRID_SIZE_OPTIONS.indexOf(value);
  // Falls back to the closest option if the current value somehow isn't
  // one of the four allowed sizes (e.g. a stale cookie from before this
  // change) — avoids the stepper getting stuck with no valid index.
  const safeIndex =
    currentIndex === -1
      ? GRID_SIZE_OPTIONS.reduce((closest, size, i) =>
          Math.abs(size - value) < Math.abs(GRID_SIZE_OPTIONS[closest] - value) ? i : closest
        , 0)
      : currentIndex;

  const canIncrease = safeIndex < GRID_SIZE_OPTIONS.length - 1;
  const canDecrease = safeIndex > 0;

  const handleIncrease = () => {
    if (canIncrease) onChange(GRID_SIZE_OPTIONS[safeIndex + 1]);
  };
  const handleDecrease = () => {
    if (canDecrease) onChange(GRID_SIZE_OPTIONS[safeIndex - 1]);
  };

  return (
    <div>
      <label className="mb-2 block text-center text-sm font-medium text-foreground">
        Puzzle Grid Dimensions
      </label>
      <div className="flex items-center justify-center gap-3">
        <FlipTile value={value} className="h-12 w-14 bg-match px-2 text-lg text-match-foreground" />
        <span className="text-xl font-semibold text-foreground/70">×</span>
        <FlipTile value={value} className="h-12 w-14 bg-match px-2 text-lg text-match-foreground" />
        <div className="flex flex-col">
          <button
            type="button"
            onClick={handleIncrease}
            disabled={!canIncrease}
            className="flex h-5 w-6 items-center justify-center rounded-t border border-foreground/20 text-xs disabled:opacity-30"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={handleDecrease}
            disabled={!canDecrease}
            className="flex h-5 w-6 items-center justify-center rounded-b border border-t-0 border-foreground/20 text-xs disabled:opacity-30"
          >
            ▼
          </button>
        </div>
      </div>
      <p className="mt-1 text-center text-xs text-foreground/50">
        (min {GRID_SIZE_OPTIONS[0]}x{GRID_SIZE_OPTIONS[0]}, max {GRID_SIZE_OPTIONS[GRID_SIZE_OPTIONS.length - 1]}x
        {GRID_SIZE_OPTIONS[GRID_SIZE_OPTIONS.length - 1]})
      </p>
    </div>
  );
}
