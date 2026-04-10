/**
 * ew.ts — Ewe lexicon (Kwa, Gbe branch, Ghana / Togo / Bénin)
 *
 * Entry format: { word: string; phones: string[] }
 * Ewe is tonal (H/L/M + downstep) — tones not encoded as phone tokens.
 * Labio-velars kp / gb are encoded as digraph phones 'kp' / 'gb'.
 * Nasal vowels: Ṽ encoded as plain V (rhyme matching does not
 * distinguish oral/nasal at this stage).
 */

export interface LexiconEntry {
  word: string;
  phones: string[];
}

export const ewLexicon: LexiconEntry[] = [
  { word: 'amé',      phones: ['a', 'm', 'e'] },               // person
  { word: 'xɔ',       phones: ['x', 'ɔ'] },                    // house
  { word: 'tsi',      phones: ['t', 's', 'i'] },               // water
  { word: 'afi',      phones: ['a', 'f', 'i'] },               // fire
  { word: 'dze',      phones: ['dz', 'e'] },                   // day
  { word: 'zã',       phones: ['z', 'a'] },                    // night
  { word: 'agble',    phones: ['a', 'g', 'b', 'l', 'e'] },     // farm
  { word: 'ati',      phones: ['a', 't', 'i'] },               // tree
  { word: 'anyigba',  phones: ['a', 'n', 'j', 'i', 'g', 'b', 'a'] }, // earth
  { word: 'dziƒe',    phones: ['dz', 'i', 'f', 'e'] },         // sky / heaven
  { word: 'gbagbe',   phones: ['gb', 'a', 'gb', 'e'] },        // forget
  { word: 'nɔvi',     phones: ['n', 'ɔ', 'v', 'i'] },          // sibling
  { word: 'da',       phones: ['d', 'a'] },                    // snake
  { word: 'ko',       phones: ['k', 'o'] },                    // only
  { word: 'ŋku',      phones: ['ŋ', 'k', 'u'] },               // eye
  { word: 'ta',       phones: ['t', 'a'] },                    // head
  { word: 'to',       phones: ['t', 'o'] },                    // ear
  { word: 'nu',       phones: ['n', 'u'] },                    // thing / mouth
  { word: 'lã',       phones: ['l', 'a'] },                    // tongue
  { word: 'ƒu',       phones: ['f', 'u'] },                    // body
  { word: 'kpɔ',      phones: ['kp', 'ɔ'] },                   // look
  { word: 'klõ',      phones: ['k', 'l', 'o'] },               // write
  { word: 'gblɔ',     phones: ['gb', 'l', 'ɔ'] },              // say
  { word: 'fɔ',       phones: ['f', 'ɔ'] },                    // beat
  { word: 'wɔ',       phones: ['w', 'ɔ'] },                    // do
  { word: 'yi',       phones: ['j', 'i'] },                    // go
  { word: 'va',       phones: ['v', 'a'] },                    // come
  { word: 'dzo',      phones: ['dz', 'o'] },                   // fire (alt)
  { word: 'hã',       phones: ['h', 'a'] },                    // sing
  { word: 'agbadza',  phones: ['a', 'gb', 'a', 'dz', 'a'] },   // dance (drum)
  { word: 'ha',       phones: ['h', 'a'] },                    // song
  { word: 'taɖo',     phones: ['t', 'a', 'd', 'o'] },          // truth
  { word: 'lɔlɔ̃',    phones: ['l', 'ɔ', 'l', 'ɔ'] },          // love
  { word: 'ŋutɔ',     phones: ['ŋ', 'u', 't', 'ɔ'] },          // self
  { word: 'kuku',     phones: ['k', 'u', 'k', 'u'] },          // death
  { word: 'gbɔ',      phones: ['gb', 'ɔ'] },                   // voice
  { word: 'se',       phones: ['s', 'e'] },                    // hear
  { word: 'nya',      phones: ['n', 'j', 'a'] },               // know
  { word: 'ŋlɔ',      phones: ['ŋ', 'l', 'ɔ'] },              // open
  { word: 'xexe',     phones: ['x', 'e', 'x', 'e'] },         // big
];
