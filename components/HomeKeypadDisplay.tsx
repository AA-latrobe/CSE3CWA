'use client';
import { useContainerWidth } from '@/lib/useContainerWidth';
import { KEYPAD_LEFT, KEYPAD_RIGHT, getPhonemeHoverText } from '@/lib/phonemeData';

const SIDE_BY_SIDE_THRESHOLD = 340;

function renderGrid(grid: string[][], keyPrefix: string) {
  return (
    <div className="grid grid-cols-4 gap-1">
      {grid.flatMap((row, ri) =>
        row.map((symbol, ci) =>
          symbol ? (
            <div
              key={`${keyPrefix}-${ri}-${ci}`}
              title={getPhonemeHoverText(symbol)}
              className="flex h-10 w-10 items-center justify-center rounded-md bg-key text-base font-medium text-key-foreground"
            >
              {symbol}
            </div>
          ) : (
            <div key={`${keyPrefix}-${ri}-${ci}`} className="h-10 w-10" />
          )
        )
      )}
    </div>
  );
}

export default function HomeKeypadDisplay() {
  const { ref, isWide } = useContainerWidth<HTMLDivElement>(SIDE_BY_SIDE_THRESHOLD);
  const keypadRightTop = KEYPAD_RIGHT.slice(0, 3);
  const keypadRightBottom = KEYPAD_RIGHT.slice(3);

  return (
    <div ref={ref} className="w-full">
      <div className={`flex gap-y-4 gap-x-4 ${isWide ? 'flex-row items-start justify-start' : 'flex-col items-center'}`}>
        <div className="flex flex-col items-start gap-1">
          <p className="text-sm font-medium text-foreground">Consonant Sounds:</p>
          {renderGrid(KEYPAD_LEFT, 'home-left')}
        </div>
        <div className="flex flex-col items-start gap-1">
          <p className="text-sm font-medium leading-tight text-foreground">
            Short &amp; Long
            <br />
            Vowels:
          </p>
          {renderGrid(keypadRightTop, 'home-right-top')}
          <p className="mt-2 text-sm font-medium leading-tight text-foreground">
            Diphthongs &amp;
            <br />
            Schwa:
          </p>
          {renderGrid(keypadRightBottom, 'home-right-bottom')}
        </div>
      </div>
    </div>
  );
}
