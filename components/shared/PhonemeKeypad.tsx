'use client';
import { useContainerWidth } from '@/lib/useContainerWidth';

type Props = {
  topGrid: string[][];
  bottomGrid: string[][];
  onSelect: (symbol: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
  usedSymbols?: Set<string>; // symbols present anywhere in the current Selected Words
};

const SIDE_BY_SIDE_THRESHOLD = 420;

export default function PhonemeKeypad({
  topGrid,
  bottomGrid,
  onSelect,
  onBackspace,
  disabled,
  usedSymbols,
}: Props) {
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
              className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 ${
                usedSymbols?.has(symbol)
                  ? 'bg-key-used text-key-used-foreground'
                  : 'bg-key text-key-foreground'
              }`}
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
    <div ref={ref} className="w-full">
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
            className="w-full rounded-md bg-key px-3 py-2 text-sm font-medium text-key-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ⌫ Backspace
          </button>
        </div>
      </div>
    </div>
  );
}
