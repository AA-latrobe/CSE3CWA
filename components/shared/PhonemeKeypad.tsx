'use client';
import { useContainerWidth } from '@/lib/useContainerWidth';
import { CellColor } from '@/lib/wordleLogic';
import { getPhonemeHoverText } from '@/lib/phonemeData';

type Props = {
  topGrid: string[][];
  bottomGrid: string[][];
  onSelect: (symbol: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
  usedSymbols?: Set<string>;
  letterColors?: Record<string, CellColor>;
  showEnter?: boolean;
  canSubmit?: boolean;
  onEnter?: () => void;
};

const SIDE_BY_SIDE_THRESHOLD = 420;

function keyColorClass(symbol: string, usedSymbols?: Set<string>, letterColors?: Record<string, CellColor>) {
  const color = letterColors?.[symbol];
  if (color === 'green') return 'bg-match text-match-foreground';
  if (color === 'yellow') return 'bg-partial text-partial-foreground';
  if (color === 'grey') return 'bg-key-used text-key-used-foreground';
  if (usedSymbols?.has(symbol)) return 'bg-key-used text-key-used-foreground';
  return 'bg-key text-key-foreground';
}

export default function PhonemeKeypad({
  topGrid,
  bottomGrid,
  onSelect,
  onBackspace,
  disabled,
  usedSymbols,
  letterColors,
  showEnter,
  canSubmit,
  onEnter,
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
              title={getPhonemeHoverText(symbol)}
              onClick={() => onSelect(symbol)}
              className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 ${keyColorClass(
                symbol,
                usedSymbols,
                letterColors
              )}`}
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
        <div className="flex flex-col items-center gap-3">
          {renderGrid(topGrid, 'top')}
          {showEnter && (
            <button
              type="button"
              disabled={disabled || !canSubmit}
              onClick={onEnter}
              className="w-full rounded-md bg-match px-3 py-2 text-sm font-medium text-match-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ⏎ Enter
            </button>
          )}
        </div>

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
            className="w-full rounded-md bg-partial px-3 py-2 text-sm font-medium text-partial-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ⌫ Backspace
          </button>
        </div>
      </div>
    </div>
  );
}
