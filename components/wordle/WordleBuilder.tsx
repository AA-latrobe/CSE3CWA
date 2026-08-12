'use client';
import { useState } from 'react'
import PhonemeWordSelector from '@/components/shared/PhonemeWordSelector';
import PhonemeKeypad from '@/components/shared/PhonemeKeypad';
import Stepper from '@/components/shared/Stepper';
import { KEYPAD_TOP, KEYPAD_BOTTOM, PhonemeWordEntry } from '@/lib/phonemeData';

const MIN_GUESSES = 3;
const MAX_GUESSES = 10;

export default function WordleBuilder() {
  const [numGuesses, setNumGuesses] = useState(6);
  const [selectedWords, setSelectedWords] = useState<PhonemeWordEntry[]>([]);
  const [gameWon, setGameWon] = useState(false); // placeholder until game logic exists

  const isPlayable = selectedWords.length > 0;
  const previewWord = selectedWords[0]; // first word in the list, for now
  const wordSize = previewWord?.phonemes.length ?? 5;

  const handleResetGame = () => {
    // placeholder — will reset guess/attempt state once game logic is added
    setGameWon(false);
  };

  return (
    <div className="space-y-8">
      {/* Instructions */}
      <div className="rounded-md border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/80">
        <p>
          Configure a phoneme-based Wordle activity below. Search the word list using
          the phoneme keypad, add words to your selection, then preview the activity.
          [Dummy instructions — replace with final copy.]
        </p>
      </div>

      {/* Control panel */}
      <div className="rounded-md border border-foreground/10 p-4 sm:p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Configure Activity</h2>
        <PhonemeWordSelector
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
            Preview is not playable yet — select at least one word above.
          </p>
        )}

        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-8">
          {/* Left column: guess grid. max-w (not a breakpoint-gated fixed width)
              means it can only shrink on tiny screens, never grow wider once
              it hits its cap — same fix applied to the Word List/Selected
              Words boxes in PhonemeWordSelector. */}
          <div className="w-full max-w-[420px]">
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

            {gameWon && previewWord && (
              <div className="mt-4 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm font-medium text-green-600">
                Solved! The word was: <strong>{previewWord.word}</strong>
              </div>
            )}
          </div>

          {/* Right column: keypad. min-w-0 flex-1, no items-center — PhonemeKeypad
              measures this box's true full width via ResizeObserver, then
              centers its own visual content inside it. Same pattern as the
              right column in PhonemeWordSelector. */}
          <div className="min-w-0 flex-1">
            <PhonemeKeypad
              topGrid={KEYPAD_TOP}
              bottomGrid={KEYPAD_BOTTOM}
              onSelect={() => {}}
              onBackspace={() => {}}
              disabled={!isPlayable}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
