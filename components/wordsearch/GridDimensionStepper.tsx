'use client';
import FlipTile from '@/components/shared/FlipTile';

type Props = {
  value: number; // single dimension — grid is always square, so this drives both tiles
  min: number;
  max: number;
  onChange: (value: number) => void;
};

export default function GridDimensionStepper({ value, min, max, onChange }: Props) {
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
            onClick={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
            className="flex h-5 w-6 items-center justify-center rounded-t border border-foreground/20 text-xs disabled:opacity-30"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
            className="flex h-5 w-6 items-center justify-center rounded-b border border-t-0 border-foreground/20 text-xs disabled:opacity-30"
          >
            ▼
          </button>
        </div>
      </div>
      <p className="mt-1 text-center text-xs text-foreground/50">
        (min {min}x{min}, max {max}x{max})
      </p>
    </div>
  );
}
