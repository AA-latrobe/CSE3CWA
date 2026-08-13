'use client';
import GuessRow from './GuessRow';
import SolutionReveal from './SolutionReveal';
import ToggleSwitch from '@/components/shared/ToggleSwitch';
import { MAX_PHONEME_SLOTS } from '@/lib/phonemeData';
import { CellColor } from '@/lib/wordleLogic';

interface SubmittedGuess {
  symbols: string[];
  colors: CellColor[];
}

type Props = {
  isWide: boolean;
  numGuesses: number;
  wordSize: number;
  currentGuess: string[];
  submittedGuesses: SubmittedGuess[];
  hardMode: boolean;
  onHardModeChange: (value: boolean) => void;
  hardModeLocked: boolean;
  hardModeError?: string | null;
  isDarkTheme: boolean;
  isHighContrast: boolean;
  showStats: boolean;
  totalWords: number;
  currentWordNumber: number;
  solvedCount: number;
  failedCount: number;
  isGameOver: boolean;
  isLastWord: boolean;
  onPlayNextWord: () => void;
  solutionPhonemes: string[];
  solutionEnglishWord: string;
  solutionMessage: string;
  solutionRevealed: boolean;
};

// GuessRow boxes are h-12 w-12 (48px) with gap-1 (4px). Sized for the
// LARGEST case (5 boxes) so this slot's width never changes regardless of
// the current word's length — that's what stops the keypad from shifting,
// and centering the rows inside it is what keeps equal gap on both sides.
const BOX_SIZE = 48;
const BOX_GAP = 4;
const ROWS_SLOT_WIDTH = MAX_PHONEME_SLOTS * BOX_SIZE + (MAX_PHONEME_SLOTS - 1) * BOX_GAP;

export default function GuessGrid({
  isWide,
  numGuesses,
  wordSize,
  currentGuess,
  submittedGuesses,
  hardMode,
  onHardModeChange,
  hardModeLocked,
  hardModeError,
  isDarkTheme,
  isHighContrast,
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
  const renderRow = (rowIndex: number) => {
    const submitted = submittedGuesses[rowIndex];
    const isCurrentRow = rowIndex === submittedGuesses.length;
    const symbols = submitted ? submitted.symbols : isCurrentRow ? currentGuess : [];
    const colors = submitted ? submitted.colors : null;
    return <GuessRow key={rowIndex} wordSize={wordSize} symbols={symbols} colors={colors} />;
  };

  return (
    <div className={`flex gap-y-6 gap-x-8 ${isWide ? 'flex-row items-start' : 'flex-col items-start'}`}>
      <div className="flex w-44 flex-shrink-0 flex-col items-start gap-3">
        <SolutionReveal
          phonemes={solutionPhonemes}
          englishWord={solutionEnglishWord}
          message={solutionMessage}
          reveal={solutionRevealed}
        />

        <div className="flex w-full items-center justify-between gap-3 rounded-md border border-foreground/10 px-3 py-2">
          <span className="whitespace-nowrap text-sm text-foreground">Hard Mode</span>
          <div className="flex-shrink-0">
            <ToggleSwitch checked={hardMode} onChange={onHardModeChange} disabled={hardModeLocked} />
          </div>
        </div>

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
        {/* Fixed-width slot, sized for the largest possible word — its own
            width never changes, so anything positioned after it (the
            keypad) never moves either. */}
        <div className="flex justify-center" style={{ width: ROWS_SLOT_WIDTH }}>
          <div className="space-y-1">
            {Array.from({ length: numGuesses }, (_, i) => renderRow(i))}
          </div>
        </div>
        {hardModeError && <p className="mt-3 text-sm text-amber-500">{hardModeError}</p>}
      </div>
    </div>
  );
}
