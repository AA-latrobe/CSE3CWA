'use client';
import { useState, useEffect } from 'react';
import PhonemeWordSelector from '@/components/shared/PhonemeWordSelector';
import PhonemeKeypad from '@/components/shared/PhonemeKeypad';
import Stepper from '@/components/shared/Stepper';
import PhonemeGameTitle from './PhonemeGameTitle';
import PhonemeWordDisplay from './PhonemeWordDisplay';
import GuessRow from './GuessRow';
import { computeWordleColors, computeKeypadColors, CellColor } from '@/lib/wordleLogic';
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
  const previewWord = selectedWords[0]; // first word in the list — the current word being guessed
  const wordSize = previewWord?.phonemes.length ?? 5;

  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [submittedGuesses, setSubmittedGuesses] = useState<SubmittedGuess[]>([]);

  const letterColors = computeKeypadColors(submittedGuesses);

  // Reset gameplay whenever the target word changes, or Reset Game is clicked.
  useEffect(() => {
    setCurrentGuess([]);
    setSubmittedGuesses([]);
  }, [previewWord?.word, resetSignal]);

  const isSolved =
    submittedGuesses.length > 0 &&
    submittedGuesses[submittedGuesses.length - 1].colors.every((c) => c === 'green');
  const isOutOfGuesses = submittedGuesses.length >= numGuesses;
  const isGameActive = isPlayable && !isSolved && !isOutOfGuesses;
  const canSubmit = isGameActive && currentGuess.length === wordSize;

  const handleResetGame = () => {
    setResetSignal((n) => n + 1); // re-triggers title animation AND clears guesses (see effect above)
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

        <div className="mb-6 flex flex-col items-center gap-4">
          <PhonemeGameTitle phonemes={PREVIEW_TITLE_PHONEMES} resetSignal={resetSignal} />
          <button
            type="button"
            onClick={handleResetGame}
            className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5"
          >
            Reset Game
          </button>
        </div>

        {!isPlayable && (
          <p className="mb-4 text-sm text-amber-500">
            Preview is not playable yet — select at least one word above.
          </p>
        )}

        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-8">
          <div className="w-full max-w-[420px]">
            <div className="space-y-1">
              {Array.from({ length: numGuesses }).map((_, rowIndex) => {
                const submitted = submittedGuesses[rowIndex];
                const isCurrentRow = rowIndex === submittedGuesses.length;
                const symbols = submitted ? submitted.symbols : isCurrentRow ? currentGuess : [];
                const colors = submitted ? submitted.colors : null;
                return (
                  <GuessRow key={rowIndex} wordSize={wordSize} symbols={symbols} colors={colors} />
                );
              })}
            </div>
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
