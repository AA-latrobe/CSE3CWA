import { PhonemeWordEntry } from './phonemeData';

type Orientation = 'horizontal' | 'vertical' | 'diagonal';

interface DirectionDef {
  dx: number;
  dy: number;
  orientation: Orientation;
}

const DIRECTIONS: DirectionDef[] = [
  { dx: 1, dy: 0, orientation: 'horizontal' },
  { dx: 0, dy: 1, orientation: 'vertical' },
  { dx: 1, dy: 1, orientation: 'diagonal' },
  { dx: -1, dy: 1, orientation: 'diagonal' },
];

interface GridCell {
  symbol: string | null;
  orientations: Set<Orientation>;
}

export interface PlacedWord {
  word: string;
  cells: { row: number; col: number }[];
}

export interface WordSearchResult {
  grid: (string | null)[][];
  placedWords: PlacedWord[];
  unplacedWords: string[];
}

const MAX_ATTEMPTS_PER_WORD = 300;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateWordSearchGrid(words: PhonemeWordEntry[], gridSize: number): WordSearchResult {
  const cells: GridCell[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => ({ symbol: null, orientations: new Set<Orientation>() }))
  );

  const placedWords: PlacedWord[] = [];
  const unplacedWords: string[] = [];

  const orderedWords = [...words].sort((a, b) => b.phonemes.length - a.phonemes.length);

  for (const entry of orderedWords) {
    const path = tryPlaceWord(cells, entry, gridSize);
    if (path) placedWords.push({ word: entry.word, cells: path });
    else unplacedWords.push(entry.word);
  }

  const grid = cells.map((row) => row.map((cell) => cell.symbol));
  return { grid, placedWords, unplacedWords };
}

// Returns the exact cell path the word was placed along, or null if no
// valid placement was found within the attempt budget.
function tryPlaceWord(
  cells: GridCell[][],
  entry: PhonemeWordEntry,
  gridSize: number
): { row: number; col: number }[] | null {
  const length = entry.phonemes.length;
  if (length > gridSize) return null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_WORD; attempt++) {
    const dir = DIRECTIONS[randomInt(0, DIRECTIONS.length - 1)];
    const backwards = Math.random() < 0.5;

    const startCol =
      dir.dx === 1 ? randomInt(0, gridSize - length) : dir.dx === -1 ? randomInt(length - 1, gridSize - 1) : randomInt(0, gridSize - 1);
    const startRow = dir.dy === 1 ? randomInt(0, gridSize - length) : randomInt(0, gridSize - 1);

    const path = Array.from({ length }, (_, i) => ({
      row: startRow + dir.dy * i,
      col: startCol + dir.dx * i,
    }));

    const letters = backwards ? [...entry.phonemes].reverse() : entry.phonemes;

    if (canPlace(cells, path, letters, dir.orientation)) {
      path.forEach((pos, i) => {
        cells[pos.row][pos.col].symbol = letters[i];
        cells[pos.row][pos.col].orientations.add(dir.orientation);
      });
      return path;
    }
  }

  return null;
}

function canPlace(
  cells: GridCell[][],
  path: { row: number; col: number }[],
  letters: string[],
  orientation: Orientation
): boolean {
  for (let i = 0; i < path.length; i++) {
    const { row, col } = path[i];
    const cell = cells[row][col];
    if (cell.symbol === null) continue;
    if (cell.symbol !== letters[i]) return false;
    if (cell.orientations.has(orientation)) return false;
  }
  return true;
}
