export type CellColor = 'green' | 'yellow' | 'grey';

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

export function computeKeypadColors(
  guesses: { symbols: string[]; colors: CellColor[] }[]
): Record<string, CellColor> {
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

  return best;
}

export interface HardModeConstraints {
  greenPositions: Record<number, string>;
  minCounts: Record<string, number>;
}

// Aggregates every clue revealed across all submitted guesses into the
// strictest set of requirements the next guess must satisfy.
export function computeHardModeConstraints(
  guesses: { symbols: string[]; colors: CellColor[] }[]
): HardModeConstraints {
  const greenPositions: Record<number, string> = {};
  const minCounts: Record<string, number> = {};

  for (const guess of guesses) {
    const countsThisGuess: Record<string, number> = {};

    guess.symbols.forEach((symbol, i) => {
      const color = guess.colors[i];
      if (color === 'green') {
        greenPositions[i] = symbol;
      }
      if (color === 'green' || color === 'yellow') {
        countsThisGuess[symbol] = (countsThisGuess[symbol] ?? 0) + 1;
      }
    });

    // Take the max seen in any single guess — e.g. if one earlier guess
    // revealed two yellow/green 'l's, the next guess must include at
    // least two, even if a different guess only showed one.
    for (const symbol of Object.keys(countsThisGuess)) {
      minCounts[symbol] = Math.max(minCounts[symbol] ?? 0, countsThisGuess[symbol]);
    }
  }

  return { greenPositions, minCounts };
}

// Returns null if the guess satisfies every constraint, otherwise a
// human-readable message describing the first violation found.
export function validateHardMode(guess: string[], constraints: HardModeConstraints): string | null {
  for (const [indexStr, symbol] of Object.entries(constraints.greenPositions)) {
    const index = Number(indexStr);
    if (guess[index] !== symbol) {
      return `Hard Mode: position ${index + 1} must be "${symbol}"`;
    }
  }

  const guessCounts: Record<string, number> = {};
  guess.forEach((symbol) => {
    guessCounts[symbol] = (guessCounts[symbol] ?? 0) + 1;
  });

  for (const [symbol, minCount] of Object.entries(constraints.minCounts)) {
    if ((guessCounts[symbol] ?? 0) < minCount) {
      return `Hard Mode: guess must include "${symbol}"`;
    }
  }

  return null;
}
