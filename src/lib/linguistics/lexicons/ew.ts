/**
 * ew.ts — Ewe lexicon (Kwa, Gbe branch, Ghana / Togo / Bénin)
 *
 * Entry format: { word: string; phones: string[] }
 * Ewe is tonal (H/L/M + downstep) — tones not encoded as phone tokens.
 * Labio-velars kp / gb are encoded as digraph phones 'kp' / 'gb'.
 * Nasal vowels: Ṽ encoded as plain V.
 * ~120 entries covering core vocabulary for suggestRhymes().
 */

export interface LexiconEntry {
  word: string;
  phones: string[];
}

export const ewLexicon: LexiconEntry[] = [
  // ─── Core vocabulary ───────────────────────────────────────────────────────
  { word: 'amé',      phones: ['a', 'm', 'e'] },
  { word: 'xɔ',       phones: ['x', 'ɔ'] },
  { word: 'tsi',      phones: ['t', 's', 'i'] },
  { word: 'afi',      phones: ['a', 'f', 'i'] },
  { word: 'dze',      phones: ['dz', 'e'] },
  { word: 'zã',       phones: ['z', 'a'] },
  { word: 'agble',    phones: ['a', 'g', 'b', 'l', 'e'] },
  { word: 'ati',      phones: ['a', 't', 'i'] },
  { word: 'anyigba',  phones: ['a', 'n', 'j', 'i', 'g', 'b', 'a'] },
  { word: 'dziƒe',    phones: ['dz', 'i', 'f', 'e'] },
  { word: 'gbagbe',   phones: ['gb', 'a', 'gb', 'e'] },
  { word: 'nɔvi',     phones: ['n', 'ɔ', 'v', 'i'] },
  { word: 'da',       phones: ['d', 'a'] },
  { word: 'ko',       phones: ['k', 'o'] },
  { word: 'ŋku',      phones: ['ŋ', 'k', 'u'] },
  { word: 'ta',       phones: ['t', 'a'] },
  { word: 'to',       phones: ['t', 'o'] },
  { word: 'nu',       phones: ['n', 'u'] },
  { word: 'lã',       phones: ['l', 'a'] },
  { word: 'ƒu',       phones: ['f', 'u'] },
  { word: 'kpɔ',      phones: ['kp', 'ɔ'] },
  { word: 'klõ',      phones: ['k', 'l', 'o'] },
  { word: 'gblɔ',     phones: ['gb', 'l', 'ɔ'] },
  { word: 'fɔ',       phones: ['f', 'ɔ'] },
  { word: 'wɔ',       phones: ['w', 'ɔ'] },
  { word: 'yi',       phones: ['j', 'i'] },
  { word: 'va',       phones: ['v', 'a'] },
  { word: 'dzo',      phones: ['dz', 'o'] },
  { word: 'hã',       phones: ['h', 'a'] },
  { word: 'agbadza',  phones: ['a', 'gb', 'a', 'dz', 'a'] },
  { word: 'ha',       phones: ['h', 'a'] },
  { word: 'taɖo',     phones: ['t', 'a', 'd', 'o'] },
  { word: 'lɔlɔ̃',    phones: ['l', 'ɔ', 'l', 'ɔ'] },
  { word: 'ŋutɔ',     phones: ['ŋ', 'u', 't', 'ɔ'] },
  { word: 'kuku',     phones: ['k', 'u', 'k', 'u'] },
  { word: 'gbɔ',      phones: ['gb', 'ɔ'] },
  { word: 'se',       phones: ['s', 'e'] },
  { word: 'nya',      phones: ['n', 'j', 'a'] },
  { word: 'ŋlɔ',      phones: ['ŋ', 'l', 'ɔ'] },
  { word: 'xexe',     phones: ['x', 'e', 'x', 'e'] },
  // ─── Extended vocabulary ──────────────────────────────────────────────────
  { word: 'aƒe',      phones: ['a', 'f', 'e'] },               // home
  { word: 'ŋɔ',       phones: ['ŋ', 'ɔ'] },                    // want
  { word: 'vɔ',       phones: ['v', 'ɔ'] },                    // finish
  { word: 'ɖo',       phones: ['d', 'o'] },                    // put
  { word: 'ɖe',       phones: ['d', 'e'] },                    // be at
  { word: 'trɔ',      phones: ['t', 'r', 'ɔ'] },              // turn / change
  { word: 'ƒle',      phones: ['f', 'l', 'e'] },               // buy
  { word: 'ɖu',       phones: ['d', 'u'] },                    // eat
  { word: 'nɔ',       phones: ['n', 'ɔ'] },                    // stay
  { word: 'ƒo',       phones: ['f', 'o'] },                    // beat (drum)
  { word: 'kpe',      phones: ['k', 'p', 'e'] },               // stone
  { word: 'tsɔ',      phones: ['ts', 'ɔ'] },                   // take
  { word: 'ɖu ƒu',   phones: ['d', 'u', 'f', 'u'] },          // eat food
  { word: 'dɔwɔ',    phones: ['d', 'ɔ', 'w', 'ɔ'] },          // work
  { word: 'alesi',    phones: ['a', 'l', 'e', 's', 'i'] },     // like / as
  { word: 'eŋu',      phones: ['e', 'ŋ', 'u'] },               // with it
  { word: 'esia',     phones: ['e', 's', 'i', 'a'] },          // this
  { word: 'elɔla',    phones: ['e', 'l', 'ɔ', 'l', 'a'] },    // tomorrow
  { word: 'edzi',     phones: ['e', 'dz', 'i'] },              // above
  { word: 'eƒe',      phones: ['e', 'f', 'e'] },               // his/her
  { word: 'mele',     phones: ['m', 'e', 'l', 'e'] },          // I am
  { word: 'medo',     phones: ['m', 'e', 'd', 'o'] },          // I want
  { word: 'ame',      phones: ['a', 'm', 'e'] },               // person (alt)
  { word: 'kpekpe',   phones: ['kp', 'e', 'kp', 'e'] },        // help
  { word: 'gbɔgblɔ', phones: ['gb', 'ɔ', 'gb', 'l', 'ɔ'] },   // speak
  { word: 'ŋkeke',    phones: ['ŋ', 'k', 'e', 'k', 'e'] },     // day (time unit)
  { word: 'zikpi',    phones: ['z', 'i', 'k', 'p', 'i'] },     // yesterday
  { word: 'afɔ',      phones: ['a', 'f', 'ɔ'] },               // foot
  { word: 'ʋu',       phones: ['v', 'u'] },                    // open
  { word: 'ʋo',       phones: ['v', 'o'] },                    // empty
  { word: 'susu',     phones: ['s', 'u', 's', 'u'] },          // thought
  { word: 'siwo',     phones: ['s', 'i', 'w', 'o'] },          // they (rel)
  { word: 'ŋkɔ',      phones: ['ŋ', 'k', 'ɔ'] },               // name
  { word: 'ʋeʋe',     phones: ['v', 'e', 'v', 'e'] },          // poverty
  { word: 'didimɔ',   phones: ['d', 'i', 'd', 'i', 'm', 'ɔ'] }, // deep (thought)
  // ─── Rhyme-rich monosyllables ────────────────────────────────────────────
  { word: 'mi',  phones: ['m', 'i'] },
  { word: 'fi',  phones: ['f', 'i'] },
  { word: 'li',  phones: ['l', 'i'] },
  { word: 'vi',  phones: ['v', 'i'] },
  { word: 'si',  phones: ['s', 'i'] },
  { word: 'me',  phones: ['m', 'e'] },
  { word: 'be',  phones: ['b', 'e'] },
  { word: 'le',  phones: ['l', 'e'] },
  { word: 'ge',  phones: ['g', 'e'] },
  { word: 'ze',  phones: ['z', 'e'] },
  { word: 'ne',  phones: ['n', 'e'] },
  { word: 'ma',  phones: ['m', 'a'] },
  { word: 'la',  phones: ['l', 'a'] },
  { word: 'na',  phones: ['n', 'a'] },
  { word: 'za',  phones: ['z', 'a'] },
  { word: 'ga',  phones: ['g', 'a'] },
  { word: 'lo',  phones: ['l', 'o'] },
  { word: 'no',  phones: ['n', 'o'] },
  { word: 'zo',  phones: ['z', 'o'] },
  { word: 'go',  phones: ['g', 'o'] },
  { word: 'mu',  phones: ['m', 'u'] },
  { word: 'ku',  phones: ['k', 'u'] },
  { word: 'lu',  phones: ['l', 'u'] },
  { word: 'zu',  phones: ['z', 'u'] },
  { word: 'mɔ',  phones: ['m', 'ɔ'] },
  { word: 'lɔ',  phones: ['l', 'ɔ'] },
  { word: 'nɔ',  phones: ['n', 'ɔ'] },
  { word: 'zɔ',  phones: ['z', 'ɔ'] },
  { word: 'kɔ',  phones: ['k', 'ɔ'] },
  { word: 'tɔ',  phones: ['t', 'ɔ'] },
];
