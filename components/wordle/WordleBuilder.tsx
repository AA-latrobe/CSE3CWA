'use client';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useContainerWidth } from '@/lib/useContainerWidth';
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
  deriveGameStatus,
  GUESS_FLIP_DURATION_MS,
  GUESS_FLIP_STAGGER_MS,
  CellColor,
} from '@/lib/wordleLogic';
import { KEYPAD_TOP, KEYPAD_BOTTOM, PREVIEW_TITLE_PHONEMES, PhonemeWordEntry } from '@/lib/phonemeData';
import { getInitialWordleState, saveWordleState } from '@/lib/wordleStorage';
import { downloadStandaloneWordleHtml } from '@/lib/wordleExport';
import { WORD_LIST } from '@/lib/phonemeData';

const MIN_GUESSES = 3;
const MAX_GUESSES = 10;
const SOLUTION_REVEAL_EXTRA_DELAY_MS = 1000;

interface SubmittedGuess {
  symbols: string[];
  colors: CellColor[];
}

export default function WordleBuilder() {
  const { theme, highContrast } = useTheme();
  const { ref: previewRowRef, isWide: previewRowWide } = useContainerWidth<HTMLDivElement>(700);

  const initialRef = useRef<ReturnType<typeof getInitialWordleState> | null>(null);
  if (initialRef.current === null) {
    initialRef.current = getInitialWordleState();
  }
  const initial = initialRef.current;

  const [numGuesses, setNumGuesses] = useState(initial.numGuesses);
  const [selectedWords, setSelectedWords] = useState<PhonemeWordEntry[]>(initial.selectedWords);
  const [gameSignal, setGameSignal] = useState(0);

  const isPlayable = selectedWords.length > 0;

  const [currentWordIndex, setCurrentWordIndex] = useState(initial.currentWordIndex);
  const [solvedCount, setSolvedCount] = useState(initial.solvedCount);
  const [failedCount, setFailedCount] = useState(initial.failedCount);

  const previewWord = selectedWords[currentWordIndex];
  const wordSize = previewWord?.phonemes.length ?? 5;
  const isLastWord = currentWordIndex >= selectedWords.length - 1;

  const [currentGuess, setCurrentGuess] = useState<string[]>(initial.currentGuess);
  const [submittedGuesses, setSubmittedGuesses] = useState<SubmittedGuess[]>(initial.submittedGuesses);
  const [hardMode, setHardMode] = useState(initial.hardMode);
  const [hardModeError, setHardModeError] = useState<string | null>(null);

  const hasCountedResult = useRef(
    deriveGameStatus(initial.submittedGuesses, initial.numGuesses).isGameOver
  );

  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [scrollY, setScrollY] = useState(initial.scrollY);
  const hasRestoredScroll = useRef(false);

  const prevSelectedWordsRef = useRef(selectedWords);
  const resetKeyRef = useRef(`${previewWord?.word}|${numGuesses}|${gameSignal}`);

  useEffect(() => {
    if (prevSelectedWordsRef.current === selectedWords) return;
    prevSelectedWordsRef.current = selectedWords;
    setCurrentWordIndex(0);
    setSolvedCount(0);
    setFailedCount(0);
  }, [selectedWords]);

  useEffect(() => {
    const key = `${previewWord?.word}|${numGuesses}|${gameSignal}`;
    if (resetKeyRef.current === key) return;
    resetKeyRef.current = key;

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

  const { isSolved, isGameOver } = deriveGameStatus(submittedGuesses, numGuesses);
  const isGameActive = isPlayable && !isGameOver;
  const canSubmit = isGameActive && currentGuess.length === wordSize;
  const hardModeLocked = submittedGuesses.length > 0;

  const letterColors = computeKeypadColors(submittedGuesses);
  const hardModeConstraints = computeHardModeConstraints(submittedGuesses);

  useEffect(() => {
    const status = deriveGameStatus(submittedGuesses, numGuesses);
    if (status.isGameOver && !hasCountedResult.current) {
      hasCountedResult.current = true;
      if (status.isSolved) setSolvedCount((n) => n + 1);
      else setFailedCount((n) => n + 1);
    }
  }, [submittedGuesses, numGuesses]);

  useEffect(() => {
    const status = deriveGameStatus(submittedGuesses, numGuesses);
    if (status.isGameOver && revealTimer.current === null) {
      const rowFlipDuration = (wordSize - 1) * GUESS_FLIP_STAGGER_MS + GUESS_FLIP_DURATION_MS;
      const totalDelay = rowFlipDuration + SOLUTION_REVEAL_EXTRA_DELAY_MS;

      revealTimer.current = setTimeout(() => {
        setSolutionRevealed(true);
        revealTimer.current = null;
      }, totalDelay);
    }

    return () => {
      if (revealTimer.current) {
        clearTimeout(revealTimer.current);
        revealTimer.current = null;
      }
    };
  }, [submittedGuesses, numGuesses, wordSize]);

  useEffect(() => {
    setHardModeError(null);
  }, [currentGuess]);

  // Tracks scroll position continuously from the moment this component
  // mounts — NOT gated by "has a guess been made yet." Gating it was the
  // bug: a listener that only starts existing after the first guess
  // misses whatever scrolling already happened to REACH that guess (e.g.
  // scrolling down to click Enter). Tracking unconditionally means
  // whatever position you're at is always already known the instant it
  // becomes relevant to save.
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (initial.scrollY <= 0) return;
    if (hasRestoredScroll.current) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30;

    const tryScroll = () => {
      if (cancelled) return;
      attempts++;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll >= initial.scrollY || attempts >= maxAttempts) {
        window.scrollTo(0, initial.scrollY);
        hasRestoredScroll.current = true;
      } else {
        requestAnimationFrame(tryScroll);
      }
    };

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) requestAnimationFrame(tryScroll);
      });
    } else {
      requestAnimationFrame(tryScroll);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveWordleState({
      selectedWords,
      numGuesses,
      currentWordIndex,
      solvedCount,
      failedCount,
      hardMode,
      currentGuess,
      submittedGuesses,
      scrollY,
    });
  }, [
    selectedWords,
    numGuesses,
    currentWordIndex,
    solvedCount,
    failedCount,
    hardMode,
    currentGuess,
    submittedGuesses,
    scrollY,
  ]);

  const completionMessage = computeCompletionMessage(isSolved, submittedGuesses.length, numGuesses);

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

  const handleAddAll = (filteredWords: PhonemeWordEntry[]) => {
    setSelectedWords([...selectedWords, ...filteredWords]);
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

  const handleGeneratePage = () => {
    if (selectedWords.length === 0) return;
    downloadStandaloneWordleHtml(selectedWords, numGuesses);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-foreground/10 bg-background p-4 text-sm text-foreground/80">
        <p>
          Configure a phoneme-based Wordle activity below. Search the word list using
          the phoneme keypad, add words to your selection, then preview the activity.
          [Dummy instructions — replace with final copy.]
        </p>
      </div>

      <div className="rounded-md border border-foreground/10 bg-background p-4 sm:p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Configure Activity</h2>
        <PhonemeWordSelector
          selectedWords={selectedWords}
          onSelectedWordsChange={setSelectedWords}
          footerSlot={
            <div className="flex flex-col items-center gap-4">
              <Stepper
                label="Number of Guesses"
                value={numGuesses}
                min={MIN_GUESSES}
                max={MAX_GUESSES}
                onChange={setNumGuesses}
              />
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleGeneratePage}
                  disabled={selectedWords.length === 0}
                  className="rounded-md bg-word-reveal px-4 py-2 text-sm font-medium text-word-reveal-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Generate .html Puzzle Page
                </button>
              </div>
            </div>
          }
          addButtonLabel="Add All"
          onAddButtonClick={handleAddAll}
        />
      </div>

      <div className="rounded-md border border-foreground/10 bg-background p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Preview</h2>
          <PhonemeWordDisplay phonemes={previewWord?.phonemes ?? []} isPlayable={isPlayable} />
        </div>

        <div className="flex justify-center" style={{ marginBottom: 44 }}>
          <PhonemeGameTitle phonemes={PREVIEW_TITLE_PHONEMES} resetSignal={gameSignal} />
        </div>

        <p className="text-center text-lg text-foreground/70" style={{ marginBottom: 44 }}>
          A Phoneme Word Guessing Game
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-foreground/70" style={{ marginBottom: 44 }}>
          <div className="flex h-7 w-7 items-center justify-center rounded bg-match" />
          <span>= Correct position</span>
          <span className="mx-2 text-foreground/30">|</span>
          <div className="flex h-7 w-7 items-center justify-center rounded bg-partial" />
          <span>= In the word, but wrong position</span>
        </div>

        {!isPlayable && (
          <p className="mb-4 text-sm text-amber-500">
            Preview is not playable yet — select at least one word above.
          </p>
        )}

        <div
          ref={previewRowRef}
          className={`flex gap-6 ${previewRowWide ? 'flex-row items-start' : 'flex-col items-stretch'}`}
        >
          <div className="flex-shrink-0">
            <GuessGrid
              isWide={previewRowWide}
              numGuesses={numGuesses}
              wordSize={wordSize}
              currentGuess={currentGuess}
              submittedGuesses={submittedGuesses}
              hardMode={hardMode}
              onHardModeChange={setHardMode}
              hardModeLocked={hardModeLocked}
              hardModeError={hardModeError}
              isDarkTheme={theme === 'dark'}
              isHighContrast={highContrast}
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

          <div className="min-w-0 flex-1 pl-8">
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
