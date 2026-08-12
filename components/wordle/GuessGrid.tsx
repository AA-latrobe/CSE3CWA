'use client';
import { useContainerWidth } from '@/lib/useContainerWidth';
import GuessRow from './GuessRow';
import ToggleSwitch from '@/components/shared/ToggleSwitch';
import { CellColor } from '@/lib/wordleLogic';

interface SubmittedGuess {
  symbols: string[];
  colors: CellColor[];
}

type Props = {
  numGuesses: number;
  wordSize: number;
  currentGuess: string[];
  submittedGuesses: SubmittedGuess[];
  onResetGame: () => void;
  hardMode: boolean;
  onHardModeChange: (value: boolean) => void;
  hardModeLocked: boolean;
  hardModeError?: string | null;
};

const SIDE_BY_SIDE_THRESHOLD = 560;

export default function GuessGrid({
  numGuesses,
  wordSize,
  currentGuess,
  submittedGuesses,
  onResetGame,
  hardMode,
  onHardModeChange,
  hardModeLocked,
  hardModeError,
}: Props) {
  const { ref, isWide } = useContainerWidth<HTMLDivElement>(SIDE_BY_SIDE_THRESHOLD);

  const renderRow = (rowIndex: number) => {
    const submitted = submittedGuesses[rowIndex];
    const isCurrentRow = rowIndex === submittedGuesses.length;
    const symbols = submitted ? submitted.symbols : isCurrentRow ? currentGuess : [];
    const colors = submitted ? submitted.colors : null;
    return <GuessRow key={rowIndex} wordSize={wordSize} symbols={symbols} colors={colors} />;
  };

  return (
    <div ref={ref} className="w-full">
      <div className={`flex min-w-0 gap-y-6 gap-x-8 ${isWide ? 'flex-row items-start' : 'flex-col items-start'}`}>
        <div className="flex w-44 flex-shrink-0 flex-col items-start gap-3">
          <button
            type="button"
            onClick={onResetGame}
            className="w-full rounded-md border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5"
          >
            Reset Game
          </button>

          <div className="flex w-full items-center justify-between gap-3 rounded-md border border-foreground/10 px-3 py-2">
            <span className="whitespace-nowrap text-sm text-foreground">Hard Mode</span>
            <div className="flex-shrink-0">
              <ToggleSwitch checked={hardMode} onChange={onHardModeChange} disabled={hardModeLocked} />
            </div>
          </div>
        </div>

        {/* Guess-rows column — error message now lives inside here, so it's
            always aligned to this column's own width, not the whole panel. */}
        <div className={`border-foreground/10 ${isWide ? 'border-l pl-8' : 'border-t pt-4'}`}>
          <div className="space-y-1">
            {Array.from({ length: numGuesses }, (_, i) => renderRow(i))}
          </div>
          {hardModeError && <p className="mt-3 text-sm text-amber-500">{hardModeError}</p>}
        </div>
      </div>
    </div>
  );
}
