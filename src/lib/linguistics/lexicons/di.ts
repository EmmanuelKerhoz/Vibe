/**
 * di.ts — Dioula / Jula lexicon (Mande, Côte d'Ivoire / Burkina Faso / Mali)
 *
 * Dioula is the dominant vehicular language of western Côte d'Ivoire
 * and the commercial lingua franca of the Abidjan region.
 * It is mutually intelligible with Bambara (bm) and Mandinka (mnk).
 *
 * Phonology notes:
 * - Tonal language (H/L); tones not encoded as phone tokens.
 * - Nasal consonants m, n, ŋ are syllabic in initial position.
 * - Long vowels duplicated (aa, ii, uu, ee, oo, ɛɛ, ɔɔ).
 * - No voiced obstruents in coda position.
 */

export interface LexiconEntry {
  word: string;
  phones: string[];
}

export const diLexicon: LexiconEntry[] = [
  // core vocabulary
  { word: 'mɔgɔ',    phones: ['m', 'ɔ', 'g', 'ɔ'] },          // person
  { word: 'so',       phones: ['s', 'o'] },                    // house
  { word: 'ji',       phones: ['dʒ', 'i'] },                   // water
  { word: 'tɛ',       phones: ['t', 'ɛ'] },                    // fire
  { word: 'wulu',     phones: ['w', 'u', 'l', 'u'] },          // dog
  { word: 'cɛ',       phones: ['tʃ', 'ɛ'] },                   // man
  { word: 'muso',     phones: ['m', 'u', 's', 'o'] },          // woman
  { word: 'den',      phones: ['d', 'e', 'n'] },               // child
  { word: 'fa',       phones: ['f', 'a'] },                    // father
  { word: 'ba',       phones: ['b', 'a'] },                    // mother
  { word: 'kɔ',       phones: ['k', 'ɔ'] },                    // back
  { word: 'tulo',     phones: ['t', 'u', 'l', 'o'] },          // ear
  { word: 'ɲɛ',       phones: ['ɲ', 'ɛ'] },                    // eye
  { word: 'da',       phones: ['d', 'a'] },                    // mouth
  { word: 'kelen',    phones: ['k', 'e', 'l', 'e', 'n'] },     // one
  { word: 'fila',     phones: ['f', 'i', 'l', 'a'] },          // two
  { word: 'saba',     phones: ['s', 'a', 'b', 'a'] },          // three
  { word: 'naani',    phones: ['n', 'a', 'n', 'i'] },          // four
  { word: 'duuru',    phones: ['d', 'u', 'r', 'u'] },          // five
  // nature
  { word: 'tile',     phones: ['t', 'i', 'l', 'e'] },          // sun / day
  { word: 'su',       phones: ['s', 'u'] },                    // night
  { word: 'sanu',     phones: ['s', 'a', 'n', 'u'] },          // gold
  { word: 'fɛn',      phones: ['f', 'ɛ', 'n'] },               // thing
  { word: 'jɛ',       phones: ['dʒ', 'ɛ'] },                   // river
  { word: 'kulu',     phones: ['k', 'u', 'l', 'u'] },          // mountain / hill
  { word: 'sɛgɛ',     phones: ['s', 'ɛ', 'g', 'ɛ'] },          // tree branch
  { word: 'sogo',     phones: ['s', 'o', 'g', 'o'] },          // meat / animal
  { word: 'kɔnɔ',     phones: ['k', 'ɔ', 'n', 'ɔ'] },          // bird
  { word: 'yiriba',   phones: ['j', 'i', 'r', 'i', 'b', 'a'] }, // big tree
  // music / art
  { word: 'fɔli',     phones: ['f', 'ɔ', 'l', 'i'] },          // song / speech
  { word: 'dunun',    phones: ['d', 'u', 'n', 'u', 'n'] },      // bass drum
  { word: 'balafon',  phones: ['b', 'a', 'l', 'a', 'f', 'ɔ', 'n'] }, // xylophone
  { word: 'jeliya',   phones: ['dʒ', 'e', 'l', 'i', 'j', 'a'] }, // griot art
  { word: 'donkili',  phones: ['d', 'ɔ', 'ŋ', 'k', 'i', 'l', 'i'] }, // song
  // abstract
  { word: 'dɔnniya',  phones: ['d', 'ɔ', 'n', 'n', 'i', 'j', 'a'] }, // knowledge
  { word: 'segin',    phones: ['s', 'e', 'g', 'i', 'n'] },      // return
  { word: 'taara',    phones: ['t', 'a', 'r', 'a'] },           // left / gone
  { word: 'kɛ',       phones: ['k', 'ɛ'] },                    // do
  { word: 'bɛ',       phones: ['b', 'ɛ'] },                    // be (present)
  { word: 'tɛ',       phones: ['t', 'ɛ'] },                    // not
];
