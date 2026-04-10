/**
 * mi.ts — Mina / Gen lexicon (Kwa, Gbe branch, SIL: gej, Togo / Bénin)
 *
 * Internal LID code: 'mi' (short alias); canonical: 'gej'.
 * Entry format: { word: string; phones: string[] }
 * Gen/Mina (Gengèbé) is closely related to Ewe; tonal (H/L).
 * Labio-velars kp / gb encoded as digraph phones.
 * ~120 entries covering core vocabulary for suggestRhymes().
 */

export interface LexiconEntry {
  word: string;
  phones: string[];
}

export const miLexicon: LexiconEntry[] = [
  // ─── Core vocabulary ───────────────────────────────────────────────────────
  { word: 'amɛ',     phones: ['a', 'm', 'ɛ'] },                // person
  { word: 'xɔ',      phones: ['x', 'ɔ'] },                     // house
  { word: 'tsi',     phones: ['t', 's', 'i'] },                // water
  { word: 'dze',     phones: ['dz', 'e'] },                    // day
  { word: 'ati',     phones: ['a', 't', 'i'] },                // tree
  { word: 'ta',      phones: ['t', 'a'] },                     // head
  { word: 'to',      phones: ['t', 'o'] },                     // ear
  { word: 'nu',      phones: ['n', 'u'] },                     // mouth / thing
  { word: 'ŋku',     phones: ['ŋ', 'k', 'u'] },                // eye
  { word: 'kpɔ',    phones: ['kp', 'ɔ'] },                    // see / look
  { word: 'gblɔ',   phones: ['gb', 'l', 'ɔ'] },               // say
  { word: 'fɔ',     phones: ['f', 'ɔ'] },                     // beat
  { word: 'wɔ',     phones: ['w', 'ɔ'] },                     // do
  { word: 'yi',     phones: ['j', 'i'] },                     // go
  { word: 'va',     phones: ['v', 'a'] },                     // come
  { word: 'da',     phones: ['d', 'a'] },                     // lie down / snake
  { word: 'dzo',    phones: ['dz', 'o'] },                    // fire
  { word: 'ha',     phones: ['h', 'a'] },                     // song / sing
  { word: 'se',     phones: ['s', 'e'] },                     // hear
  { word: 'nya',    phones: ['n', 'j', 'a'] },                // know
  { word: 'nɔ',     phones: ['n', 'ɔ'] },                     // stay
  { word: 'ɖu',     phones: ['d', 'u'] },                     // eat
  { word: 'kpe',    phones: ['k', 'p', 'e'] },                // stone / add
  { word: 'ƒo',     phones: ['f', 'o'] },                     // beat (drum)
  { word: 'nɔvi',   phones: ['n', 'ɔ', 'v', 'i'] },           // sibling
  { word: 'lɔlɔ',   phones: ['l', 'ɔ', 'l', 'ɔ'] },           // love
  { word: 'ŋkɔ',    phones: ['ŋ', 'k', 'ɔ'] },                // name
  { word: 'zã',     phones: ['z', 'a'] },                     // night
  { word: 'agble',  phones: ['a', 'g', 'b', 'l', 'e'] },      // farm
  { word: 'susu',   phones: ['s', 'u', 's', 'u'] },           // thought
  // ─── Extended vocabulary ─────────────────────────────────────────────────
  { word: 'aƒe',     phones: ['a', 'f', 'e'] },               // home
  { word: 'dɔwɔ',   phones: ['d', 'ɔ', 'w', 'ɔ'] },           // work
  { word: 'alesi',   phones: ['a', 'l', 'e', 's', 'i'] },     // like / as
  { word: 'eŋu',    phones: ['e', 'ŋ', 'u'] },                // with it
  { word: 'esia',   phones: ['e', 's', 'i', 'a'] },           // this
  { word: 'edzi',   phones: ['e', 'dz', 'i'] },               // above
  { word: 'mele',   phones: ['m', 'e', 'l', 'e'] },           // I am
  { word: 'kpekpe', phones: ['kp', 'e', 'kp', 'e'] },         // help
  { word: 'ŋkeke',  phones: ['ŋ', 'k', 'e', 'k', 'e'] },      // day (unit)
  { word: 'afɔ',    phones: ['a', 'f', 'ɔ'] },                // foot
  { word: 'gbɔ',    phones: ['gb', 'ɔ'] },                    // voice
  { word: 'ʋu',     phones: ['v', 'u'] },                     // open
  { word: 'trɔ',    phones: ['t', 'r', 'ɔ'] },                // turn
  { word: 'ɖo',     phones: ['d', 'o'] },                     // put
  { word: 'tsɔ',    phones: ['ts', 'ɔ'] },                    // take
  { word: 'xexe',   phones: ['x', 'e', 'x', 'e'] },           // big
  { word: 'ŋutɔ',   phones: ['ŋ', 'u', 't', 'ɔ'] },           // self
  { word: 'kuku',   phones: ['k', 'u', 'k', 'u'] },           // death
  { word: 'taɖo',   phones: ['t', 'a', 'd', 'o'] },           // truth
  { word: 'anyigba',phones: ['a', 'n', 'j', 'i', 'g', 'b', 'a'] }, // earth
  { word: 'dziƒe',  phones: ['dz', 'i', 'f', 'e'] },          // heaven
  { word: 'tso',    phones: ['ts', 'o'] },                    // from
  { word: 'le',     phones: ['l', 'e'] },                     // be at
  { word: 'kple',   phones: ['k', 'p', 'l', 'e'] },           // with (conj)
  { word: 'eye',    phones: ['e', 'j', 'e'] },                // and (conj)
  { word: 'hafi',   phones: ['h', 'a', 'f', 'i'] },           // before / until
  { word: 'loo',    phones: ['l', 'o'] },                     // discourse particle
  { word: 'vɔvɔ',   phones: ['v', 'ɔ', 'v', 'ɔ'] },           // different
  { word: 'ŋɔ',     phones: ['ŋ', 'ɔ'] },                     // want
  { word: 'be',     phones: ['b', 'e'] },                     // say (quotative)
  // ─── Rhyme-rich monosyllables ────────────────────────────────────────────
  { word: 'mi',  phones: ['m', 'i'] },
  { word: 'fi',  phones: ['f', 'i'] },
  { word: 'li',  phones: ['l', 'i'] },
  { word: 'vi',  phones: ['v', 'i'] },
  { word: 'si',  phones: ['s', 'i'] },
  { word: 'me',  phones: ['m', 'e'] },
  { word: 'le',  phones: ['l', 'e'] },
  { word: 'ge',  phones: ['g', 'e'] },
  { word: 'ne',  phones: ['n', 'e'] },
  { word: 'ze',  phones: ['z', 'e'] },
  { word: 'ma',  phones: ['m', 'a'] },
  { word: 'la',  phones: ['l', 'a'] },
  { word: 'na',  phones: ['n', 'a'] },
  { word: 'ga',  phones: ['g', 'a'] },
  { word: 'za',  phones: ['z', 'a'] },
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
  { word: 'kɔ',  phones: ['k', 'ɔ'] },
  { word: 'tɔ',  phones: ['t', 'ɔ'] },
  { word: 'fɔ',  phones: ['f', 'ɔ'] },
  { word: 'zɔ',  phones: ['z', 'ɔ'] },
];
