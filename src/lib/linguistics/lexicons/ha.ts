/**
 * ha.ts — Hausa lexicon (Afro-Asiatic, Chadic branch)
 *
 * Entry format: { word: string; phones: string[] }
 * Phones use IPA. Hausa has L/H tone contrast — rhyme matching ignores tone.
 * Ejectives: ƙ → /k'/, ƴ → /j'/, ɗ → /ɗ/.
 * Vowel length: long vowels encoded as 'aː', 'iː', 'uː'.
 * ~120 entries covering core vocabulary for suggestRhymes().
 */

export interface LexiconEntry {
  word: string;
  phones: string[];
}

export const haLexicon: LexiconEntry[] = [
  // ─── Core (original 40) ────────────────────────────────────────────────────
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
  // ─── Extended: emotions, social, lyric vocabulary ─────────────────────────
  { word: 'ƙauna',      phones: ['k', 'aː', 'u', 'n', 'a'] },   // love
  { word: 'farin ciki', phones: ['f', 'a', 'r', 'i', 'n', 'tʃ', 'i', 'k', 'i'] }, // happiness
  { word: 'baƙin ciki', phones: ['b', 'a', 'k', 'i', 'n', 'tʃ', 'i', 'k', 'i'] }, // sadness
  { word: 'tsananin',   phones: ['ts', 'a', 'n', 'a', 'n', 'i', 'n'] }, // intense
  { word: 'rai',        phones: ['r', 'aː', 'i'] },               // life
  { word: 'mutuwa',     phones: ['m', 'u', 't', 'u', 'w', 'a'] }, // death
  { word: 'Allah',      phones: ['a', 'l', 'l', 'a', 'h'] },     // God
  { word: 'addua',      phones: ['a', 'd', 'd', 'u', 'a'] },     // prayer
  { word: 'yanci',      phones: ['j', 'a', 'n', 'tʃ', 'i'] },    // freedom
  { word: 'zaman',      phones: ['z', 'a', 'm', 'a', 'n'] },     // peace / life
  { word: 'aiki',       phones: ['a', 'i', 'k', 'i'] },          // work
  { word: 'makaranta',  phones: ['m', 'a', 'k', 'a', 'r', 'a', 'n', 't', 'a'] }, // school
  { word: 'gari',       phones: ['g', 'a', 'r', 'i'] },          // town
  { word: 'hanya',      phones: ['h', 'a', 'n', 'j', 'a'] },     // road / way
  { word: 'rana',       phones: ['r', 'a', 'n', 'a'] },          // sun / day
  { word: 'dare',       phones: ['d', 'a', 'r', 'e'] },          // night (alt)
  { word: 'ruwa',       phones: ['r', 'u', 'w', 'a'] },          // rain / water
  { word: 'iska',       phones: ['i', 's', 'k', 'a'] },          // wind
  { word: 'kogi',       phones: ['k', 'o', 'g', 'i'] },          // river
  { word: 'daji',       phones: ['d', 'a', 'dʒ', 'i'] },         // bush / forest
  { word: 'dutsen',     phones: ['d', 'u', 'ts', 'e', 'n'] },    // mountain
  { word: 'sarki',      phones: ['s', 'a', 'r', 'k', 'i'] },     // king
  { word: 'sarauniya',  phones: ['s', 'a', 'r', 'a', 'u', 'n', 'i', 'j', 'a'] }, // queen
  { word: 'yara',       phones: ['j', 'a', 'r', 'a'] },          // children
  { word: 'mata',       phones: ['m', 'a', 't', 'a'] },          // woman / wife
  { word: 'miji',       phones: ['m', 'i', 'dʒ', 'i'] },         // husband
  { word: 'uwa',        phones: ['u', 'w', 'a'] },               // mother
  { word: 'uba',        phones: ['u', 'b', 'a'] },               // father
  { word: 'aboki',      phones: ['a', 'b', 'o', 'k', 'i'] },     // friend
  { word: 'gari',       phones: ['g', 'a', 'r', 'i'] },          // flour / town
  { word: 'nono',       phones: ['n', 'o', 'n', 'o'] },          // milk
  { word: 'zuma',       phones: ['z', 'u', 'm', 'a'] },          // honey
  { word: 'mana',       phones: ['m', 'a', 'n', 'a'] },          // for us
  { word: 'kana',       phones: ['k', 'a', 'n', 'a'] },          // you are (m)
  { word: 'tana',       phones: ['t', 'a', 'n', 'a'] },          // she is
  { word: 'suna',       phones: ['s', 'u', 'n', 'a'] },          // they are
  { word: 'ina',        phones: ['i', 'n', 'a'] },               // I am / where
  { word: 'daga',       phones: ['d', 'a', 'g', 'a'] },          // from
  { word: 'cikin',      phones: ['tʃ', 'i', 'k', 'i', 'n'] },    // inside
  { word: 'kusa',       phones: ['k', 'u', 's', 'a'] },          // near
  { word: 'nesa',       phones: ['n', 'e', 's', 'a'] },          // far
  { word: 'koda',       phones: ['k', 'o', 'd', 'a'] },          // even if
  { word: 'tunda',      phones: ['t', 'u', 'n', 'd', 'a'] },     // since
  // ─── Rhyme-rich for -a / -i / -u / -e / -o endings ─────────────────────
  { word: 'baka',  phones: ['b', 'a', 'k', 'a'] },
  { word: 'fata',  phones: ['f', 'a', 't', 'a'] },
  { word: 'gara',  phones: ['g', 'a', 'r', 'a'] },
  { word: 'haka',  phones: ['h', 'a', 'k', 'a'] },
  { word: 'kaki',  phones: ['k', 'a', 'k', 'i'] },
  { word: 'limi',  phones: ['l', 'i', 'm', 'i'] },
  { word: 'nini',  phones: ['n', 'i', 'n', 'i'] },
  { word: 'sani',  phones: ['s', 'a', 'n', 'i'] },
  { word: 'tafi',  phones: ['t', 'a', 'f', 'i'] },
  { word: 'waje',  phones: ['w', 'a', 'dʒ', 'e'] },
  { word: 'sake',  phones: ['s', 'a', 'k', 'e'] },
  { word: 'bude',  phones: ['b', 'u', 'd', 'e'] },
  { word: 'kose',  phones: ['k', 'o', 's', 'e'] },
  { word: 'gobe',  phones: ['g', 'o', 'b', 'e'] },
  { word: 'zuwa',  phones: ['z', 'u', 'w', 'a'] },
  { word: 'tuba',  phones: ['t', 'u', 'b', 'a'] },
  { word: 'namu',  phones: ['n', 'a', 'm', 'u'] },
  { word: 'bamu',  phones: ['b', 'a', 'm', 'u'] },
];
