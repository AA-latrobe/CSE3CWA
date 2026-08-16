export interface PhonemeWordEntry {
  word: string;
  phonemes: string[]; // 3–5 phonemes, unpadded
}

export const PREVIEW_TITLE_PHONEMES = ['w', 'ɜː', 'd', 'ə', 'l']; // "wordle" in phoneme form

// From HCE_Wordle_Phoneme_Corpus.docx — 12 rows x 4 cols, some cells unused
export const KEYPAD_GRID: string[][] = [
  ['p', 't', 'k', ''],
  ['b', 'd', 'g', ''],
  ['n', 'm', 'ŋ', ''],
  ['f', 's', 'θ', 'ʃ'],
  ['v', 'z', 'ð', 'ʒ'],
  ['l', 'ɹ', 'w', 'j'],
  ['h', 'tʃ', 'dʒ', ''],
  ['iː', 'ɪ', 'e', 'eː'],
  ['æ', 'ɐ', 'ɐː', 'ɜː'],
  ['ʉː', 'ɔ', 'oː', 'ʊ'],
  ['æɪ', 'ɑe', 'oɪ', 'əʉ'],
  ['æɔ', 'ɪə', '', 'ə'],
];

// Top 6 rows / bottom 6 rows — the two halves of the split keypad
export const KEYPAD_TOP = KEYPAD_GRID.slice(0, 6);
export const KEYPAD_BOTTOM = KEYPAD_GRID.slice(6);

export const KEYPAD_LEFT = KEYPAD_GRID.slice(0, 7);
export const KEYPAD_RIGHT = KEYPAD_GRID.slice(7);

export const MAX_PHONEME_SLOTS = 5;

