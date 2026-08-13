import { WORD_LIST, PhonemeWordEntry, DEFAULT_SELECTED_ENTRY } from './phonemeData';
import { getCookie, setCookie } from './cookies';

const STORAGE_KEY = 'wordsearch_progress';

interface StoredWordSearchState {
  selectedWords: string[];
}

export interface WordSearchState {
  selectedWords: PhonemeWordEntry[];
}

export function saveWordSearchState(state: WordSearchState) {
  const toStore: StoredWordSearchState = {
    selectedWords: state.selectedWords.map((w) => w.word),
  };
  try {
    setCookie(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // fail silently — same fallback behavior as Wordle's storage
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
    return { selectedWords };
  } catch {
    return null;
  }
}

export function getInitialWordSearchState(): WordSearchState {
  return loadWordSearchState() ?? { selectedWords: [DEFAULT_SELECTED_ENTRY] };
}
