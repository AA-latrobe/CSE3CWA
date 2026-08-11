export type WordSize = 3 | 4 | 5;

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

// "blank" from the 5-phoneme word list — default so preview is playable on load
export const DEFAULT_PHONEME_WORD = ['b', 'l', 'æ', 'ŋ', 'k'];
export const DEFAULT_ENGLISH_WORD = 'blank';