const RAW_WORD_LIST: PhonemeWordEntry[] = [
  // 3-phoneme list
  { word: 'bed', phonemes: ['b', 'e', 'd'] },
  { word: 'bid', phonemes: ['b', 'ɪ', 'd'] },
  { word: 'bad', phonemes: ['b', 'æ', 'd'] },
  { word: 'bud', phonemes: ['b', 'ɐ', 'd'] },
  { word: 'bird', phonemes: ['b', 'ɜː', 'd'] },
  { word: 'bark', phonemes: ['b', 'ɐː', 'k'] },
  { word: 'book', phonemes: ['b', 'ʊ', 'k'] },
  { word: 'boot', phonemes: ['b', 'ʉː', 't'] },
  { word: 'boat', phonemes: ['b', 'əʉ', 't'] },
  { word: 'bike', phonemes: ['b', 'ɑe', 'k'] },
  { word: 'bait', phonemes: ['b', 'æɪ', 't'] },
  { word: 'boil', phonemes: ['b', 'oɪ', 'l'] },
  { word: 'beard', phonemes: ['b', 'ɪə', 'd'] },
  { word: 'choice', phonemes: ['tʃ', 'oɪ', 's'] },
  { word: 'thin', phonemes: ['θ', 'ɪ', 'n'] },
  { word: 'then', phonemes: ['ð', 'e', 'n'] },
  { word: 'ship', phonemes: ['ʃ', 'ɪ', 'p'] },
  { word: 'chin', phonemes: ['tʃ', 'ɪ', 'n'] },
  { word: 'jam', phonemes: ['dʒ', 'æ', 'm'] },
  { word: 'yes', phonemes: ['j', 'e', 's'] },
  { word: 'win', phonemes: ['w', 'ɪ', 'n'] },
  { word: 'ring', phonemes: ['ɹ', 'ɪ', 'ŋ'] },
  { word: 'log', phonemes: ['l', 'ɔ', 'ɡ'] },
  { word: 'fan', phonemes: ['f', 'æ', 'n'] },
  { word: 'van', phonemes: ['v', 'æ', 'n'] },
  { word: 'sun', phonemes: ['s', 'ɐ', 'n'] },
  { word: 'zip', phonemes: ['z', 'ɪ', 'p'] },
  { word: 'gum', phonemes: ['ɡ', 'ɐ', 'm'] },
  { word: 'hat', phonemes: ['h', 'æ', 't'] },
  { word: 'fork', phonemes: ['f', 'oː', 'k'] },

  // 4-phoneme list
  { word: 'stop', phonemes: ['s', 't', 'ɔ', 'p'] },
  { word: 'frog', phonemes: ['f', 'ɹ', 'ɔ', 'ɡ'] },
  { word: 'clap', phonemes: ['k', 'l', 'æ', 'p'] },
  { word: 'slip', phonemes: ['s', 'l', 'ɪ', 'p'] },
  { word: 'drum', phonemes: ['d', 'ɹ', 'ɐ', 'm'] },
  { word: 'grin', phonemes: ['ɡ', 'ɹ', 'ɪ', 'n'] },
  { word: 'train', phonemes: ['t', 'ɹ', 'æɪ', 'n'] },
  { word: 'cloud', phonemes: ['k', 'l', 'æɔ', 'd'] },
  { word: 'snake', phonemes: ['s', 'n', 'æɪ', 'k'] },
  { word: 'smile', phonemes: ['s', 'm', 'ɑe', 'l'] },
  { word: 'milk', phonemes: ['m', 'ɪ', 'l', 'k'] },
  { word: 'hand', phonemes: ['h', 'æ', 'n', 'd'] },
  { word: 'tent', phonemes: ['t', 'e', 'n', 't'] },
  { word: 'jump', phonemes: ['dʒ', 'ɐ', 'm', 'p'] },
  { word: 'lamp', phonemes: ['l', 'æ', 'm', 'p'] },
  { word: 'bank', phonemes: ['b', 'æ', 'ŋ', 'k'] },
  { word: 'frame', phonemes: ['f', 'ɹ', 'æɪ', 'm'] },
  { word: 'cold', phonemes: ['k', 'əʉ', 'l', 'd'] },
  { word: 'wind', phonemes: ['w', 'ɪ', 'n', 'd'] },
  { word: 'soft', phonemes: ['s', 'ɔ', 'f', 't'] },
  { word: 'gift', phonemes: ['ɡ', 'ɪ', 'f', 't'] },
  { word: 'desk', phonemes: ['d', 'e', 's', 'k'] },
  { word: 'left', phonemes: ['l', 'e', 'f', 't'] },
  { word: 'pond', phonemes: ['p', 'ɔ', 'n', 'd'] },
  { word: 'golf', phonemes: ['ɡ', 'ɔ', 'l', 'f'] },
  { word: 'silk', phonemes: ['s', 'ɪ', 'l', 'k'] },
  { word: 'great', phonemes: ['g', 'ɹ', 'æɪ', 't'] },
  { word: 'crab', phonemes: ['k', 'ɹ', 'æ', 'b'] },
  { word: 'plug', phonemes: ['p', 'l', 'ɐ', 'ɡ'] },
  { word: 'quiz', phonemes: ['k', 'w', 'ɪ', 'z'] },

  // 5-phoneme list
  { word: 'stamp', phonemes: ['s', 't', 'æ', 'm', 'p'] },
  { word: 'plant', phonemes: ['p', 'l', 'æ', 'n', 't'] },
  { word: 'blank', phonemes: ['b', 'l', 'æ', 'ŋ', 'k'] },
  { word: 'grand', phonemes: ['ɡ', 'ɹ', 'æ', 'n', 'd'] },
  { word: 'clamp', phonemes: ['k', 'l', 'æ', 'm', 'p'] },
  { word: 'twist', phonemes: ['t', 'w', 'ɪ', 's', 't'] },
  { word: 'trust', phonemes: ['t', 'ɹ', 'ɐ', 's', 't'] },
  { word: 'drink', phonemes: ['d', 'ɹ', 'ɪ', 'ŋ', 'k'] },
  { word: 'brisk', phonemes: ['b', 'ɹ', 'ɪ', 's', 'k'] },
  { word: 'shrimp', phonemes: ['ʃ', 'ɹ', 'ɪ', 'm', 'p'] },
  { word: 'scrap', phonemes: ['s', 'k', 'ɹ', 'æ', 'p'] },
  { word: 'scribe', phonemes: ['s', 'k', 'ɹ', 'ɑe', 'b'] },
  { word: 'scream', phonemes: ['s', 'k', 'ɹ', 'iː', 'm'] },
  { word: 'splash', phonemes: ['s', 'p', 'l', 'æ', 'ʃ'] },
  { word: 'spring', phonemes: ['s', 'p', 'ɹ', 'ɪ', 'ŋ'] },
  { word: 'strap', phonemes: ['s', 't', 'ɹ', 'æ', 'p'] },
  { word: 'street', phonemes: ['s', 't', 'ɹ', 'iː', 't'] },
  { word: 'scrub', phonemes: ['s', 'k', 'ɹ', 'ɐ', 'b'] },
  { word: 'flask', phonemes: ['f', 'l', 'ɐː', 's', 'k'] },
  { word: 'clasp', phonemes: ['k', 'l', 'ɐː', 's', 'p'] },
  { word: 'cleft', phonemes: ['k', 'l', 'e', 'f', 't'] },
  { word: 'glint', phonemes: ['ɡ', 'l', 'ɪ', 'n', 't'] },
  { word: 'blend', phonemes: ['b', 'l', 'e', 'n', 'd'] },
  { word: 'strain', phonemes: ['s', 't', 'ɹ', 'æɪ', 'n'] },
  { word: 'thrust', phonemes: ['θ', 'ɹ', 'ɐ', 's', 't'] },
  { word: 'sprawl', phonemes: ['s', 'p', 'ɹ', 'oː', 'l'] },
  { word: 'scrawl', phonemes: ['s', 'k', 'ɹ', 'oː', 'l'] },
  { word: 'sprig', phonemes: ['s', 'p', 'ɹ', 'ɪ', 'ɡ'] },
  { word: 'sprout', phonemes: ['s', 'p', 'ɹ', 'æɔ', 't'] },
  { word: 'smoked', phonemes: ['s', 'm', 'əʉ', 'k', 't'] },
];

