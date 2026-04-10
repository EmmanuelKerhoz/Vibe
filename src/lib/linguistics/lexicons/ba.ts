/**
 * ba.ts — Baoulé lexicon (Kwa, Akan branch, Côte d'Ivoire)
 *
 * Entry format: { word: string; phones: string[] }
 * Baoulé is tonal (H/L/M) — tones not encoded as phone tokens;
 * rhyme matching operates on vowel/consonant skeleton.
 * ATR vowel harmony: +ATR set i e o u / -ATR set ɪ ɛ ɔ ʊ.
 * Nasals are syllabic in some positions (encoded as 'm'/'n'/'ŋ').
 * ~120 entries covering core vocabulary for suggestRhymes().
 */

export interface LexiconEntry {
  word: string;
  phones: string[];
}

export const baLexicon: LexiconEntry[] = [
  // ─── Core vocabulary ───────────────────────────────────────────────────────
  { word: 'akwaa',    phones: ['a', 'k', 'w', 'a'] },
  { word: 'awie',     phones: ['a', 'w', 'i', 'e'] },
  { word: 'alua',     phones: ['a', 'l', 'u', 'a'] },
  { word: 'obi',      phones: ['o', 'b', 'i'] },
  { word: 'ba',       phones: ['b', 'a'] },
  { word: 'ni',       phones: ['n', 'i'] },
  { word: 'si',       phones: ['s', 'i'] },
  { word: 'yako',     phones: ['j', 'a', 'k', 'o'] },
  { word: 'baa',      phones: ['b', 'a'] },
  { word: 'su',       phones: ['s', 'u'] },
  { word: 'klo',      phones: ['k', 'l', 'o'] },
  { word: 'like',     phones: ['l', 'i', 'k', 'e'] },
  { word: 'djwe',     phones: ['dʒ', 'w', 'e'] },
  { word: 'anwɛ',     phones: ['a', 'n', 'w', 'ɛ'] },
  { word: 'kpata',    phones: ['k', 'p', 'a', 't', 'a'] },
  { word: 'sran',     phones: ['s', 'r', 'a', 'n'] },
  { word: 'mɔ',       phones: ['m', 'ɔ'] },
  { word: 'kan',      phones: ['k', 'a', 'n'] },
  { word: 'wla',      phones: ['w', 'l', 'a'] },
  { word: 'blɛ',      phones: ['b', 'l', 'ɛ'] },
  { word: 'bo',       phones: ['b', 'o'] },
  { word: 'kua',      phones: ['k', 'u', 'a'] },
  { word: 'mɔli',     phones: ['m', 'ɔ', 'l', 'i'] },
  { word: 'yakpa',    phones: ['j', 'a', 'k', 'p', 'a'] },
  { word: 'ngble',    phones: ['ŋ', 'g', 'b', 'l', 'e'] },
  { word: 'dlɔ',      phones: ['d', 'l', 'ɔ'] },
  { word: 'owe',      phones: ['o', 'w', 'e'] },
  { word: 'blu',      phones: ['b', 'l', 'u'] },
  { word: 'fɛ',       phones: ['f', 'ɛ'] },
  { word: 'atin',     phones: ['a', 't', 'i', 'n'] },
  { word: 'sika',     phones: ['s', 'i', 'k', 'a'] },
  { word: 'bia',      phones: ['b', 'i', 'a'] },
  { word: 'kpe',      phones: ['k', 'p', 'e'] },
  { word: 'ago',      phones: ['a', 'g', 'o'] },
  { word: 'klama',    phones: ['k', 'l', 'a', 'm', 'a'] },
  { word: 'anyin',    phones: ['a', 'n', 'j', 'i', 'n'] },
  { word: 'asye',     phones: ['a', 's', 'j', 'e'] },
  // ─── Extended: emotions, nature, time, body ───────────────────────────────
  { word: 'fɔnvɔ',   phones: ['f', 'ɔ', 'n', 'v', 'ɔ'] },    // love
  { word: 'ayɛ',     phones: ['a', 'j', 'ɛ'] },               // joy
  { word: 'osun',    phones: ['o', 's', 'u', 'n'] },           // sadness
  { word: 'kpɔkpɔ', phones: ['k', 'p', 'ɔ', 'k', 'p', 'ɔ'] }, // strength
  { word: 'wɔ',      phones: ['w', 'ɔ'] },                    // do / make
  { word: 'ko',      phones: ['k', 'o'] },                    // build
  { word: 'bue',     phones: ['b', 'u', 'e'] },               // open
  { word: 'fle',     phones: ['f', 'l', 'e'] },               // buy
  { word: 'tɔ',      phones: ['t', 'ɔ'] },                    // fall
  { word: 'fa',      phones: ['f', 'a'] },                    // take
  { word: 'di',      phones: ['d', 'i'] },                    // eat
  { word: 'nuan',    phones: ['n', 'u', 'a', 'n'] },          // sweet
  { word: 'kɔkɔ',   phones: ['k', 'ɔ', 'k', 'ɔ'] },          // bitter
  { word: 'kpan',    phones: ['k', 'p', 'a', 'n'] },          // light (adj)
  { word: 'blu blu', phones: ['b', 'l', 'u', 'b', 'l', 'u'] }, // sky blue
  { word: 'vla',     phones: ['v', 'l', 'a'] },               // return
  { word: 'wla wla', phones: ['w', 'l', 'a', 'w', 'l', 'a'] }, // music
  { word: 'kua bo',  phones: ['k', 'u', 'a', 'b', 'o'] },     // work hard
  { word: 'tɔke',   phones: ['t', 'ɔ', 'k', 'e'] },          // secret
  { word: 'sebe',    phones: ['s', 'e', 'b', 'e'] },          // paper / book
  { word: 'klou',    phones: ['k', 'l', 'u'] },               // deep
  { word: 'nyru',    phones: ['n', 'j', 'r', 'u'] },          // beautiful
  { word: 'ɔli',     phones: ['ɔ', 'l', 'i'] },               // river
  { word: 'nan',     phones: ['n', 'a', 'n'] },               // breast / mother
  { word: 'papa',    phones: ['p', 'a', 'p', 'a'] },          // father
  { word: 'oya',     phones: ['o', 'j', 'a'] },               // leaf
  { word: 'klɔklɔ', phones: ['k', 'l', 'ɔ', 'k', 'l', 'ɔ'] }, // round
  { word: 'liɛ',    phones: ['l', 'i', 'ɛ'] },               // difficult
  { word: 'kpata',   phones: ['k', 'p', 'a', 't', 'a'] },     // mat
  { word: 'blo',     phones: ['b', 'l', 'o'] },               // say
  { word: 'titi',    phones: ['t', 'i', 't', 'i'] },          // always
  // ─── Rhyme-rich monosyllables ────────────────────────────────────────────
  { word: 'mi',  phones: ['m', 'i'] },
  { word: 'ti',  phones: ['t', 'i'] },
  { word: 'fi',  phones: ['f', 'i'] },
  { word: 'li',  phones: ['l', 'i'] },
  { word: 'vi',  phones: ['v', 'i'] },
  { word: 'me',  phones: ['m', 'e'] },
  { word: 'be',  phones: ['b', 'e'] },
  { word: 'le',  phones: ['l', 'e'] },
  { word: 'fe',  phones: ['f', 'e'] },
  { word: 'ke',  phones: ['k', 'e'] },
  { word: 'te',  phones: ['t', 'e'] },
  { word: 'ma',  phones: ['m', 'a'] },
  { word: 'ta',  phones: ['t', 'a'] },
  { word: 'la',  phones: ['l', 'a'] },
  { word: 'ka',  phones: ['k', 'a'] },
  { word: 'na',  phones: ['n', 'a'] },
  { word: 'wa',  phones: ['w', 'a'] },
  { word: 'mo',  phones: ['m', 'o'] },
  { word: 'lo',  phones: ['l', 'o'] },
  { word: 'wo',  phones: ['w', 'o'] },
  { word: 'no',  phones: ['n', 'o'] },
  { word: 'to',  phones: ['t', 'o'] },
  { word: 'mu',  phones: ['m', 'u'] },
  { word: 'tu',  phones: ['t', 'u'] },
  { word: 'ku',  phones: ['k', 'u'] },
  { word: 'lu',  phones: ['l', 'u'] },
  { word: 'nu',  phones: ['n', 'u'] },
  { word: 'fu',  phones: ['f', 'u'] },
  { word: 'mɛ',  phones: ['m', 'ɛ'] },
  { word: 'lɛ',  phones: ['l', 'ɛ'] },
  { word: 'kɛ',  phones: ['k', 'ɛ'] },
  { word: 'nɛ',  phones: ['n', 'ɛ'] },
  { word: 'wɛ',  phones: ['w', 'ɛ'] },
  { word: 'bɔ',  phones: ['b', 'ɔ'] },
  { word: 'lɔ',  phones: ['l', 'ɔ'] },
  { word: 'nɔ',  phones: ['n', 'ɔ'] },
  { word: 'fɔ',  phones: ['f', 'ɔ'] },
  { word: 'kɔ',  phones: ['k', 'ɔ'] },
  { word: 'sɔ',  phones: ['s', 'ɔ'] },
  { word: 'tɔ',  phones: ['t', 'ɔ'] },
];
