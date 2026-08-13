import { WORD_LIST, PhonemeWordEntry, DEFAULT_SELECTED_ENTRY } from './phonemeData';
import { CellColor, deriveGameStatus } from './wordleLogic';
import { getCookie, setCookie } from './cookies';

const STORAGE_KEY = 'wordle_progress';

interface StoredSubmittedGuess {
  symbols: string[];
  colors: CellColor[];
}

interface StoredWordleState {
  selectedWords: string[]; // word strings only — phonemes looked up from WORD_LIST
  numGuesses: number;
  currentWordIndex: number;
  solvedCount: number;
  failedCount: number;
  hardMode: boolean;
  currentGuess: string[];
  submittedGuesses: StoredSubmittedGuess[];
}

export interface WordleGameState {
  selectedWords: PhonemeWordEntry[];
  numGuesses: number;
  currentWordIndex: number;
  solvedCount: number;
  failedCount: number;
  hardMode: boolean;
  currentGuess: string[];
  submittedGuesses: StoredSubmittedGuess[];
}

export function saveWordleState(state: WordleGameState) {
  const toStore: StoredWordleState = {
    selectedWords: state.selectedWords.map((w) => w.word),
    numGuesses: state.numGuesses,
    currentWordIndex: state.currentWordIndex,
    solvedCount: state.solvedCount,
    failedCount: state.failedCount,
    hardMode: state.hardMode,
    currentGuess: state.currentGuess,
    submittedGuesses: state.submittedGuesses,
  };
  try {
    setCookie(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // Cookie write can fail (size limits, private browsing) — fail silently;
    // the app just falls back to defaults on next load.
  }
}

function loadWordleState(): WordleGameState | null {
  const raw = getCookie(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: StoredWordleState = JSON.parse(raw);
    const selectedWords = parsed.selectedWords
      .map((word) => WORD_LIST.find((w) => w.word === word))
      .filter((w): w is PhonemeWordEntry => Boolean(w));

    if (selectedWords.length === 0) return null;

    return {
      selectedWords,
      numGuesses: parsed.numGuesses,
      currentWordIndex: Math.min(parsed.currentWordIndex, selectedWords.length - 1),
      solvedCount: parsed.solvedCount,
      failedCount: parsed.failedCount,
      hardMode: parsed.hardMode,
      currentGuess: parsed.currentGuess ?? [],
      submittedGuesses: parsed.submittedGuesses ?? [],
    };
  } catch {
    return null;
  }
}

// Falls back to sensible defaults ("blank", word 1, no progress) if there's
// no saved cookie, or it fails to parse.
export function getInitialWordleState(): WordleGameState {
  return (
    loadWordleState() ?? {
      selectedWords: [DEFAULT_SELECTED_ENTRY],
      numGuesses: 6,
      currentWordIndex: 0,
      solvedCount: 0,
      failedCount: 0,
      hardMode: false,
      currentGuess: [],
      submittedGuesses: [],
    }
  );
}

export { deriveGameStatus }; // re-exported for convenience where this module is already imported
