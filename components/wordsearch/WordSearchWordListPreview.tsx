import { PhonemeWordEntry } from '@/lib/phonemeData';

type Props = {
  words: PhonemeWordEntry[];
  count: number;
};

const BOX_SIZE = 26;
const GAP = 4;
const MAX_PHONEME_SLOTS = 5;
const GROUP_GAP = GAP * 2;

export default function WordSearchWordListPreview({ words, count }: Props) {
  return (
    <div className="w-full">
      <p className="mb-2 text-sm font-medium text-foreground">Word List:</p>
      <div className="flex flex-col" style={{ gap: GROUP_GAP }}>
        {Array.from({ length: count }).map((_, groupIndex) => {
          const entry = words[groupIndex];
          const wordLength = entry ? entry.phonemes.length : MAX_PHONEME_SLOTS;
          const englishWordWidth = wordLength * BOX_SIZE + (wordLength - 1) * GAP;

          return (
            <div key={groupIndex}>
              <div className="flex" style={{ gap: GAP }}>
                {/* Box 0: always present, always empty — unchanged spacer box before each word */}
                <div
                  className="rounded-md border border-foreground/20 bg-background"
                  style={{ width: BOX_SIZE, height: BOX_SIZE }}
                />

                {/* Boxes 1..MAX_PHONEME_SLOTS: phoneme slots, only as many shown as the word needs */}
                {Array.from({ length: MAX_PHONEME_SLOTS }).map((_, i) => {
                  if (entry && i >= entry.phonemes.length) return null; // hide trailing unused slots for short words
                  const symbol = entry?.phonemes[i];
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-center rounded-md text-sm font-medium ${
                        symbol ? 'bg-key text-key-foreground' : 'border border-foreground/20 bg-background'
                      }`}
                      style={{ width: BOX_SIZE, height: BOX_SIZE }}
                    >
                      {symbol ?? ''}
                    </div>
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