export const WORD_LIST: PhonemeWordEntry[] = [...RAW_WORD_LIST].sort((a, b) =>
  a.word.localeCompare(b.word)
);

export const DEFAULT_SELECTED_WORD = 'blank';

export const DEFAULT_SELECTED_ENTRY: PhonemeWordEntry = WORD_LIST.find(
  (w) => w.word === DEFAULT_SELECTED_WORD
)!;

const PHONEME_EXAMPLES: Record<string, string> = {
  'p': 'Pit, Pin, taP',
  't': 'Ten, Tap, caT',
  'k': 'Kit, Cat, saCK',
  'b': 'Bat, Bed, ruBBer',
  'd': 'Dog, Dig, aDD',
  'g': 'Go, Get, eGG',
  'n': 'No, Net, peN',
  'm': 'Man, Map, haMMer',
  'ŋ': 'siNG, riNG, thiNK',
  'f': 'Fan, Fox, Phone',
  's': 'Sun, See, ciTy',
  'θ': 'THin, THink, THrough (Voiceless)',
  'ʃ': 'SHip, SHe, Chef',
  'v': 'Van, Very, haVe',
  'z': 'Zoo, haS, buZZ',
  'ð': 'THis, THem, fæTHer (Voiced)',
  'ʒ': 'meaSUre, viSIon, caSUal',
  'l': 'Lamp, Leg, baLL',
  'ɹ': 'Run, Red, Write',
  'w': 'Wet, Win, What',
  'j': 'Yes, You, Use',
  'h': 'Hat, Hot, Who',
  'tʃ': 'CHip, CHurch, caTCH',
  'dʒ': 'Judge, Jet, caGe',
  'iː': 'sEE, bEAD, flEEce (Long)',
  'ɪ': 'bId, kIt, sIt (Short)',
  'e': 'bEd, drEss, mEn (Short)',
  'eː': 'bAREd, squARE, chAIR (Long)',
  'æ': 'bAd, trAp, cAt (Short)',
  'ɐ': 'bUd, strUt, cUt (Short)',
  'ɐː': 'bARd, stAR, fAther (Long)',
  'ɜː': 'bIRd, nURse, hER (Long)',
  'ʉː': 'bOOed, gOOse, twO (Long)',
  'ɔ': 'bOd, gOt, lOt (Short)',
  'oː': 'bOARd, thOUGHt, mORE (Long)',
  'ʊ': 'gOOd, fOOt, pUt (Short)',
  'æɪ': 'bAY, fAce, rAIn',
  'ɑe': 'bUY, prIce, lIGHt',
  'oɪ': 'bOY, chOIce, cOIn',
  'əʉ': 'bOW (ribbon), gOAt, nO',
  'æɔ': 'bOUGH, mOUth, cOW',
  'ɪə': 'bEER, nEAR, hEAR',
  'ə': 'Above, commA, lettER (The Unstressed "Schwa")',
};

export function getPhonemeHoverText(symbol: string): string {
  const examples = PHONEME_EXAMPLES[symbol];
  return examples ? `/${symbol}/  ${examples}` : `/${symbol}/`;
}
