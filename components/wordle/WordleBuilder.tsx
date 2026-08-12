'use client';
import { useState, useEffect, useRef } from 'react';
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
  computeCompletionMessage,
  GUESS_FLIP_DURATION_MS,
  GUESS_FLIP_STAGGER_MS,
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
const SOLUTION_REVEAL_EXTRA_DELAY_MS = 1000;

interface SubmittedGuess {
  symbols: string[];
  colors: CellColor[];
}

export default function WordleBuilder() {
  const [numGuesses, setNumGuesses] = useState(6);
  const [selectedWords, setSelectedWords] = useState<PhonemeWordEntry[]>([DEFAULT_SELECTED_ENTRY]);
  const [gameSignal, setGameSignal] = useState(0);

  const isPlayable = selectedWords.length > 0;

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const previewWord = selectedWords[currentWordIndex];
  const wordSize = previewWord?.phonemes.length ?? 5;
  const isLastWord = currentWordIndex >= selectedWords.length - 1;

  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [submittedGuesses, setSubmittedGuesses] = useState<SubmittedGuess[]>([]);
  const [hardMode, setHardMode] = useState(false);
  const [hardModeError, setHardModeError] = useState<string | null>(null);
  const hasCountedResult = useRef(false);

  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCurrentWordIndex(0);
    setSolvedCount(0);
    setFailedCount(0);
  }, [selectedWords]);

  useEffect(() => {
    setCurrentGuess([]);
    setSubmittedGuesses([]);
    setHardModeError(null);
    hasCountedResult.current = false;

    setSolutionRevealed(false);
    if (revealTimer.current) {
      clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
  }, [previewWord?.word, numGuesses, gameSignal]);

  const isSolved =
    submittedGuesses.length > 0 &&
    submittedGuesses[submittedGuesses.length - 1].colors.every((c) => c === 'green');
  const isOutOfGuesses = submittedGuesses.length >= numGuesses;
  const isGameOver = isSolved || isOutOfGuesses;
  const isGameActive = isPlayable && !isGameOver;
  const canSubmit = isGameActive && currentGuess.length === wordSize;
  const hardModeLocked = submittedGuesses.length > 0;

  const letterColors = computeKeypadColors(submittedGuesses);
  const hardModeConstraints = computeHardModeConstraints(submittedGuesses);

  // Result-tallying effect — now keyed to submittedGuesses itself, not a
// derived boolean that can be stale for one render during a word transition.
useEffect(() => {
  const solved =
    submittedGuesses.length > 0 &&
    submittedGuesses[submittedGuesses.length - 1].colors.every((c) => c === 'green');
  const outOfGuesses = submittedGuesses.length >= numGuesses;
  const gameOver = solved || outOfGuesses;

  if (gameOver && !hasCountedResult.current) {
    hasCountedResult.current = true;
    if (solved) setSolvedCount((n) => n + 1);
    else setFailedCount((n) => n + 1);
  }
}, [submittedGuesses]);

// Reveal-scheduling effect — same fix. Only fires when submittedGuesses
// actually changes (a new guess submitted, or reset to [] on a fresh game),
// never off a transitional render where the word changed but the guesses
// array hasn't been cleared yet.
useEffect(() => {
  const solved =
    submittedGuesses.length > 0 &&
    submittedGuesses[submittedGuesses.length - 1].colors.every((c) => c === 'green');
  const outOfGuesses = submittedGuesses.length >= numGuesses;
  const gameOver = solved || outOfGuesses;

  if (gameOver && revealTimer.current === null) {
    const rowFlipDuration = (wordSize - 1) * GUESS_FLIP_STAGGER_MS + GUESS_FLIP_DURATION_MS;
    const totalDelay = rowFlipDuration + SOLUTION_REVEAL_EXTRA_DELAY_MS;

    revealTimer.current = setTimeout(() => {
      setSolutionRevealed(true);
      revealTimer.current = null;
    }, totalDelay);
  }
}, [submittedGuesses]);

  const completionMessage = computeCompletionMessage(isSolved, submittedGuesses.length, numGuesses);

  const handleResetGame = () => {
    if (isGameOver) return;
    setGameSignal((n) => n + 1);
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
        return;
      }
    }

    const colors = computeWordleColors(currentGuess, previewWord.phonemes);
    setSubmittedGuesses((prev) => [...prev, { symbols: currentGuess, colors }]);
    setCurrentGuess([]);
  };

  const handlePlayNextWord = () => {
    if (!isGameOver) return;

    if (isLastWord) {
      setCurrentWordIndex(0);
      setSolvedCount(0);
      setFailedCount(0);
    } else {
      setCurrentWordIndex((i) => i + 1);
    }
    setGameSignal((n) => n + 1);
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

      <div className="rounded-md border border-foreground/10 p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Preview</h2>
          <PhonemeWordDisplay phonemes={previewWord?.phonemes ?? []} isPlayable={isPlayable} />
        </div>

        <div className="flex justify-center" style={{ marginBottom: 44 }}>
          <PhonemeGameTitle phonemes={PREVIEW_TITLE_PHONEMES} resetSignal={gameSignal} />
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
              resetGameDisabled={isGameOver}
              hardMode={hardMode}
              onHardModeChange={setHardMode}
              hardModeLocked={hardModeLocked}
              hardModeError={hardModeError}
              showStats={isPlayable}
              totalWords={selectedWords.length}
              currentWordNumber={currentWordIndex + 1}
              solvedCount={solvedCount}
              failedCount={failedCount}
              isGameOver={isGameOver}
              isLastWord={isLastWord}
              onPlayNextWord={handlePlayNextWord}
              solutionPhonemes={previewWord?.phonemes ?? []}
              solutionEnglishWord={previewWord?.word ?? ''}
              solutionMessage={completionMessage}
              solutionRevealed={solutionRevealed}
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
