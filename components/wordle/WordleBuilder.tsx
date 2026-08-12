'use client';
import { useState } from 'react';
import PhonemeWordSelector from '@/components/shared/PhonemeWordSelector';
import PhonemeKeypad from '@/components/shared/PhonemeKeypad';
import Stepper from '@/components/shared/Stepper';
import PhonemeGameTitle from './PhonemeGameTitle';
import PhonemeWordDisplay from './PhonemeWordDisplay';
import { KEYPAD_TOP, KEYPAD_BOTTOM, PREVIEW_TITLE_PHONEMES, DEFAULT_SELECTED_ENTRY, PhonemeWordEntry } from '@/lib/phonemeData';

const MIN_GUESSES = 3;
const MAX_GUESSES = 10;

export default function WordleBuilder() {
  const [numGuesses, setNumGuesses] = useState(6);
  const [selectedWords, setSelectedWords] = useState<PhonemeWordEntry[]>([DEFAULT_SELECTED_ENTRY]);
  const [gameWon, setGameWon] = useState(false); // placeholder until game logic exists
  const [resetSignal, setResetSignal] = useState(0);

  const isPlayable = selectedWords.length > 0;
  const previewWord = selectedWords[0]; // first word in the list — the current word being guessed
  const wordSize = previewWord?.phonemes.length ?? 5;

  const handleResetGame = () => {
    setGameWon(false); // placeholder — will reset guess state once logic exists
    setResetSignal((n) => n + 1); // re-triggers the title's flip animation
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
        {/* Row 1: Preview heading + current word being guessed */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Preview</h2>
          <PhonemeWordDisplay phonemes={previewWord?.phonemes ?? []} isPlayable={isPlayable} />
        </div>

        {/* Row 2: title, centered in its own section, Reset Game stacked below it */}
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
