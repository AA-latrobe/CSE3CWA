export type CellColor = 'green' | 'yellow' | 'grey';

// Standard Wordle duplicate-letter algorithm:
// 1. Mark exact-position matches green first.
// 2. For everything left over, count how many of each symbol remain
//    in the target (excluding already-green positions).
// 3. Walk the guess left-to-right; if a non-green symbol still has
//    remaining count in the target, mark it yellow and consume one
//    from that count — this is what naturally gives "only the first
//    x duplicates go yellow" when the guess has more copies of a
//    letter than the target does.
export function computeWordleColors(guess: string[], target: string[]): CellColor[] {
  const colors: CellColor[] = guess.map(() => 'grey');
  const remaining: Record<string, number> = {};

  target.forEach((symbol, i) => {
    if (guess[i] === symbol) {
      colors[i] = 'green';
    } else {
      remaining[symbol] = (remaining[symbol] ?? 0) + 1;
    }
  });

  guess.forEach((symbol, i) => {
    if (colors[i] === 'green') return;
    if (remaining[symbol] > 0) {
      colors[i] = 'yellow';
      remaining[symbol] -= 1;
    }
  });

  return colors;
}

// Best color seen for each symbol across all submitted guesses so far.
// Priority: green beats yellow beats grey — e.g. if 'æ' was yellow in an
// earlier guess and green in a later one, it should show green now.
export function computeKeypadColors(guesses: { symbols: string[]; colors: CellColor[] }[]) {
  const priority: Record<CellColor, number> = { grey: 0, yellow: 1, green: 2 };
  const best: Record<string, CellColor> = {};

  for (const guess of guesses) {
    guess.symbols.forEach((symbol, i) => {
      const color = guess.colors[i];
      if (!best[symbol] || priority[color] > priority[best[symbol]]) {
        best[symbol] = color;
      }
    });
  }

  return best; // Record<string, CellColor>
}
