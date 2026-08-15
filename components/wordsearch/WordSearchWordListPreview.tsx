'use client';
import { PhonemeWordEntry, getPhonemeHoverText } from '@/lib/phonemeData';
import { useHintFlip } from '@/lib/useHintFlip';
import type { SolveState } from './WordSearchBuilder';

type HintState = { word: string; phonemeIndex: number; nonce: number } | null;

interface IntroLetterState {
  word: string;
  revealed: boolean[];
  flipping: boolean[];
}

type Props = {
  words: PhonemeWordEntry[];
  count: number;
  revealWords: boolean;
  placedWordSet: Set<string>;
  hint: HintState;
  onHintClick: (entry: PhonemeWordEntry) => void;
  foundWords: Set<string>;
  solves: SolveState[];
  englishRevealed: Set<string>;
  englishFlippingWords: Set<string>;
  hintRevealed: Set<string>;
  hintFlippingWords: Set<string>;
  letterStates: IntroLetterState[];
};

const BOX_SIZE = 26;
const GAP = 4;
const MAX_PHONEME_SLOTS = 5;
const GROUP_GAP = GAP * 2;

// Fully invisible placeholder — reserves the exact same footprint so
// layout never shifts, but shows nothing at all until this box's own
// turn to open arrives (per "hidden from view" requirement).
function HiddenBox({ width = BOX_SIZE, height = BOX_SIZE }: { width?: number; height?: number }) {
  return <div style={{ width, height }} />;
}

function HintBox({
  isFound,
  solve,
  introFlipping,
  triggerId,
  onClick,
}: {
  isFound: boolean;
  solve: SolveState | null;
  introFlipping: boolean;
  triggerId: string | null;
  onClick: () => void;
}) {
  const { flipping: hintFlipping } = useHintFlip(triggerId);
  const isFlipping = hintFlipping || introFlipping;

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
          isFlipping ? 'animate-tile-flip' : ''
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
  introFlipping,
}: {
  symbol: string;
  triggerId: string | null;
  revealWords: boolean;
  isFound: boolean;
  solveInfo: { flipping: boolean; revealed: boolean } | null;
  introFlipping: boolean;
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
    const preColor = revealWords ? 'bg-key-used text-key-used-foreground' : 'border border-foreground/20 bg-background';
    colorClass = solveInfo.revealed ? 'bg-match text-match-foreground' : preColor;
    isFlipping = solveInfo.flipping;
    showSymbol = solveInfo.revealed || revealWords;
    titleAttr = showSymbol ? getPhonemeHoverText(symbol) : undefined;
  } else {
    colorClass = hintRevealed
      ? 'bg-partial text-partial-foreground'
      : revealWords
      ? 'bg-key-used text-key-used-foreground'
      : 'border border-foreground/20 bg-background';
    isFlipping = hintFlipping || introFlipping;
    showSymbol = hintRevealed || revealWords;
    titleAttr = showSymbol ? getPhonemeHoverText(symbol) : undefined;
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
  englishRevealed,
  englishFlippingWords,
  hintRevealed,
  hintFlippingWords,
  letterStates,
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

          const englishShown = entry
            ? englishRevealed.has(entry.word) || englishFlippingWords.has(entry.word)
            : false;
          const englishFlippingNow = entry ? englishFlippingWords.has(entry.word) : false;

          const hintShown = entry && isPlaced ? hintRevealed.has(entry.word) || hintFlippingWords.has(entry.word) : false;
          const hintFlippingNow = entry && isPlaced ? hintFlippingWords.has(entry.word) : false;

          const letterState = entry ? letterStates.find((s) => s.word === entry.word) : undefined;

          return (
            <div key={groupIndex}>
              <div className="flex" style={{ gap: GAP }}>
                {!entry ? (
                  <div
                    className="rounded-md border border-foreground/20 bg-background"
                    style={{ width: BOX_SIZE, height: BOX_SIZE }}
                  />
                ) : !isPlaced ? (
                  <div
                    className="rounded-md border border-foreground/20 bg-background"
                    style={{ width: BOX_SIZE, height: BOX_SIZE }}
                  />
                ) : hintShown ? (
                  <HintBox
                    isFound={isFound}
                    solve={solveForWord}
                    introFlipping={hintFlippingNow}
                    triggerId={hintForThisWord ? `${entry.word}-box-${hintForThisWord.nonce}` : null}
                    onClick={() => onHintClick(entry)}
                  />
                ) : (
                  <HiddenBox />
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

                  const letterShown = letterState ? letterState.revealed[i] || letterState.flipping[i] : false;
                  if (!letterShown) {
                    return <HiddenBox key={i} />;
                  }

                  const triggerId =
                    hintForThisWord && hintForThisWord.phonemeIndex === i
                      ? `${entry!.word}-${i}-${hintForThisWord.nonce}`
                      : null;
                  const solveInfo = solveForWord
                    ? { flipping: solveForWord.letterFlipping[i], revealed: solveForWord.letterRevealed[i] }
                    : null;
                  const introFlipping = letterState ? letterState.flipping[i] : false;

                  return (
                    <PhonemeSlot
                      key={i}
                      symbol={symbol}
                      triggerId={triggerId}
                      revealWords={revealWords}
                      isFound={isFound}
                      solveInfo={solveInfo}
                      introFlipping={introFlipping}
                    />
                  );
                })}
              </div>

              <div style={{ perspective: '400px' }} className="mt-1">
                {!entry ? (
                  <div
                    className="rounded-md border border-foreground/20 bg-background"
                    style={{
                      width: 5 * BOX_SIZE + 4 * GAP,
                      height: BOX_SIZE,
                      marginLeft: BOX_SIZE + GAP,
                    }}
                  />
                ) : !englishShown ? (
                  <div style={{ marginLeft: BOX_SIZE + GAP }}>
                    <HiddenBox width={englishWordWidth} height={BOX_SIZE} />
                  </div>
                ) : (
                  <div
                    className={`flex items-center justify-center rounded-md ${
                      isFound || solveForWord?.wordBoxRevealed
                        ? 'border border-foreground/20 bg-background px-2 font-semibold text-foreground line-through'
                        : 'bg-word-reveal px-2 font-semibold text-word-reveal-foreground'
                    } ${
                      solveForWord?.wordBoxFlipping || englishFlippingNow ? 'animate-tile-flip' : ''
                    }`}
                    style={{
                      width: englishWordWidth,
                      height: BOX_SIZE,
                      marginLeft: BOX_SIZE + GAP,
                    }}
                  >
                    {entry.word}
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
