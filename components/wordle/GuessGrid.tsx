'use client';
import { useContainerWidth } from '@/lib/useContainerWidth';
import GuessRow from './GuessRow';
import SolutionReveal from './SolutionReveal';
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
  resetGameDisabled: boolean;
  hardMode: boolean;
  onHardModeChange: (value: boolean) => void;
  hardModeLocked: boolean;
  hardModeError?: string | null;
  showStats: boolean;
  totalWords: number;
  currentWordNumber: number;
  solvedCount: number;
  failedCount: number;
  isGameOver: boolean;
  isLastWord: boolean;
  onPlayNextWord: () => void;
  // Solution reveal
  solutionPhonemes: string[];
  solutionEnglishWord: string;
  solutionMessage: string;
  solutionRevealed: boolean;
};

const SIDE_BY_SIDE_THRESHOLD = 560;

export default function GuessGrid({
  numGuesses,
  wordSize,
  currentGuess,
  submittedGuesses,
  onResetGame,
  resetGameDisabled,
  hardMode,
  onHardModeChange,
  hardModeLocked,
  hardModeError,
  showStats,
  totalWords,
  currentWordNumber,
  solvedCount,
  failedCount,
  isGameOver,
  isLastWord,
  onPlayNextWord,
  solutionPhonemes,
  solutionEnglishWord,
  solutionMessage,
  solutionRevealed,
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
          <SolutionReveal
            phonemes={solutionPhonemes}
            englishWord={solutionEnglishWord}
            message={solutionMessage}
            reveal={solutionRevealed}
          />

          <button
            type="button"
            onClick={onResetGame}
            disabled={resetGameDisabled}
            className="w-full rounded-md bg-key px-3 py-1.5 text-sm font-medium text-key-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset Game
          </button>

          <div className="flex w-full items-center justify-between gap-3 rounded-md border border-foreground/10 px-3 py-2">
            <span className="whitespace-nowrap text-sm text-foreground">Hard Mode</span>
            <div className="flex-shrink-0">
              <ToggleSwitch checked={hardMode} onChange={onHardModeChange} disabled={hardModeLocked} />
            </div>
          </div>

          {showStats && (
            <>
              <div className="w-full space-y-1 rounded-md border border-foreground/10 px-3 py-2 text-sm text-foreground">
                <p>
                  Word: {currentWordNumber}/{totalWords}
                </p>
                <p>Solved: {solvedCount}</p>
                <p>Failed: {failedCount}</p>
              </div>

              <button
                type="button"
                onClick={onPlayNextWord}
                disabled={!isGameOver}
                className="w-full rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-match-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLastWord ? 'Start Over!' : 'Play Next Word'}
              </button>
            </>
          )}
        </div>

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
