export interface Cell {
  row: number;
  col: number;
}

function cellsEqual(a: Cell[], b: Cell[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((c, i) => c.row === b[i].row && c.col === b[i].col);
}

// Checks the dragged cell path against every placed word's own cell path
// (stored in phoneme order, not spatial/drag order). Matches in either
// direction along the same line. Words already found are skipped.
export function matchDragToWord(
  dragPath: Cell[],
  wordPhonemeCells: Record<string, Cell[]>,
  foundWords: Set<string>
): string | null {
  if (dragPath.length < 2) return null;
  const reversedDrag = [...dragPath].reverse();

  for (const [word, cells] of Object.entries(wordPhonemeCells)) {
    if (foundWords.has(word)) continue;
    if (cells.length !== dragPath.length) continue;
    if (cellsEqual(cells, dragPath) || cellsEqual(cells, reversedDrag)) {
      return word;
    }
  }
  return null;
}
