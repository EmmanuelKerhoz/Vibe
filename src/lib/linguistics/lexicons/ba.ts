/**
 * ba.ts — Baoulé lexicon (Kwa, Akan branch, Côte d'Ivoire)
 *
 * Entry format: { word: string; phones: string[] }
 * Baoulé is tonal (H/L/M) — tones not encoded as phone tokens;
 * rhyme matching operates on vowel/consonant skeleton.
 * ATR vowel harmony: +ATR set i e o u / -ATR set ɪ ɛ ɔ ʊ.
 * Nasals are syllabic in some positions (encoded as 'm'/'n'/'ŋ').
 */

export interface LexiconEntry {
  word: string;
  phones: string[];
}

export const baLexicon: LexiconEntry[] = [
  { word: 'akwaa',    phones: ['a', 'k', 'w', 'a'] },          // water
  { word: 'awie',     phones: ['a', 'w', 'i', 'e'] },           // house
  { word: 'alua',     phones: ['a', 'l', 'u', 'a'] },           // fire
  { word: 'obi',      phones: ['o', 'b', 'i'] },                // person
  { word: 'ba',       phones: ['b', 'a'] },                     // child
  { word: 'ni',       phones: ['n', 'i'] },                     // mother
  { word: 'si',       phones: ['s', 'i'] },                     // father
  { word: 'yako',     phones: ['j', 'a', 'k', 'o'] },          // man
  { word: 'baa',      phones: ['b', 'a'] },                     // woman
  { word: 'su',       phones: ['s', 'u'] },                     // name
  { word: 'klo',      phones: ['k', 'l', 'o'] },               // heart
  { word: 'like',     phones: ['l', 'i', 'k', 'e'] },          // eye
  { word: 'djwe',     phones: ['dʒ', 'w', 'e'] },              // tree
  { word: 'anwɛ',     phones: ['a', 'n', 'w', 'ɛ'] },          // leaf
  { word: 'kpata',    phones: ['k', 'p', 'a', 't', 'a'] },     // ground
  { word: 'sran',     phones: ['s', 'r', 'a', 'n'] },          // body
  { word: 'mɔ',       phones: ['m', 'ɔ'] },                    // thing
  { word: 'kan',      phones: ['k', 'a', 'n'] },               // word / language
  { word: 'wla',      phones: ['w', 'l', 'a'] },               // song
  { word: 'liké',     phones: ['l', 'i', 'k', 'e'] },          // light
  { word: 'blɛ',      phones: ['b', 'l', 'ɛ'] },               // day
  { word: 'bo',       phones: ['b', 'o'] },                     // night (context)
  { word: 'kua',      phones: ['k', 'u', 'a'] },               // work
  { word: 'mɔli',     phones: ['m', 'ɔ', 'l', 'i'] },          // road
  { word: 'su wɛ',    phones: ['s', 'u', 'w', 'ɛ'] },          // happiness
  { word: 'yakpa',    phones: ['j', 'a', 'k', 'p', 'a'] },     // power
  { word: 'ngble',    phones: ['ŋ', 'g', 'b', 'l', 'e'] },     // grass
  { word: 'dlɔ',      phones: ['d', 'l', 'ɔ'] },               // rain
  { word: 'owe',      phones: ['o', 'w', 'e'] },               // river
  { word: 'blu',      phones: ['b', 'l', 'u'] },               // sky
  { word: 'fɛ',       phones: ['f', 'ɛ'] },                    // wind
  { word: 'atin',     phones: ['a', 't', 'i', 'n'] },          // time
  { word: 'sika',     phones: ['s', 'i', 'k', 'a'] },          // gold / money
  { word: 'bia',      phones: ['b', 'i', 'a'] },               // pray
  { word: 'kpe',      phones: ['k', 'p', 'e'] },               // stone
  { word: 'ago',      phones: ['a', 'g', 'o'] },               // drum
  { word: 'klama',    phones: ['k', 'l', 'a', 'm', 'a'] },     // dance
  { word: 'wla wla',  phones: ['w', 'l', 'a', 'w', 'l', 'a'] }, // music
  { word: 'anyin',    phones: ['a', 'n', 'j', 'i', 'n'] },     // heaven
  { word: 'asye',     phones: ['a', 's', 'j', 'e'] },          // earth
];
