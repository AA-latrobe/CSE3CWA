export const GRID_SIZE_WORD_COUNTS: Record<number, number> = {
  8: 6,
  10: 8,
  12: 10,
  15: 12,
};

export function getWordCountForGridSize(gridSize: number): number {
  return GRID_SIZE_WORD_COUNTS[gridSize] ?? 8; // fallback, shouldn't normally be hit
}
