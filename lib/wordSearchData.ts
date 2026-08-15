export const GRID_SIZE_WORD_COUNTS: Record<number, number> = {
  8: 6,
  10: 8,
  12: 10,
  15: 12,
};

export const GREAT_WORD_POSITIONS: Record<number, { row: number; startCol: number }> = {
  8: { row: 4, startCol: 3 },
  10: { row: 5, startCol: 4 },
  12: { row: 6, startCol: 5 },
  15: { row: 7, startCol: 6 },
};

export function getWordCountForGridSize(gridSize: number): number {
  return GRID_SIZE_WORD_COUNTS[gridSize] ?? 8; // fallback, shouldn't normally be hit
}
