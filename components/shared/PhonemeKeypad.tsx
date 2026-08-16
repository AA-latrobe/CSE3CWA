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
  align?: 'start' | 'center';
  topLabel?: string;
  bottomLabel?: string;
  bottomGapBeforeRowIndex?: number;
  bottomGapLabel?: string;
};

const SIDE_BY_SIDE_THRESHOLD = 340;

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
  align = 'start',
  topLabel,
  bottomLabel,
  bottomGapBeforeRowIndex,
  bottomGapLabel,
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
              className={`flex h-10 w-10 items-center justify-center rounded-md text-base font-medium hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 ${keyColorClass(
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

  const renderBottomGrid = () => {
    if (bottomGapBeforeRowIndex === undefined) {
      return renderGrid(bottomGrid, 'bottom');
    }

    const firstPart = bottomGrid.slice(0, bottomGapBeforeRowIndex);
    const secondPart = bottomGrid.slice(bottomGapBeforeRowIndex);

    return (
      <div className="flex flex-col gap-1">
        {renderGrid(firstPart, 'bottom-a')}
        <div className="flex h-10 items-end justify-start">
          {bottomGapLabel && (
            <p className="text-sm font-medium text-foreground">{bottomGapLabel}</p>
          )}
        </div>
        {renderGrid(secondPart, 'bottom-b')}
      </div>
    );
  };

  return (
    <div ref={ref} className="w-full">
      <div
        className={`flex gap-y-4 gap-x-4 ${
          isWide
            ? `flex-row items-start ${align === 'center' ? 'justify-center' : 'justify-start'}`
            : 'flex-col items-center'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            {topLabel && <p className="self-start text-sm font-medium text-foreground">{topLabel}</p>}
            {renderGrid(topGrid, 'top')}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            {bottomLabel && <p className="self-start text-sm font-medium text-foreground">{bottomLabel}</p>}
            {renderBottomGrid()}
          </div>
          <div className="grid w-full grid-cols-4 gap-1">
            {showEnter && (
              <button
                type="button"
                disabled={disabled || !canSubmit}
                onClick={onEnter}
                className="col-span-2 rounded-md bg-match px-3 py-2 text-sm font-medium text-match-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Enter
              </button>
            )}
            <button
              type="button"
              disabled={disabled}
              onClick={onBackspace}
              className={`${showEnter ? 'col-span-2' : 'col-span-2 col-start-3'} rounded-md bg-partial px-3 py-2 text-sm font-medium text-partial-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              ⌫
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
