/**
 * id.ts — Indonesian lexicon (Austronesian, Malayo-Polynesian branch)
 *
 * Entry format: readonly [word, rnKey] — simple tuple format (like fr.ts / en.ts).
 * Indonesian is non-tonal with regular stress on penultimate syllable.
 * Phoneme set: labials p/b/m, coronals t/d/n/s/z/r/l, velars k/g/ŋ,
 * palatals tʃ/dʒ/j, glottal h/ʔ, semivowel w.
 * Final /-k/ often realised as glottal stop [ʔ].
 * rnKey = rhyme nucleus (last stressed vowel + coda if any).
 * ~120 entries for suggestRhymes().
 */

export const idLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ endings ──────────────────────────────────────────────────────────
  ['kita',     'a'],   // we (inclusive)
  ['ada',      'a'],   // exist / there is
  ['kata',     'a'],   // word / say
  ['cinta',    'a'],   // love
  ['mana',     'a'],   // where / which
  ['sama',     'a'],   // same / together
  ['suka',     'a'],   // like
  ['lupa',     'a'],   // forget
  ['nyata',    'a'],   // real
  ['biasa',    'a'],   // usual
  ['bisa',     'a'],   // can
  ['rasa',     'a'],   // feel / taste
  ['masa',     'a'],   // time / era
  ['jiwa',     'a'],   // soul
  ['dua',      'a'],   // two
  ['tiga',     'a'],   // three
  ['saja',     'a'],   // just / only
  ['juga',     'a'],   // also
  ['sana',     'a'],   // there
  ['sini',     'i'],   // here
  ['buka',     'a'],   // open
  ['luka',     'a'],   // wound
  ['duka',     'a'],   // sorrow
  ['suka',     'a'],   // joy / like
  ['muda',     'a'],   // young
  // ─── /i/ endings ──────────────────────────────────────────────────────────
  ['hati',     'i'],   // heart
  ['mati',     'i'],   // die
  ['nanti',    'i'],   // wait / later
  ['pasti',    'i'],   // certain
  ['lagi',     'i'],   // again
  ['tapi',     'i'],   // but
  ['kini',     'i'],   // now
  ['diri',     'i'],   // self
  ['beri',     'i'],   // give
  ['pergi',    'i'],   // go
  ['sunyi',    'i'],   // silent / lonely
  ['sendiri',  'i'],   // alone
  ['berani',   'i'],   // brave
  ['janji',    'i'],   // promise
  ['mimpi',    'i'],   // dream
  ['pagi',     'i'],   // morning
  ['tinggi',   'i'],   // high / tall
  ['mengerti', 'i'],   // understand
  // ─── /u/ endings ──────────────────────────────────────────────────────────
  ['rindu',    'u'],   // longing / miss
  ['waktu',    'u'],   // time
  ['atau',     'u'],   // or
  ['tahu',     'u'],   // know
  ['mau',      'u'],   // want
  ['kau',      'u'],   // you (informal)
  ['aku',      'u'],   // I / me (informal)
  ['batu',     'u'],   // stone
  ['satu',     'u'],   // one
  ['perlu',    'u'],   // need
  ['selalu',   'u'],   // always
  ['terus',    'u'],   // continue
  ['jatuh',    'u'],   // fall
  ['penuh',    'u'],   // full
  ['jauh',     'u'],   // far
  ['sungguh',  'u'],   // truly
  ['kalbu',    'u'],   // heart (poetic)
  ['sendu',    'u'],   // melancholy
  // ─── /e/ endings ──────────────────────────────────────────────────────────
  ['kasih',    'e'],   // love / affection (kasɪh → /e/ approximate)
  ['baik',     'e'],   // good
  ['sakit',    'e'],   // sick / hurt
  ['tangis',   'e'],   // cry / weeping
  ['manis',    'e'],   // sweet
  ['habis',    'e'],   // finished
  ['langit',   'e'],   // sky
  ['semangat', 'a'],   // spirit / enthusiasm
  ['malam',    'a'],   // night
  ['dalam',    'a'],   // deep / in
  ['jalan',    'a'],   // road / walk
  ['badan',    'a'],   // body
  ['bukan',    'a'],   // not (nominal)
  // ─── /an/ / nasal endings ─────────────────────────────────────────────────
  ['teman',    'an'],  // friend
  ['jaman',    'an'],  // era / time (jaman)
  ['bintang',  'aŋ'],  // star
  ['datang',   'aŋ'],  // come
  ['tenang',   'aŋ'],  // calm
  ['bimbang',  'aŋ'],  // hesitant
  ['hilang',   'aŋ'],  // disappear
  ['pulang',   'aŋ'],  // return home
  ['senang',   'aŋ'],  // happy
  ['sayang',   'aŋ'],  // love (dear)
  ['panjang',  'aŋ'],  // long
  ['siang',    'aŋ'],  // noon
  ['hutang',   'aŋ'],  // debt
  ['kenangan', 'aŋ'],  // memory
  ['harapan',  'an'],  // hope
  ['impian',   'an'],  // dream (noun)
  ['perjuangan','an'], // struggle
  ['kehidupan','an'],  // life (noun)
  // ─── /ir/ / /ur/ ─────────────────────────────────────────────────────────
  ['air',      'ir'],  // water
  ['cahir',    'ir'],  // (alt: cahaya = light)
  ['akhir',    'ir'],  // end
  // ─── Function words & connectives (high rhyme frequency) ─────────────────
  ['dan',      'an'],  // and
  ['kan',      'an'],  // right? (particle)
  ['pun',      'un'],  // even / also
  ['nun',      'un'],  // there (poetic)
  ['kun',      'un'],  // be! (Arabic loanword, poetic)
  ['dun',      'un'],  // world (poetic: dunia)
  ['di',       'i'],   // at / in (preposition)
  ['ku',       'u'],   // my (enclitic)
  ['mu',       'u'],   // your (enclitic)
  ['nya',      'a'],   // his/her/its (enclitic)
  ['pun',      'un'],  // even
  // ─── Nature / poetic vocabulary ───────────────────────────────────────────
  ['bunga',    'a'],   // flower
  ['angin',    'in'],  // wind
  ['hujan',    'an'],  // rain
  ['bumi',     'i'],   // earth
  ['laut',     'ut'],  // sea
  ['hutan',    'an'],  // forest
  ['bulan',    'an'],  // moon / month
  ['cahaya',   'a'],   // light
  ['suara',    'a'],   // voice / sound
  ['senyum',   'um'],  // smile
  ['tangis',   'is'],  // weeping
  ['tetes',    'es'],  // drop (water)
];
