'use client';

type Props = {
  grid: string[][];
  onSelect: (symbol: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
};

export default function PhonemeKeypad({ grid, onSelect, onBackspace, disabled }: Props) {
  return (
    <div className="inline-block">
      <div className="grid grid-cols-4 gap-1">
        {grid.flatMap((row, ri) =>
          row.map((symbol, ci) =>
            symbol ? (
              <button
                key={`${ri}-${ci}`}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(symbol)}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-foreground/20 bg-background text-sm font-medium text-foreground hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {symbol}
              </button>
            ) : (
              // empty cell keeps grid alignment intact
              <div key={`${ri}-${ci}`} className="h-10 w-10" />
            )
          )
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onBackspace}
        className="mt-3 w-full rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ⌫ Backspace
      </button>
    </div>
  );
}
