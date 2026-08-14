'use client';
import { PhonemeWordEntry } from '@/lib/phonemeData';
import { useHintFlip } from '../../lib/useHintFlip';

type HintState = { word: string; phonemeIndex: number; nonce: number } | null;

type Props = {
  words: PhonemeWordEntry[];
  count: number;
  revealWords: boolean;
  placedWordSet: Set<string>;
  hint: HintState;
  onHintClick: (entry: PhonemeWordEntry) => void;
};

const BOX_SIZE = 26;
const GAP = 4;
const MAX_PHONEME_SLOTS = 5;
const GROUP_GAP = GAP * 2;

function HintBox({ triggerId, onClick }: { triggerId: string | null; onClick: () => void }) {
  const { flipping } = useHintFlip(triggerId);

  return (
    <div style={{ perspective: '400px' }}>
      <button
        type="button"
        onClick={onClick}
        title="Hint?"
        className={`flex items-center justify-center rounded-md bg-partial text-xs font-semibold text-partial-foreground hover:opacity-80 ${
          flipping ? 'animate-tile-flip' : ''
        }`}
        style={{ width: BOX_SIZE, height: BOX_SIZE }}
      >
        ?
      </button>
    </div>
  );
}

function PhonemeSlot({
  symbol,
  triggerId,
  revealWords,
}: {
  symbol: string;
  triggerId: string | null;
  revealWords: boolean;
}) {
  const { flipping, revealed } = useHintFlip(triggerId);

  const showSymbol = revealed || revealWords;
  const colorClass = revealed
    ? 'bg-partial text-partial-foreground'
    : revealWords
    ? 'bg-key-used text-key-used-foreground'
    : 'bg-key text-key-foreground';

  return (
    <div style={{ perspective: '400px' }}>
      <div
        className={`flex items-center justify-center rounded-md text-sm font-medium ${colorClass} ${
          flipping ? 'animate-tile-flip' : ''
        }`}
        style={{ width: BOX_SIZE, height: BOX_SIZE }}
      >
        {showSymbol ? symbol : ''}
      </div>
    </div>
  );
}

export default function WordSearchWordListPreview({
  words,
  count,
  revealWords,
  placedWordSet,
  hint,
  onHintClick,
}: Props) {
  return (
    <div className="w-full">
      <p className="mb-2 text-sm font-medium text-foreground">Word List:</p>
      <div className="flex flex-col" style={{ gap: GROUP_GAP }}>
        {Array.from({ length: count }).map((_, groupIndex) => {
          const entry = words[groupIndex];
          const wordLength = entry ? entry.phonemes.length : MAX_PHONEME_SLOTS;
          const englishWordWidth = wordLength * BOX_SIZE + (wordLength - 1) * GAP;
          const isPlaced = entry ? placedWordSet.has(entry.word) : false;
          const hintForThisWord = entry && hint && hint.word === entry.word ? hint : null;

          return (
            <div key={groupIndex}>
              <div className="flex" style={{ gap: GAP }}>
                {entry && isPlaced ? (
                  <HintBox
                    triggerId={hintForThisWord ? `${entry.word}-box-${hintForThisWord.nonce}` : null}
                    onClick={() => onHintClick(entry)}
                  />
                ) : (
                  <div
                    className="rounded-md border border-foreground/20 bg-background"
                    style={{ width: BOX_SIZE, height: BOX_SIZE }}
                  />
                )}

                {Array.from({ length: MAX_PHONEME_SLOTS }).map((_, i) => {
                  if (entry && i >= entry.phonemes.length) return null;
                  const symbol = entry?.phonemes[i];
                  if (!symbol) {
                    return (
                      <div
                        key={i}
                        className="rounded-md border border-foreground/20 bg-background"
                        style={{ width: BOX_SIZE, height: BOX_SIZE }}
                      />
                    );
                  }
                  const triggerId =
                    hintForThisWord && hintForThisWord.phonemeIndex === i
                      ? `${entry!.word}-${i}-${hintForThisWord.nonce}`
                      : null;
                  return (
                    <PhonemeSlot key={i} symbol={symbol} triggerId={triggerId} revealWords={revealWords} />
                  );
                })}
              </div>

              <div
                className={`mt-1 flex items-center justify-center rounded-md ${
                  entry
                    ? 'bg-key px-2 font-semibold text-key-foreground'
                    : 'border border-foreground/20 bg-background'
                }`}
                style={{
                  width: entry ? englishWordWidth : 5 * BOX_SIZE + 4 * GAP,
                  height: BOX_SIZE,
                  marginLeft: BOX_SIZE + GAP,
                }}
              >
                {entry?.word ?? ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
