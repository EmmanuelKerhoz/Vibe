/**
 * mi.ts — Mina / Gen (Gbe branch, Togo / Bénin)
 *
 * Mina (also called Gɛn) is closely related to Ewe but treated as
 * a distinct sociolinguistic variety for Vibe's rhyme routing.
 * IPA conventions follow the Ewe lexicon (ew.ts).
 */

export interface LexiconEntry {
  word: string;
  phones: string[];
}

export const miLexicon: LexiconEntry[] = [
  { word: 'mɔ',       phones: ['m', 'ɔ'] },                    // road
  { word: 'xɔ',       phones: ['x', 'ɔ'] },                    // house
  { word: 'tsi',      phones: ['t', 's', 'i'] },               // water
  { word: 'afi',      phones: ['a', 'f', 'i'] },               // fire
  { word: 'amé',      phones: ['a', 'm', 'e'] },               // person
  { word: 'ati',      phones: ['a', 't', 'i'] },               // tree
  { word: 'dze',      phones: ['dz', 'e'] },                   // day
  { word: 'zã',       phones: ['z', 'a'] },                    // night
  { word: 'ta',       phones: ['t', 'a'] },                    // head
  { word: 'nu',       phones: ['n', 'u'] },                    // thing
  { word: 'nɔvi',     phones: ['n', 'ɔ', 'v', 'i'] },          // sibling
  { word: 'ŋku',      phones: ['ŋ', 'k', 'u'] },               // eye
  { word: 'to',       phones: ['t', 'o'] },                    // ear
  { word: 'lã',       phones: ['l', 'a'] },                    // tongue
  { word: 'yi',       phones: ['j', 'i'] },                    // go
  { word: 'va',       phones: ['v', 'a'] },                    // come
  { word: 'hã',       phones: ['h', 'a'] },                    // sing
  { word: 'ha',       phones: ['h', 'a'] },                    // song
  { word: 'wɔ',       phones: ['w', 'ɔ'] },                    // do
  { word: 'kpɔ',      phones: ['kp', 'ɔ'] },                   // see
  { word: 'se',       phones: ['s', 'e'] },                    // hear
  { word: 'nya',      phones: ['n', 'j', 'a'] },               // know
  { word: 'gbɔ',      phones: ['gb', 'ɔ'] },                   // voice
  { word: 'lɔlɔ̃',    phones: ['l', 'ɔ', 'l', 'ɔ'] },          // love
  { word: 'taɖo',     phones: ['t', 'a', 'd', 'o'] },          // truth
  { word: 'ŋutɔ',     phones: ['ŋ', 'u', 't', 'ɔ'] },          // self
  { word: 'kuku',     phones: ['k', 'u', 'k', 'u'] },          // death
  { word: 'anyigba',  phones: ['a', 'n', 'j', 'i', 'g', 'b', 'a'] }, // earth
  { word: 'dziƒe',    phones: ['dz', 'i', 'f', 'e'] },         // sky
  { word: 'agble',    phones: ['a', 'g', 'b', 'l', 'e'] },     // farm
  { word: 'sika',     phones: ['s', 'i', 'k', 'a'] },          // money
  { word: 'ƒu',       phones: ['f', 'u'] },                    // body
  { word: 'da',       phones: ['d', 'a'] },                    // snake
  { word: 'gblɔ',     phones: ['gb', 'l', 'ɔ'] },              // say
  { word: 'dzo',      phones: ['dz', 'o'] },                   // fire
  { word: 'fɔ',       phones: ['f', 'ɔ'] },                    // beat
  { word: 'agbadza',  phones: ['a', 'gb', 'a', 'dz', 'a'] },   // dance
  { word: 'xexe',     phones: ['x', 'e', 'x', 'e'] },         // big
  { word: 'klõ',      phones: ['k', 'l', 'o'] },               // write
  { word: 'ŋlɔ',      phones: ['ŋ', 'l', 'ɔ'] },              // open
];
