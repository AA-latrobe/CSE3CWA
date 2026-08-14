import { useMemo } from 'react';
import { KEYPAD_TOP, KEYPAD_BOTTOM } from '@/lib/phonemeData';

const ALL_PHONEME_SYMBOLS = [...KEYPAD_TOP, ...KEYPAD_BOTTOM]
  .flat()
  .filter((symbol): symbol is string => symbol !== '');

function randomPhoneme(): string {
  return ALL_PHONEME_SYMBOLS[Math.floor(Math.random() * ALL_PHONEME_SYMBOLS.length)];
}

const FIXED_CELLS: { row: number; col: number; symbol: string }[] = [
  { row: 2, col: 2, symbol: 'w' },
  { row: 2, col: 3, symbol: 'ɜː' },
  { row: 2, col: 4, symbol: 'd' },
  { row: 1, col: 6, symbol: 's' },
  { row: 2, col: 7, symbol: 'ɜː' },
  { row: 3, col: 8, symbol: 'tʃ' },
];

type Props = {
  resetSignal: number;
};

const COLS = 9;
const ROWS = 3;

export default function WordSearchTitle({ resetSignal }: Props) {
  const symbols = useMemo(() => {
    const fixedMap = new Map<string, string>();
    for (const cell of FIXED_CELLS) {
      fixedMap.set(`${cell.row},${cell.col}`, cell.symbol);
    }

    return Array.from({ length: ROWS * COLS }, (_, i) => {
      const row = Math.floor(i / COLS) + 1;
      const col = (i % COLS) + 1;
      return fixedMap.get(`${row},${col}`) ?? randomPhoneme();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  return (
    <div>
      <div className="flex justify-center" style={{ marginBottom: 44 }}>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 40px)` }}>
          {symbols.map((symbol, i) => (
            <div
              key={i}
              className="flex items-center justify-center rounded-md bg-key text-base font-medium text-key-foreground"
              style={{ width: 40, height: 40 }}
            >
              {symbol}
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex items-center justify-center gap-1 text-lg text-foreground/70"
        style={{ marginBottom: 44 }}
      >
        <span>A Phoneme</span>
        <div
            className="flex items-center justify-center rounded-md bg-key text-lg font-semibold text-key-foreground"
            style={{ width: 128, height: 40 }}
            >
            word
            </div>
            <div
            className="flex items-center justify-center rounded-md bg-key text-lg font-semibold text-key-foreground"
            style={{ width: 128, height: 40 }}
            >
            search
            </div>
        <span>Game</span>
      </div>
    </div>
  );
}
