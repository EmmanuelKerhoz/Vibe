/**
 * ms.ts — Malay lexicon (Austronesian, Malayo-Polynesian branch)
 *
 * Entry format: readonly [word, rnKey] — same tuple format as id.ts.
 * Malay (Bahasa Melayu) shares core phonology with Indonesian but diverges
 * in lexis (stronger Arabic/Persian influence), some spellings, and prosody.
 * Non-tonal; stress default on penultimate syllable.
 * Phoneme set mirrors id.ts: labials p/b/m, coronals t/d/n/s/r/l,
 * velars k/g/ŋ, palatals tʃ/dʒ/j, glottal h/ˀ, semivowel w.
 * rnKey = rhyme nucleus (last stressed vowel + coda if consonantal).
 * ~150 entries covering high-frequency poetic / lyric vocabulary.
 */

export const msLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ endings ──────────────────────────────────────────────────────────────────
  ['kita',       'a'],   // we (inclusive)
  ['ada',        'a'],   // exist / there is
  ['kata',       'a'],   // word / say
  ['cinta',      'a'],   // love
  ['mana',       'a'],   // where / which
  ['sama',       'a'],   // same / together
  ['suka',       'a'],   // like
  ['lupa',       'a'],   // forget
  ['nyata',      'a'],   // real
  ['biasa',      'a'],   // usual
  ['boleh',      'e'],   // can / may
  ['rasa',       'a'],   // feel / taste
  ['masa',       'a'],   // time / era
  ['jiwa',       'a'],   // soul
  ['dua',        'a'],   // two
  ['tiga',       'a'],   // three
  ['sahaja',     'a'],   // just / only (formal Malay vs. saja)
  ['juga',       'a'],   // also
  ['sana',       'a'],   // there
  ['sini',       'i'],   // here
  ['buka',       'a'],   // open
  ['luka',       'a'],   // wound
  ['duka',       'a'],   // sorrow
  ['muda',       'a'],   // young
  ['beza',       'a'],   // difference
  ['dunia',      'a'],   // world
  ['cahaya',     'a'],   // light
  ['suara',      'a'],   // voice
  ['merdeka',    'a'],   // freedom
  ['mulia',      'a'],   // noble
  ['bahagia',    'a'],   // happiness
  ['bersama',    'a'],   // together
  ['setia',      'a'],   // loyal
  ['warna',      'a'],   // colour
  ['usaha',      'a'],   // effort
  ['doanya',     'a'],   // his/her prayer
  // ─── /i/ endings ──────────────────────────────────────────────────────────────────
  ['hati',       'i'],   // heart
  ['mati',       'i'],   // die
  ['nanti',      'i'],   // wait / later
  ['pasti',      'i'],   // certain
  ['lagi',       'i'],   // again
  ['tapi',       'i'],   // but
  ['kini',       'i'],   // now
  ['diri',       'i'],   // self
  ['beri',       'i'],   // give
  ['pergi',      'i'],   // go
  ['sunyi',      'i'],   // silent / lonely
  ['sendiri',    'i'],   // alone
  ['berani',     'i'],   // brave
  ['janji',      'i'],   // promise
  ['mimpi',      'i'],   // dream
  ['pagi',       'i'],   // morning
  ['tinggi',     'i'],   // high / tall
  ['mengerti',   'i'],   // understand
  ['abadi',      'i'],   // eternal
  ['murni',      'i'],   // pure
  ['sejati',     'i'],   // true / genuine
  ['ilahi',      'i'],   // divine
  ['kasturi',    'i'],   // musk (poetic)
  ['berseri',    'i'],   // radiant
  ['peduli',     'i'],   // care
  ['rugi',       'i'],   // loss
  ['sakti',      'i'],   // supernatural power
  // ─── /u/ endings ──────────────────────────────────────────────────────────────────
  ['rindu',      'u'],   // longing / miss
  ['waktu',      'u'],   // time
  ['atau',       'u'],   // or
  ['tahu',       'u'],   // know
  ['mahu',       'u'],   // want (Malay: mahu vs. mau)
  ['kau',        'u'],   // you (informal)
  ['aku',        'u'],   // I / me (informal)
  ['batu',       'u'],   // stone
  ['satu',       'u'],   // one
  ['perlu',      'u'],   // need
  ['selalu',     'u'],   // always
  ['terus',      'us'],  // continue
  ['jatuh',      'u'],   // fall
  ['penuh',      'u'],   // full
  ['jauh',       'u'],   // far
  ['sungguh',    'u'],   // truly
  ['kalbu',      'u'],   // heart (poetic, Arabic loanword)
  ['sendu',      'u'],   // melancholy
  ['candu',      'u'],   // opium / addiction (poetic)
  ['wangi',      'i'],   // fragrant
  ['harum',      'um'],  // fragrant (adj)
  ['syahdu',     'u'],   // serene / wistful
  ['pilu',       'u'],   // heartache
  ['layu',       'u'],   // wither
  ['sayu',       'u'],   // poignant
  ['pulau',      'au'],  // island
  ['kerbau',     'au'],  // buffalo
  // ─── /e/ / schwa endings ───────────────────────────────────────────────────────────
  ['baik',       'e'],   // good
  ['sakit',      'e'],   // sick / hurt
  ['manis',      'e'],   // sweet
  ['habis',      'e'],   // finished
  ['langit',     'e'],   // sky
  ['kasih',      'e'],   // love / affection
  ['sedih',      'e'],   // sad
  ['bersih',     'e'],   // clean
  ['lebih',      'e'],   // more
  ['putih',      'e'],   // white
  ['susah',      'a'],   // difficult
  ['indah',      'a'],   // beautiful
  ['sudah',      'a'],   // already
  ['rendah',     'a'],   // low
  ['mudah',      'a'],   // easy
  ['seindah',    'a'],   // as beautiful as
  // ─── /-an/ nasal endings ─────────────────────────────────────────────────────────
  ['teman',      'an'],  // friend
  ['zaman',      'an'],  // era / time
  ['harapan',    'an'],  // hope
  ['impian',     'an'],  // dream (noun)
  ['perjuangan', 'an'],  // struggle
  ['kehidupan',  'an'],  // life (noun)
  ['kebenaran',  'an'],  // truth
  ['perjalanan', 'an'],  // journey
  ['kenangan',   'an'],  // memory
  ['kenyataan',  'an'],  // reality
  ['bayangan',   'an'],  // shadow / image
  ['keikhlasan', 'an'],  // sincerity
  ['tuhan',      'an'],  // God (common noun)
  ['insan',      'an'],  // human being
  ['badan',      'an'],  // body
  ['jalan',      'an'],  // road / walk
  ['malam',      'am'],  // night
  ['salam',      'am'],  // greeting / peace
  ['alam',       'am'],  // nature / world
  ['dalam',      'am'],  // deep / in
  ['kelam',      'am'],  // dark / gloomy
  ['padam',      'am'],  // extinguish
  // ─── /-aŋ/ velar nasal ──────────────────────────────────────────────────────────────
  ['bintang',    'aŋ'],  // star
  ['datang',     'aŋ'],  // come
  ['tenang',     'aŋ'],  // calm
  ['hilang',     'aŋ'],  // disappear
  ['pulang',     'aŋ'],  // return home
  ['senang',     'aŋ'],  // happy
  ['sayang',     'aŋ'],  // love (dear)
  ['panjang',    'aŋ'],  // long
  ['siang',      'aŋ'],  // noon
  ['hutang',     'aŋ'],  // debt
  ['gemilang',   'aŋ'],  // glorious
  ['cemerlang',  'aŋ'],  // brilliant
  ['terbilang',  'aŋ'],  // notable
  ['terkenang',  'aŋ'],  // remembered
  ['melayang',   'aŋ'],  // floating / drifting
  ['perasaan',   'an'],  // feeling
  // ─── /-ir/ / /-ur/ ──────────────────────────────────────────────────────────────────
  ['air',        'ir'],  // water
  ['akhir',      'ir'],  // end
  ['takdir',     'ir'],  // fate / destiny
  ['munir',      'ir'],  // bright (name / poetic)
  ['kabur',      'ur'],  // hazy / blur
  ['hancur',     'ur'],  // destroyed
  ['lebur',      'ur'],  // melted
  ['jujur',      'ur'],  // honest
  // ─── Enclitics & function words ─────────────────────────────────────────────────────
  ['dan',        'an'],  // and
  ['pun',        'un'],  // even / also
  ['nun',        'un'],  // there (poetic)
  ['kun',        'un'],  // be! (Arabic, poetic)
  ['di',         'i'],   // at / in (preposition)
  ['ku',         'u'],   // my (enclitic)
  ['mu',         'u'],   // your (enclitic)
  ['nya',        'a'],   // his/her/its (enclitic)
  // ─── Arabic loanwords (high frequency in Malay poetry) ──────────────────────────
  ['doa',        'a'],   // prayer
  ['makna',      'a'],   // meaning
  ['rahsia',     'a'],   // secret
  ['dunia',      'a'],   // world
  ['niat',       'at'],  // intention
  ['amal',       'al'],  // good deed
  ['ilmu',       'u'],   // knowledge
  ['iman',       'an'],  // faith
  ['qalbu',      'u'],   // heart (Arabic: qalb)
  ['nur',        'ur'],  // light (divine)
  ['fana',       'a'],   // transient / mortal
  ['abadi',      'i'],   // eternal
  ['syukur',     'ur'],  // gratitude
  ['sabar',      'ar'],  // patience
  ['rezeki',     'i'],   // blessing / provision
  ['amanah',     'a'],   // trust / responsibility
  ['hikmah',     'a'],   // wisdom
  ['taubat',     'at'],  // repentance
  // ─── Nature / lyric vocabulary ──────────────────────────────────────────────────────
  ['bunga',      'a'],   // flower
  ['angin',      'in'],  // wind
  ['hujan',      'an'],  // rain
  ['bumi',       'i'],   // earth
  ['laut',       'ut'],  // sea
  ['hutan',      'an'],  // forest
  ['bulan',      'an'],  // moon / month
  ['senyum',     'um'],  // smile
  ['tangis',     'is'],  // weeping
  ['embun',      'un'],  // dew
  ['mega',       'a'],   // cloud (poetic)
  ['mentari',    'i'],   // sun (poetic)
  ['pesisir',    'ir'],  // coastline
  ['mutiara',    'a'],   // pearl
  ['dedaun',     'un'],  // leaves (poetic)
];
