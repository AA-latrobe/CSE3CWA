'use client';
import { useState, useEffect, useMemo } from 'react';
import PhonemeWordSelector from '@/components/shared/PhonemeWordSelector';
import PhonemeKeypad from '@/components/shared/PhonemeKeypad';
import Stepper from '@/components/shared/Stepper';
import PhonemeGameTitle from './PhonemeGameTitle';
import PhonemeWordDisplay from './PhonemeWordDisplay';
import GuessGrid from './GuessGrid';
import {
  computeWordleColors,
  computeKeypadColors,
  computeHardModeConstraints,
  validateHardMode,
  CellColor,
} from '@/lib/wordleLogic';
import {
  KEYPAD_TOP,
  KEYPAD_BOTTOM,
  PREVIEW_TITLE_PHONEMES,
  DEFAULT_SELECTED_ENTRY,
  PhonemeWordEntry,
} from '@/lib/phonemeData';

const MIN_GUESSES = 3;
const MAX_GUESSES = 10;

interface SubmittedGuess {
  symbols: string[];
  colors: CellColor[];
}

export default function WordleBuilder() {
  const [numGuesses, setNumGuesses] = useState(6);
  const [selectedWords, setSelectedWords] = useState<PhonemeWordEntry[]>([DEFAULT_SELECTED_ENTRY]);
  const [resetSignal, setResetSignal] = useState(0);

  const isPlayable = selectedWords.length > 0;
  const previewWord = selectedWords[0];
  const wordSize = previewWord?.phonemes.length ?? 5;

  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [submittedGuesses, setSubmittedGuesses] = useState<SubmittedGuess[]>([]);
  const [hardMode, setHardMode] = useState(false);
  const [hardModeError, setHardModeError] = useState<string | null>(null);

  // Reset gameplay whenever the target word changes, or Reset Game is clicked.
  useEffect(() => {
  setCurrentGuess([]);
  setSubmittedGuesses([]);
  setHardModeError(null);
  }, [previewWord?.word, numGuesses, resetSignal]);

  // Clear any stale Hard Mode error message as soon as the guess itself changes.
  useEffect(() => {
    setHardModeError(null);
  }, [currentGuess]);

  const isSolved =
    submittedGuesses.length > 0 &&
    submittedGuesses[submittedGuesses.length - 1].colors.every((c) => c === 'green');
  const isOutOfGuesses = submittedGuesses.length >= numGuesses;
  const isGameActive = isPlayable && !isSolved && !isOutOfGuesses;
  const canSubmit = isGameActive && currentGuess.length === wordSize;
  const hardModeLocked = submittedGuesses.length > 0;

  const letterColors = computeKeypadColors(submittedGuesses);
  const hardModeConstraints = useMemo(
    () => computeHardModeConstraints(submittedGuesses),
    [submittedGuesses]
  );

  const handleResetGame = () => {
    setResetSignal((n) => n + 1);
  };

  const handlePreviewSelect = (symbol: string) => {
    if (!isGameActive) return;
    if (currentGuess.length >= wordSize) return;
    setCurrentGuess((prev) => [...prev, symbol]);
  };

  const handlePreviewBackspace = () => {
    if (!isGameActive) return;
    if (currentGuess.length === 0) return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  };

  const handleEnter = () => {
    if (!canSubmit || !previewWord) return;

    if (hardMode) {
      const error = validateHardMode(currentGuess, hardModeConstraints);
      if (error) {
        setHardModeError(error);
        return; // guess stays as-is so the user can fix it, not cleared
      }
    }

    const colors = computeWordleColors(currentGuess, previewWord.phonemes);
    setSubmittedGuesses((prev) => [...prev, { symbols: currentGuess, colors }]);
    setCurrentGuess([]);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/80">
        <p>
          Configure a phoneme-based Wordle activity below. Search the word list using
          the phoneme keypad, add words to your selection, then preview the activity.
          [Dummy instructions — replace with final copy.]
        </p>
      </div>

      <div className="rounded-md border border-foreground/10 p-4 sm:p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Configure Activity</h2>
        <PhonemeWordSelector
          selectedWords={selectedWords}
          onSelectedWordsChange={setSelectedWords}
          footerSlot={
            <Stepper
              label="Number of Guesses"
              value={numGuesses}
              min={MIN_GUESSES}
              max={MAX_GUESSES}
              onChange={setNumGuesses}
            />
          }
        />
      </div>

      {/* Preview panel — this is the content that will eventually export to the .html file. */}
      <div className="rounded-md border border-foreground/10 p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Preview</h2>
          <PhonemeWordDisplay phonemes={previewWord?.phonemes ?? []} isPlayable={isPlayable} />
        </div>

        <div className="flex justify-center" style={{ marginBottom: 44 }}>
          <PhonemeGameTitle phonemes={PREVIEW_TITLE_PHONEMES} resetSignal={resetSignal} />
        </div>

        {!isPlayable && (
          <p className="mb-4 text-sm text-amber-500">
            Preview is not playable yet — select at least one word above.
          </p>
        )}

        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-8">
          <div className="min-w-0 w-full md:max-w-[600px] md:flex-1">
            <GuessGrid
              numGuesses={numGuesses}
              wordSize={wordSize}
              currentGuess={currentGuess}
              submittedGuesses={submittedGuesses}
              onResetGame={handleResetGame}
              hardMode={hardMode}
              onHardModeChange={setHardMode}
              hardModeLocked={hardModeLocked}
              hardModeError={hardModeError}
            />
          </div>

          <div className="min-w-0 flex-1">
            <PhonemeKeypad
              topGrid={KEYPAD_TOP}
              bottomGrid={KEYPAD_BOTTOM}
              onSelect={handlePreviewSelect}
              onBackspace={handlePreviewBackspace}
              disabled={!isPlayable}
              letterColors={letterColors}
              showEnter
              canSubmit={canSubmit}
              onEnter={handleEnter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
