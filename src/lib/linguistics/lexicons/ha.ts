/**
 * ha.ts — Hausa lexicon (Afro-Asiatic, Chadic branch)
 *
 * Entry format: { word: string; phones: string[] }
 * Phones use IPA. Tones encoded inline via diacritics on vowels
 * (not as separate phone tokens) — Hausa has L/H tone contrast but
 * rhyme matching ignores tone by default.
 *
 * Vowel length: long vowels duplicated (e.g. 'aː' → 'a a').
 * Hausa phoneme set: labials b/f/m, coronals d/t/n/s/z, velars k/g,
 * palatals tʃ/dʒ, pharyngeal h/ʔ, rhotic r, lateral l, semivowels w/j.
 */

export interface LexiconEntry {
  word: string;
  phones: string[];
}

export const haLexicon: LexiconEntry[] = [
  // greetings / common
  { word: 'sannu',      phones: ['s', 'a', 'n', 'n', 'u'] },
  { word: 'nagode',     phones: ['n', 'a', 'g', 'o', 'd', 'e'] },
  { word: 'lafiya',     phones: ['l', 'a', 'f', 'i', 'j', 'a'] },
  { word: 'gida',       phones: ['g', 'i', 'd', 'a'] },
  { word: 'ruwa',       phones: ['r', 'u', 'w', 'a'] },
  { word: 'wuta',       phones: ['w', 'u', 't', 'a'] },
  { word: 'mutum',      phones: ['m', 'u', 't', 'u', 'm'] },
  { word: 'yaro',       phones: ['j', 'a', 'r', 'o'] },
  { word: 'yarinya',    phones: ['j', 'a', 'r', 'i', 'n', 'j', 'a'] },
  { word: 'abinci',     phones: ['a', 'b', 'i', 'n', 'tʃ', 'i'] },
  { word: 'kifi',       phones: ['k', 'i', 'f', 'i'] },
  { word: 'nama',       phones: ['n', 'a', 'm', 'a'] },
  { word: 'doki',       phones: ['d', 'o', 'k', 'i'] },
  { word: 'zomo',       phones: ['z', 'o', 'm', 'o'] },
  { word: 'kare',       phones: ['k', 'a', 'r', 'e'] },
  { word: 'kaza',       phones: ['k', 'a', 'z', 'a'] },
  { word: 'rama',       phones: ['r', 'a', 'm', 'a'] },
  { word: 'gona',       phones: ['g', 'o', 'n', 'a'] },
  { word: 'kasuwa',     phones: ['k', 'a', 's', 'u', 'w', 'a'] },
  { word: 'tafiya',     phones: ['t', 'a', 'f', 'i', 'j', 'a'] },
  { word: 'waƙa',       phones: ['w', 'a', 'k', 'a'] },
  { word: 'rawa',       phones: ['r', 'a', 'w', 'a'] },
  { word: 'murya',      phones: ['m', 'u', 'r', 'j', 'a'] },
  { word: 'zuciya',     phones: ['z', 'u', 'tʃ', 'i', 'j', 'a'] },
  { word: 'ƙarfi',      phones: ['k', 'a', 'r', 'f', 'i'] },
  { word: 'bege',       phones: ['b', 'e', 'g', 'e'] },
  { word: 'dare',       phones: ['d', 'a', 'r', 'e'] },
  { word: 'rana',       phones: ['r', 'a', 'n', 'a'] },
  { word: 'dare',       phones: ['d', 'a', 'r', 'e'] },
  { word: 'tsoro',      phones: ['ts', 'o', 'r', 'o'] },
  { word: 'farin ciki', phones: ['f', 'a', 'r', 'i', 'n', 'tʃ', 'i', 'k', 'i'] },
  { word: 'hikima',     phones: ['h', 'i', 'k', 'i', 'm', 'a'] },
  { word: 'birni',      phones: ['b', 'i', 'r', 'n', 'i'] },
  { word: 'ƙasa',       phones: ['k', 'a', 's', 'a'] },
  { word: 'sama',       phones: ['s', 'a', 'm', 'a'] },
  { word: 'teku',       phones: ['t', 'e', 'k', 'u'] },
  { word: 'dawa',       phones: ['d', 'a', 'w', 'a'] },
  { word: 'ciyawa',     phones: ['tʃ', 'i', 'j', 'a', 'w', 'a'] },
  { word: 'itace',      phones: ['i', 't', 'a', 'tʃ', 'e'] },
  { word: 'dutse',      phones: ['d', 'u', 'ts', 'e'] },
];
