'use client';
import { PhonemeWordEntry, getPhonemeHoverText } from '@/lib/phonemeData';
import { useHintFlip } from '@/lib/useHintFlip';
import type { SolveState } from './WordSearchBuilder';

type HintState = { word: string; phonemeIndex: number; nonce: number } | null;

type Props = {
  words: PhonemeWordEntry[];
  count: number;
  revealWords: boolean;
  placedWordSet: Set<string>;
  hint: HintState;
  onHintClick: (entry: PhonemeWordEntry) => void;
  foundWords: Set<string>;
  solves: SolveState[];
  wordPairRevealed: Set<string>;
  wordPairFlippingWord: string | null;
  hintRevealed: Set<string>;
  hintFlippingWord: string | null;
};

const BOX_SIZE = 26;
const GAP = 4;
const MAX_PHONEME_SLOTS = 5;
const GROUP_GAP = GAP * 2;

function Placeholder({ flipping }: { flipping: boolean }) {
  return (
    <div style={{ perspective: '400px' }}>
      <div
        className={`rounded-md border border-foreground/20 bg-background ${
          flipping ? 'animate-tile-flip' : ''
        }`}
        style={{ width: BOX_SIZE, height: BOX_SIZE }}
      />
    </div>
  );
}

function HintBox({
  isFound,
  solve,
  triggerId,
  onClick,
}: {
  isFound: boolean;
  solve: SolveState | null;
  triggerId: string | null;
  onClick: () => void;
}) {
  const { flipping } = useHintFlip(triggerId);

  if (isFound) {
    return (
      <div style={{ perspective: '400px' }}>
        <div
          className="flex items-center justify-center rounded-md border border-foreground/20 bg-background text-sm font-semibold text-match"
          style={{ width: BOX_SIZE, height: BOX_SIZE }}
        >
          ✓
        </div>
      </div>
    );
  }

  if (solve) {
    return (
      <div style={{ perspective: '400px' }}>
        <div
          className={`flex items-center justify-center rounded-md text-xs font-semibold ${
            solve.hintRevealed
              ? 'border border-foreground/20 bg-background text-match'
              : 'bg-partial text-partial-foreground'
          } ${solve.hintFlipping ? 'animate-tile-flip' : ''}`}
          style={{ width: BOX_SIZE, height: BOX_SIZE }}
        >
          {solve.hintRevealed ? '✓' : '?'}
        </div>
      </div>
    );
  }

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
  isFound,
  solveInfo,
}: {
  symbol: string;
  triggerId: string | null;
  revealWords: boolean;
  isFound: boolean;
  solveInfo: { flipping: boolean; revealed: boolean } | null;
}) {
  const { flipping: hintFlipping, revealed: hintRevealed } = useHintFlip(triggerId);

  let colorClass: string;
  let isFlipping: boolean;
  let showSymbol: boolean;
  let titleAttr: string | undefined;

  if (isFound) {
    colorClass = 'bg-match text-match-foreground';
    isFlipping = false;
    showSymbol = true;
    titleAttr = getPhonemeHoverText(symbol);
  } else if (solveInfo) {
    const preColor = revealWords ? 'bg-key-used text-key-used-foreground' : 'bg-key text-key-foreground';
    colorClass = solveInfo.revealed ? 'bg-match text-match-foreground' : preColor;
    isFlipping = solveInfo.flipping;
    showSymbol = solveInfo.revealed || revealWords;
    titleAttr = solveInfo.revealed ? getPhonemeHoverText(symbol) : undefined;
  } else {
    colorClass = hintRevealed
      ? 'bg-partial text-partial-foreground'
      : revealWords
      ? 'bg-key-used text-key-used-foreground'
      : 'bg-key text-key-foreground';
    isFlipping = hintFlipping;
    showSymbol = hintRevealed || revealWords;
    titleAttr = undefined;
  }

  return (
    <div style={{ perspective: '400px' }}>
      <div
        title={titleAttr}
        className={`flex items-center justify-center rounded-md text-sm font-medium ${colorClass} ${
          isFlipping ? 'animate-tile-flip' : ''
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
  foundWords,
  solves,
  wordPairRevealed,
  wordPairFlippingWord,
  hintRevealed,
  hintFlippingWord,
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
          const isFound = entry ? foundWords.has(entry.word) : false;
          const solveForWord = entry ? solves.find((s) => s.word === entry.word) ?? null : null;
          const hintForThisWord = entry && hint && hint.word === entry.word ? hint : null;

          // Word-pair reveal gate: applies to the phoneme boxes + English
          // box together, regardless of whether the word was placed.
          const pairRevealed = entry ? wordPairRevealed.has(entry.word) : false;
          const pairFlipping = entry ? wordPairFlippingWord === entry.word : false;

          // Hint-box reveal gate: separate, later stage — only meaningful
          // for placed words.
          const hintBoxRevealed = entry && isPlaced ? hintRevealed.has(entry.word) : false;
          const hintBoxFlipping = entry && isPlaced ? hintFlippingWord === entry.word : false;

          return (
            <div key={groupIndex}>
              <div className="flex" style={{ gap: GAP }}>
                {entry && isPlaced && hintBoxRevealed ? (
                  <HintBox
                    isFound={isFound}
                    solve={solveForWord}
                    triggerId={hintForThisWord ? `${entry.word}-box-${hintForThisWord.nonce}` : null}
                    onClick={() => onHintClick(entry)}
                  />
                ) : (
                  <Placeholder flipping={hintBoxFlipping} />
                )}

                {Array.from({ length: MAX_PHONEME_SLOTS }).map((_, i) => {
                  if (entry && i >= entry.phonemes.length) return null;
                  const symbol = entry?.phonemes[i];
                  if (!symbol) return <Placeholder key={i} flipping={false} />;

                  if (!pairRevealed) {
                    return <Placeholder key={i} flipping={pairFlipping} />;
                  }

                  const triggerId =
                    hintForThisWord && hintForThisWord.phonemeIndex === i
                      ? `${entry!.word}-${i}-${hintForThisWord.nonce}`
                      : null;
                  const solveInfo = solveForWord
                    ? { flipping: solveForWord.letterFlipping[i], revealed: solveForWord.letterRevealed[i] }
                    : null;
                  return (
                    <PhonemeSlot
                      key={i}
                      symbol={symbol}
                      triggerId={triggerId}
                      revealWords={revealWords}
                      isFound={isFound}
                      solveInfo={solveInfo}
                    />
                  );
                })}
              </div>

              <div style={{ perspective: '400px' }} className="mt-1">
                {!pairRevealed ? (
                  <div
                    className={`rounded-md border border-foreground/20 bg-background ${
                      pairFlipping ? 'animate-tile-flip' : ''
                    }`}
                    style={{
                      width: entry ? englishWordWidth : 5 * BOX_SIZE + 4 * GAP,
                      height: BOX_SIZE,
                      marginLeft: BOX_SIZE + GAP,
                    }}
                  />
                ) : (
                  <div
                    className={`flex items-center justify-center rounded-md ${
                      entry
                        ? isFound || solveForWord?.wordBoxRevealed
                          ? 'bg-word-reveal px-2 font-semibold text-word-reveal-foreground'
                          : 'bg-key px-2 font-semibold text-key-foreground'
                        : 'border border-foreground/20 bg-background'
                    } ${solveForWord?.wordBoxFlipping ? 'animate-tile-flip' : ''}`}
                    style={{
                      width: entry ? englishWordWidth : 5 * BOX_SIZE + 4 * GAP,
                      height: BOX_SIZE,
                      marginLeft: BOX_SIZE + GAP,
                    }}
                  >
                    {entry?.word ?? ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
