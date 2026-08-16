import { WORD_LIST, PhonemeWordEntry, DEFAULT_SELECTED_ENTRY } from './phonemeData';
import { getCookie, setCookie } from './cookies';
import { PlacedWord } from './wordSearchGenerator';

const STORAGE_KEY = 'wordsearch_progress';
const DEFAULT_GRID_SIZE = 10;

interface StoredCell {
  row: number;
  col: number;
}
interface StoredPlacedWord {
  word: string;
  cells: StoredCell[];
}

interface StoredWordSearchState {
  selectedWords: string[];
  gridSize: number;
  scrollY: number;
  revealWords: boolean;
  placedGrid: (string | null)[][] | null;
  placedWords: StoredPlacedWord[];
  foundWords: string[];
}

export interface WordSearchState {
  selectedWords: PhonemeWordEntry[];
  gridSize: number;
  scrollY: number;
  revealWords: boolean;
  placedGrid: (string | null)[][] | null;
  placedWords: PlacedWord[];
  foundWords: string[];
}

export function saveWordSearchState(state: WordSearchState) {
  const toStore: StoredWordSearchState = {
    selectedWords: state.selectedWords.map((w) => w.word),
    gridSize: state.gridSize,
    scrollY: state.scrollY,
    revealWords: state.revealWords,
    placedGrid: state.placedGrid,
    placedWords: state.placedWords,
    foundWords: state.foundWords,
  };
  try {
    setCookie(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // fail silently
  }
}

function loadWordSearchState(): WordSearchState | null {
  const raw = getCookie(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: StoredWordSearchState = JSON.parse(raw);
    const selectedWords = parsed.selectedWords
      .map((word) => WORD_LIST.find((w) => w.word === word))
      .filter((w): w is PhonemeWordEntry => Boolean(w));

    if (selectedWords.length === 0) return null;

    // Defensive check: a saved grid whose dimensions don't match gridSize
    // (e.g. cookie from a previous app version) is treated as absent,
    // rather than risking a mismatched restore.
    const gridSize = parsed.gridSize ?? DEFAULT_GRID_SIZE;
    const placedGrid =
      parsed.placedGrid && parsed.placedGrid.length === gridSize && parsed.placedGrid[0]?.length === gridSize
        ? parsed.placedGrid
        : null;
    const placedWords = placedGrid ? parsed.placedWords ?? [] : [];
    const foundWords = placedGrid ? parsed.foundWords ?? [] : [];

    return {
      selectedWords,
      gridSize,
      scrollY: parsed.scrollY ?? 0,
      revealWords: parsed.revealWords ?? false,
      placedGrid,
      placedWords,
      foundWords,
    };
  } catch {
    return null;
  }
}

export function getInitialWordSearchState(): WordSearchState {
  return (
    loadWordSearchState() ?? {
      selectedWords: [DEFAULT_SELECTED_ENTRY],
      gridSize: DEFAULT_GRID_SIZE,
      scrollY: 0,
      revealWords: false,
      placedGrid: null,
      placedWords: [],
      foundWords: [],
    }
  );
}
