export const CONNECTOR_THICKNESS = 3;
export const CONNECTOR_OVERLAP = 3;

export interface ConnectorSegment {
  key: string;
  left: number;
  top: number;
  width: number;
  height: number;
  rotationDeg: number;
}

export interface Cell {
  row: number;
  col: number;
}

interface SolveLike {
  word: string;
  letterRevealed: boolean[];
}

// Builds one segment between each consecutive pair of cells in an ordered
// sequence — shared by word connectors, the "great" special-cell
// connectors, and the title demo's own connectors, so all three use
// identical geometry.
export function computeSegmentsForCellSequence(
  cells: Cell[],
  cellSize: number,
  gap: number,
  thickness: number = CONNECTOR_THICKNESS,
  overlap: number = CONNECTOR_OVERLAP,
  keyPrefix: string = 'seg'
): ConnectorSegment[] {
  const step = cellSize + gap;
  const segments: ConnectorSegment[] = [];

  for (let i = 0; i < cells.length - 1; i++) {
    const a = cells[i];
    const b = cells[i + 1];
    const dRow = b.row - a.row;
    const dCol = b.col - a.col;
    const key = `${keyPrefix}-${i}`;

    if (dRow === 0) {
      const leftCol = Math.min(a.col, b.col);
      const left = leftCol * step + cellSize - overlap;
      const top = a.row * step + cellSize / 2 - thickness / 2;
      segments.push({ key, left, top, width: gap + overlap * 2, height: thickness, rotationDeg: 0 });
    } else if (dCol === 0) {
      const topRow = Math.min(a.row, b.row);
      const top = topRow * step + cellSize - overlap;
      const left = a.col * step + cellSize / 2 - thickness / 2;
      segments.push({ key, left, top, width: thickness, height: gap + overlap * 2, rotationDeg: 0 });
    } else {
      const leftCol = Math.min(a.col, b.col);
      const topRow = Math.min(a.row, b.row);
      const gapLeft = leftCol * step + cellSize;
      const gapTop = topRow * step + cellSize;
      const centerX = gapLeft + gap / 2;
      const centerY = gapTop + gap / 2;
      const length = gap * Math.SQRT2 + overlap * 2;
      const sameSign = dRow * dCol > 0;
      const rotationDeg = sameSign ? 45 : -45;
      segments.push({
        key,
        left: centerX - length / 2,
        top: centerY - thickness / 2,
        width: length,
        height: thickness,
        rotationDeg,
      });
    }
  }

  return segments;
}

// Found-word connectors — same piggyback-on-existing-state visibility
// rule as before, now built from the shared sequence helper.
export function computeConnectorSegments(
  wordPhonemeCells: Record<string, Cell[]>,
  foundWords: Set<string>,
  solves: SolveLike[],
  cellSize: number,
  gap: number,
  thickness: number = CONNECTOR_THICKNESS,
  overlap: number = CONNECTOR_OVERLAP
): ConnectorSegment[] {
  const segments: ConnectorSegment[] = [];

  for (const [word, cells] of Object.entries(wordPhonemeCells)) {
    const isFound = foundWords.has(word);
    const solve = solves.find((s) => s.word === word);

    for (let i = 0; i < cells.length - 1; i++) {
      const visible = isFound || (solve ? solve.letterRevealed[i] && solve.letterRevealed[i + 1] : false);
      if (!visible) continue;
      segments.push(
        ...computeSegmentsForCellSequence([cells[i], cells[i + 1]], cellSize, gap, thickness, overlap, `${word}-${i}`)
      );
    }
  }

  return segments;
}
