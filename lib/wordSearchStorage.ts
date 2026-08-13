import { WORD_LIST, PhonemeWordEntry, DEFAULT_SELECTED_ENTRY } from './phonemeData';
import { getCookie, setCookie } from './cookies';

const STORAGE_KEY = 'wordsearch_progress';
const DEFAULT_GRID_SIZE = 10;

interface StoredWordSearchState {
  selectedWords: string[];
  gridSize: number;
  scrollY: number;
}

export interface WordSearchState {
  selectedWords: PhonemeWordEntry[];
  gridSize: number;
  scrollY: number;
}

export function saveWordSearchState(state: WordSearchState) {
  const toStore: StoredWordSearchState = {
    selectedWords: state.selectedWords.map((w) => w.word),
    gridSize: state.gridSize,
    scrollY: state.scrollY,
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

    return {
      selectedWords,
      gridSize: parsed.gridSize ?? DEFAULT_GRID_SIZE,
      scrollY: parsed.scrollY ?? 0,
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
    }
  );
}
