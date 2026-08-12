// components/shared/PhonemeKeypad.tsx
'use client';
import { useContainerWidth } from '@/lib/useContainerWidth';

type Props = {
  topGrid: string[][];
  bottomGrid: string[][];
  onSelect: (symbol: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
};

const SIDE_BY_SIDE_THRESHOLD = 420;

export default function PhonemeKeypad({ topGrid, bottomGrid, onSelect, onBackspace, disabled }: Props) {
  const { ref, isWide } = useContainerWidth<HTMLDivElement>(SIDE_BY_SIDE_THRESHOLD);

  const renderGrid = (grid: string[][], keyPrefix: string) => (
    <div className="grid grid-cols-4 gap-1">
      {grid.flatMap((row, ri) =>
        row.map((symbol, ci) =>
          symbol ? (
            <button
              key={`${keyPrefix}-${ri}-${ci}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(symbol)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-foreground/20 bg-background text-sm font-medium text-foreground hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {symbol}
            </button>
          ) : (
            <div key={`${keyPrefix}-${ri}-${ci}`} className="h-10 w-10" />
          )
        )
      )}
    </div>
  );

  return (
    // Measurement target — always full width of whatever the parent gives it,
    // so the ResizeObserver reads real available space, never the size of its
    // own (possibly centered/shrunk) content.
    <div ref={ref} className="w-full">
      {/* Visual content — centers itself WITHIN the full-width box above,
          independent of what's being measured. */}
      <div
        className={`flex gap-y-4 gap-x-8 ${
          isWide ? 'flex-row items-start justify-center' : 'flex-col items-center'
        }`}
      >
        {renderGrid(topGrid, 'top')}
        <div
          className={`flex flex-col items-center gap-3 border-foreground/10 ${
            isWide ? 'border-l pl-8' : 'border-t pt-4'
          }`}
        >
          {renderGrid(bottomGrid, 'bottom')}
          <button
            type="button"
            disabled={disabled}
            onClick={onBackspace}
            className="w-full rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ⌫ Backspace
          </button>
        </div>
      </div>
    </div>
  );
}
