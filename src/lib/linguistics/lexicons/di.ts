/**
 * di.ts — Dioula lexicon (Mande family, ISO 639-3: dyu, Côte d'Ivoire / Mali)
 *
 * Internal LID code: 'di' (short alias); canonical: 'dyu'.
 * Entry format: { word: string; phones: string[] }
 * Dioula is a tonal Mande language (H/L), SVO word order.
 * Unlike KWA languages: no labio-velars, no ATR harmony.
 * Phoneme set: bilabials b/m, coronals d/t/n/s/z, velars k/g, liquids l/r,
 * semivowels w/j, pharyngeal h. Prenasalized stops: mb, nd, ng, nj.
 * ~120 entries covering core vocabulary for suggestRhymes().
 */

export interface LexiconEntry {
  word: string;
  phones: string[];
}

export const diLexicon: LexiconEntry[] = [
  // ─── Core vocabulary ───────────────────────────────────────────────────────
  { word: 'mɔgɔ',     phones: ['m', 'ɔ', 'g', 'ɔ'] },          // person
  { word: 'so',       phones: ['s', 'o'] },                     // house
  { word: 'ji',       phones: ['dʒ', 'i'] },                    // water
  { word: 'tasuma',   phones: ['t', 'a', 's', 'u', 'm', 'a'] }, // fire
  { word: 'tile',     phones: ['t', 'i', 'l', 'e'] },           // sun / day
  { word: 'su',       phones: ['s', 'u'] },                     // night
  { word: 'duguw',    phones: ['d', 'u', 'g', 'u', 'w'] },      // village
  { word: 'sira',     phones: ['s', 'i', 'r', 'a'] },           // road / way
  { word: 'baji',     phones: ['b', 'a', 'dʒ', 'i'] },          // river
  { word: 'seli',     phones: ['s', 'e', 'l', 'i'] },           // tree (forest)
  { word: 'kun',      phones: ['k', 'u', 'n'] },                // head
  { word: 'yɛlɛ',    phones: ['j', 'ɛ', 'l', 'ɛ'] },           // eye
  { word: 'da',       phones: ['d', 'a'] },                     // mouth
  { word: 'tulo',     phones: ['t', 'u', 'l', 'o'] },           // ear
  { word: 'bolo',     phones: ['b', 'o', 'l', 'o'] },           // hand / arm
  { word: 'sɛ',       phones: ['s', 'ɛ'] },                     // foot
  { word: 'dɔgɔ',    phones: ['d', 'ɔ', 'g', 'ɔ'] },           // younger sibling
  { word: 'kɔrɔ',    phones: ['k', 'ɔ', 'r', 'ɔ'] },           // older sibling
  { word: 'ba',       phones: ['b', 'a'] },                     // mother
  { word: 'fa',       phones: ['f', 'a'] },                     // father
  { word: 'den',      phones: ['d', 'e', 'n'] },                // child
  { word: 'cɛ',       phones: ['tʃ', 'ɛ'] },                    // man
  { word: 'musow',    phones: ['m', 'u', 's', 'o', 'w'] },      // woman
  { word: 'kɛ',       phones: ['k', 'ɛ'] },                     // do / make
  { word: 'taa',      phones: ['t', 'aː'] },                    // go
  { word: 'na',       phones: ['n', 'a'] },                     // come
  { word: 'sɔrɔ',    phones: ['s', 'ɔ', 'r', 'ɔ'] },           // get / find
  { word: 'dɔn',      phones: ['d', 'ɔ', 'n'] },                // know / be in
  { word: 'fɔ',       phones: ['f', 'ɔ'] },                     // say
  { word: 'kɔnɔ',    phones: ['k', 'ɔ', 'n', 'ɔ'] },           // heart / inside
  // ─── Extended: lyric, emotional, cultural vocabulary ─────────────────────
  { word: 'lanaya',   phones: ['l', 'a', 'n', 'a', 'j', 'a'] }, // love (formal)
  { word: 'siran',    phones: ['s', 'i', 'r', 'a', 'n'] },      // beauty
  { word: 'diya',     phones: ['d', 'i', 'j', 'a'] },           // sweetness / joy
  { word: 'dusu',     phones: ['d', 'u', 's', 'u'] },           // heart (seat of emotion)
  { word: 'fɛnw',    phones: ['f', 'ɛ', 'n', 'w'] },           // things
  { word: 'baara',    phones: ['b', 'aː', 'r', 'a'] },          // work
  { word: 'dɔnkili',  phones: ['d', 'ɔ', 'n', 'k', 'i', 'l', 'i'] }, // song
  { word: 'donkilili', phones: ['d', 'o', 'n', 'k', 'i', 'l', 'i', 'l', 'i'] }, // music
  { word: 'foli',     phones: ['f', 'o', 'l', 'i'] },           // prayer / greet
  { word: 'sabari',   phones: ['s', 'a', 'b', 'a', 'r', 'i'] }, // patience
  { word: 'hine',     phones: ['h', 'i', 'n', 'e'] },           // compassion
  { word: 'sɔn',      phones: ['s', 'ɔ', 'n'] },                // agree / accept
  { word: 'wuli',     phones: ['w', 'u', 'l', 'i'] },           // wake up / rise
  { word: 'sigi',     phones: ['s', 'i', 'g', 'i'] },           // sit / settle
  { word: 'bila',     phones: ['b', 'i', 'l', 'a'] },           // leave / release
  { word: 'bɛ',       phones: ['b', 'ɛ'] },                     // is (present)
  { word: 'tun',      phones: ['t', 'u', 'n'] },                // was (past)
  { word: 'bina',     phones: ['b', 'i', 'n', 'a'] },           // will (future)
  { word: 'ni',       phones: ['n', 'i'] },                     // if / and
  { word: 'ko',       phones: ['k', 'o'] },                     // say (quotative) / thing
  { word: 'ka',       phones: ['k', 'a'] },                     // to (infinitive)
  { word: 'la',       phones: ['l', 'a'] },                     // locative
  { word: 'maa',      phones: ['m', 'aː'] },                    // person (generic)
  { word: 'min',      phones: ['m', 'i', 'n'] },                // which / drink
  { word: 'kulu',     phones: ['k', 'u', 'l', 'u'] },           // group / all
  { word: 'bɛɛ',     phones: ['b', 'ɛː'] },                    // all / every
  { word: 'suu',      phones: ['s', 'uː'] },                    // soul / spirit
  { word: 'wari',     phones: ['w', 'a', 'r', 'i'] },           // money
  { word: 'fanga',    phones: ['f', 'a', 'ŋ', 'g', 'a'] },      // power
  { word: 'kele',     phones: ['k', 'e', 'l', 'e'] },           // war / fight
  { word: 'hɛrɛ',    phones: ['h', 'ɛ', 'r', 'ɛ'] },           // peace
  { word: 'nɔgɔ',    phones: ['n', 'ɔ', 'g', 'ɔ'] },           // easy
  { word: 'gɛlɛn',   phones: ['g', 'ɛ', 'l', 'ɛ', 'n'] },      // difficult
  { word: 'nɛgɛ',    phones: ['n', 'ɛ', 'g', 'ɛ'] },           // iron / metal
  { word: 'nyɔgɔn',  phones: ['n', 'j', 'ɔ', 'g', 'ɔ', 'n'] }, // each other
  { word: 'kɔlɔsi',  phones: ['k', 'ɔ', 'l', 'ɔ', 's', 'i'] }, // free / independent
  // ─── Rhyme-rich endings ──────────────────────────────────────────────────
  { word: 'mi',   phones: ['m', 'i'] },
  { word: 'ti',   phones: ['t', 'i'] },
  { word: 'si',   phones: ['s', 'i'] },
  { word: 'li',   phones: ['l', 'i'] },
  { word: 'bi',   phones: ['b', 'i'] },
  { word: 'ki',   phones: ['k', 'i'] },
  { word: 'me',   phones: ['m', 'e'] },
  { word: 'le',   phones: ['l', 'e'] },
  { word: 'ke',   phones: ['k', 'e'] },
  { word: 'ne',   phones: ['n', 'e'] },
  { word: 'be',   phones: ['b', 'e'] },
  { word: 'se',   phones: ['s', 'e'] },
  { word: 'ma',   phones: ['m', 'a'] },
  { word: 'la',   phones: ['l', 'a'] },
  { word: 'na',   phones: ['n', 'a'] },
  { word: 'ba',   phones: ['b', 'a'] },
  { word: 'fa',   phones: ['f', 'a'] },
  { word: 'ka',   phones: ['k', 'a'] },
  { word: 'mo',   phones: ['m', 'o'] },
  { word: 'lo',   phones: ['l', 'o'] },
  { word: 'ko',   phones: ['k', 'o'] },
  { word: 'no',   phones: ['n', 'o'] },
  { word: 'bo',   phones: ['b', 'o'] },
  { word: 'so',   phones: ['s', 'o'] },
  { word: 'mu',   phones: ['m', 'u'] },
  { word: 'lu',   phones: ['l', 'u'] },
  { word: 'ku',   phones: ['k', 'u'] },
  { word: 'su',   phones: ['s', 'u'] },
  { word: 'bu',   phones: ['b', 'u'] },
  { word: 'mɛ',   phones: ['m', 'ɛ'] },
  { word: 'lɛ',   phones: ['l', 'ɛ'] },
  { word: 'kɛ',   phones: ['k', 'ɛ'] },
  { word: 'nɛ',   phones: ['n', 'ɛ'] },
  { word: 'bɛ',   phones: ['b', 'ɛ'] },
  { word: 'mɔ',   phones: ['m', 'ɔ'] },
  { word: 'lɔ',   phones: ['l', 'ɔ'] },
  { word: 'kɔ',   phones: ['k', 'ɔ'] },
  { word: 'nɔ',   phones: ['n', 'ɔ'] },
  { word: 'sɔ',   phones: ['s', 'ɔ'] },
  { word: 'fɔ',   phones: ['f', 'ɔ'] },
];
