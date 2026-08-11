'use client';
import { useState } from 'react';
import PhonemeKeypad from './PhonemeKeypad';
import Stepper from './Stepper';
import {
  KEYPAD_GRID,
  DEFAULT_PHONEME_WORD,
  DEFAULT_ENGLISH_WORD,
  WordSize,
} from '@/lib/phonemeData';

const MIN_GUESSES = 3; // assumption — no minimum was specified; adjust if needed
const MAX_GUESSES = 8;

// Fixed width sized for the largest word size (5 boxes: 5*48px + 4*8px gap).
// Keeping this constant is what stops the keypad shifting when word size changes.
const WORD_COLUMN_WIDTH = 272;

export default function WordleBuilder() {
  const [wordSize, setWordSize] = useState<WordSize>(5);
  const [numGuesses, setNumGuesses] = useState(5);
  const [phonemeWord, setPhonemeWord] = useState<string[]>(DEFAULT_PHONEME_WORD);
  const [englishWord, setEnglishWord] = useState(DEFAULT_ENGLISH_WORD);

  // Placeholder — will be driven by real guess-checking logic later.
  const [gameWon, setGameWon] = useState(false);

  const isPlayable =
    phonemeWord.length === wordSize &&
    englishWord.trim().length >= 3 &&
    englishWord.trim().length <= 10;

  const handleWordSizeChange = (size: number) => {
    setWordSize(size as WordSize);
    setPhonemeWord([]);
    setEnglishWord('');
    setGameWon(false);
  };

  const handlePhonemeSelect = (symbol: string) => {
    if (phonemeWord.length >= wordSize) return;
    setPhonemeWord([...phonemeWord, symbol]);
    setEnglishWord('');
    setGameWon(false);
  };

  const handleBackspace = () => {
    if (phonemeWord.length === 0) return;
    setPhonemeWord(phonemeWord.slice(0, -1));
    setEnglishWord('');
    setGameWon(false);
  };

  const handleClearWords = () => {
    setPhonemeWord([]);
    setEnglishWord('');
    setGameWon(false);
  };

  const handleEnglishWordChange = (value: string) => {
    setEnglishWord(value.slice(0, 10));
    setGameWon(false);
  };

  const handleResetGame = () => {
    // placeholder — will reset guess/attempt state once game logic is added
    setGameWon(false);
  };

  return (
    <div className="space-y-8">
      {/* Instructions */}
      <div className="rounded-md border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/80">
        <p>
          Configure a phoneme-based Wordle activity below. Choose the word size, set
          the number of guesses students get, then build the target word using the
          phoneme keypad. [Dummy instructions — replace with final copy.]
        </p>
      </div>

      {/* Control panel */}
      <div className="rounded-md border border-foreground/10 p-4 sm:p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Configure Activity</h2>

        <div className="grid grid-cols-[auto_auto] items-start justify-center gap-x-10 gap-y-6 sm:gap-x-16">
          {/* Row 1: Word Size + Guesses, centered pair */}
          <Stepper
            label="Phoneme Word Size"
            value={wordSize}
            min={3}
            max={5}
            onChange={handleWordSizeChange}
            suffix="letters"
          />
          <div className="justify-self-end">
            <Stepper
              label="Number of Guesses"
              value={numGuesses}
              min={MIN_GUESSES}
              max={MAX_GUESSES}
              onChange={setNumGuesses}
            />
          </div>

          {/* Row 2: Phoneme Word (+ English Word below it) / Keypad */}
          <div className="flex flex-col gap-4" style={{ width: WORD_COLUMN_WIDTH }}>
            <div className="flex gap-2">
              {Array.from({ length: wordSize }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-foreground/20 text-lg font-semibold text-foreground"
                >
                  {phonemeWord[i] ?? ''}
                </div>
              ))}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="englishWord">
                English Word
              </label>
              <input
                id="englishWord"
                type="text"
                value={englishWord}
                onChange={(e) => handleEnglishWordChange(e.target.value)}
                maxLength={10}
                className="w-48 rounded-md border border-foreground/20 bg-background px-3 py-2 text-foreground"
              />
              <p className="mt-1 text-xs text-foreground/50">3–10 letters</p>

              <button
                type="button"
                onClick={handleClearWords}
                className="mt-3 rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5"
              >
                Clear Words
              </button>
            </div>
          </div>

          <PhonemeKeypad
            grid={KEYPAD_GRID}
            onSelect={handlePhonemeSelect}
            onBackspace={handleBackspace}
          />
        </div>
      </div>

      {/* Preview panel */}
      <div className="rounded-md border border-foreground/10 p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Preview</h2>
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
            Preview is not playable yet — complete the Phoneme Word and English Word above.
          </p>
        )}

        <div className="grid grid-cols-[auto_auto] items-start justify-center gap-x-10 sm:gap-x-16">
          <div style={{ width: WORD_COLUMN_WIDTH }}>
            <div className="space-y-1">
              {Array.from({ length: numGuesses }).map((_, row) => (
                <div key={row} className="flex gap-1">
                  {Array.from({ length: wordSize }).map((_, col) => (
                    <div
                      key={col}
                      className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-foreground/20 text-lg font-semibold text-foreground"
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Reveal — only shown once the puzzle is solved */}
            {gameWon && (
              <div className="mt-4 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm font-medium text-green-600">
                Solved! The word was: <strong>{englishWord}</strong>
              </div>
            )}
          </div>

          <PhonemeKeypad
            grid={KEYPAD_GRID}
            onSelect={() => {}}
            onBackspace={() => {}}
            disabled={!isPlayable}
          />
        </div>
      </div>
    </div>
  );
}
