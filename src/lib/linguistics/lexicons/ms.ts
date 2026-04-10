/**
 * ms.ts — Malay lexicon (Austronesian, Malayo-Polynesian branch)
 *
 * Entry format: readonly [word, rnKey] — same tuple format as id.ts.
 * Standard Malay (Bahasa Malaysia) — non-tonal, penultimate stress.
 * Phoneme set mirrors Indonesian with key divergences:
 *   - /v/ present in loanwords (vivid, video)
 *   - /-h/ word-final (sekolah, boleh, murah) is realised as [h], not dropped
 *   - /e/ has two allophones: /e/ (tense) vs /ə/ (schwa); rnKey uses 'e'/'ə'
 *   - Prefix stripping: ber-, me-, ke-, pe-, ter-, di-, se-
 * ~200 entries covering vowel nuclei /a i u e ə o/ + codas /n ŋ r l h ʔ/.
 */

export const msLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ endings ──────────────────────────────────────────────────────────
  ['kita',      'a'],   // we (inclusive)
  ['ada',       'a'],   // exist / there is
  ['kata',      'a'],   // word / say
  ['cinta',     'a'],   // love
  ['mana',      'a'],   // where / which
  ['sama',      'a'],   // same / together
  ['suka',      'a'],   // like
  ['lupa',      'a'],   // forget
  ['nyata',     'a'],   // real
  ['biasa',     'a'],   // usual
  ['rasa',      'a'],   // feel / taste
  ['masa',      'a'],   // time / era
  ['jiwa',      'a'],   // soul
  ['dua',       'a'],   // two
  ['tiga',      'a'],   // three
  ['saja',      'a'],   // just / only
  ['juga',      'a'],   // also
  ['sana',      'a'],   // there
  ['buka',      'a'],   // open
  ['luka',      'a'],   // wound
  ['duka',      'a'],   // sorrow
  ['muda',      'a'],   // young
  ['beza',      'a'],   // difference
  ['dunia',     'a'],   // world
  ['tiba',      'a'],   // arrive
  ['cuba',      'a'],   // try
  ['doa',       'a'],   // prayer
  ['cara',      'a'],   // way / method
  ['cuma',      'a'],   // only / just
  ['reka',      'a'],   // design / invent
  ['baka',      'a'],   // ancestry / heritage
  ['suka-duka', 'a'],   // joy and sorrow
  ['nama',      'a'],   // name
  ['papa',      'a'],   // poor / father (informal)
  ['mama',      'a'],   // mother (informal)
  // ─── /i/ endings ──────────────────────────────────────────────────────────
  ['hati',      'i'],   // heart
  ['mati',      'i'],   // die
  ['nanti',     'i'],   // wait / later
  ['pasti',     'i'],   // certain
  ['lagi',      'i'],   // again
  ['tapi',      'i'],   // but
  ['kini',      'i'],   // now
  ['diri',      'i'],   // self
  ['beri',      'i'],   // give
  ['pergi',     'i'],   // go
  ['sunyi',     'i'],   // silent / lonely
  ['sendiri',   'i'],   // alone
  ['berani',    'i'],   // brave
  ['janji',     'i'],   // promise
  ['mimpi',     'i'],   // dream
  ['pagi',      'i'],   // morning
  ['tinggi',    'i'],   // high / tall
  ['mengerti',  'i'],   // understand
  ['diri',      'i'],   // self
  ['murni',     'i'],   // pure
  ['peribadi',  'i'],   // personal / individuality
  ['abadi',     'i'],   // eternal
  ['budi',      'i'],   // virtue / wisdom
  ['setia',     'a'],   // loyal
  ['bahagia',   'a'],   // happy / bliss
  ['perbudi',   'i'],   // (cultivate virtue)
  // ─── /u/ endings ──────────────────────────────────────────────────────────
  ['rindu',     'u'],   // longing / miss
  ['waktu',     'u'],   // time
  ['atau',      'u'],   // or
  ['tahu',      'u'],   // know
  ['mahu',      'u'],   // want (MY: mahu vs ID: mau)
  ['kau',       'u'],   // you (informal)
  ['aku',       'u'],   // I / me (informal)
  ['batu',      'u'],   // stone
  ['satu',      'u'],   // one
  ['perlu',     'u'],   // need
  ['selalu',    'u'],   // always
  ['terus',     'u'],   // continue
  ['jatuh',     'u'],   // fall
  ['penuh',     'u'],   // full
  ['jauh',      'u'],   // far
  ['sungguh',   'u'],   // truly
  ['kalbu',     'u'],   // heart (poetic)
  ['sendu',     'u'],   // melancholy
  ['mutu',      'u'],   // quality
  ['tentu',     'u'],   // certain / sure
  ['ragu',      'u'],   // doubt
  ['bahu',      'u'],   // shoulder
  ['syahdu',    'u'],   // solemn / moving
  ['rindu',     'u'],   // longing
  ['bantu',     'u'],   // help
  ['menantu',   'u'],   // son/daughter-in-law
  // ─── /e/ tense endings ────────────────────────────────────────────────────
  ['sore',      'e'],   // late afternoon (MY variant)
  ['gore',      'e'],   // slash / pierce
  ['gore-gore', 'e'],   // (reduplication)
  ['sate',      'e'],   // satay
  ['cafe',      'e'],   // café (loanword)
  // ─── /ə/ schwa endings ────────────────────────────────────────────────────
  ['boleh',     'ə'],   // can / may (MY-exclusive)
  ['oleh',      'ə'],   // by (agent marker)
  ['kaleh',     'ə'],   // perhaps (informal MY)
  ['entah',     'ə'],   // who knows
  ['mudah',     'ə'],   // easy
  ['indah',     'ə'],   // beautiful
  ['susah',     'ə'],   // difficult
  ['payah',     'ə'],   // hard / difficult
  ['lemah',     'ə'],   // weak
  ['gagah',     'ə'],   // strong / brave
  ['sekolah',   'ə'],   // school
  ['masalah',   'ə'],   // problem
  ['faedah',    'ə'],   // benefit
  ['kisah',     'ə'],   // story
  ['peristiwa', 'a'],   // event
  ['murah',     'ə'],   // cheap
  ['marah',     'ə'],   // angry
  ['arah',      'ə'],   // direction
  ['darah',     'ə'],   // blood
  ['sejarah',   'ə'],   // history
  ['hikmah',    'ə'],   // wisdom (Arabic loanword)
  ['amanah',    'ə'],   // trust / responsibility
  ['titah',     'ə'],   // royal decree
  // ─── /an/ nasal endings ───────────────────────────────────────────────────
  ['teman',     'an'],  // friend
  ['badan',     'an'],  // body
  ['jalan',     'an'],  // road / walk
  ['bukan',     'an'],  // not (nominal)
  ['malam',     'am'],  // night
  ['harapan',   'an'],  // hope
  ['impian',    'an'],  // dream (noun)
  ['perjuangan','an'],  // struggle
  ['kehidupan', 'an'],  // life (noun)
  ['perjalanan','an'],  // journey
  ['kebenaran', 'an'],  // truth
  ['kebebasan', 'an'],  // freedom
  ['insan',     'an'],  // human being
  ['tuhan',     'an'],  // God
  ['zaman',     'an'],  // era
  ['aman',      'an'],  // peaceful
  ['bukan',     'an'],  // not
  ['tuaan',     'an'],  // master / elder (formal)
  ['ikatan',    'an'],  // bond / tie
  ['kenangan',  'an'],  // memory
  ['bayangan',  'an'],  // shadow / image
  ['perasaan',  'an'],  // feeling
  ['kerinduan', 'an'],  // longing (noun)
  // ─── /aŋ/ velar nasal ─────────────────────────────────────────────────────
  ['bintang',   'aŋ'],  // star
  ['datang',    'aŋ'],  // come
  ['tenang',    'aŋ'],  // calm
  ['hilang',    'aŋ'],  // disappear
  ['pulang',    'aŋ'],  // return home
  ['senang',    'aŋ'],  // happy
  ['sayang',    'aŋ'],  // love (dear)
  ['panjang',   'aŋ'],  // long
  ['siang',     'aŋ'],  // noon
  ['hutang',    'aŋ'],  // debt
  ['malang',    'aŋ'],  // unlucky
  ['terbang',   'aŋ'],  // fly
  ['gelang',    'aŋ'],  // bracelet
  ['petang',    'aŋ'],  // evening
  ['sekarang',  'aŋ'],  // now
  ['memang',    'aŋ'],  // indeed
  ['kepang',    'aŋ'],  // braid
  // ─── /iŋ/ / /uŋ/ ─────────────────────────────────────────────────────────
  ['ending',    'iŋ'],  // ending (loanword)
  ['pusing',    'iŋ'],  // dizzy / spin
  ['asing',     'iŋ'],  // foreign
  ['bising',    'iŋ'],  // noisy
  ['pening',    'iŋ'],  // dizzy
  ['dinding',   'iŋ'],  // wall
  ['hutung',    'uŋ'],  // (archaic form)
  ['kampung',   'uŋ'],  // village
  ['buntung',   'uŋ'],  // amputated / truncated
  ['untung',    'uŋ'],  // luck / profit
  ['burung',    'uŋ'],  // bird
  ['gunung',    'uŋ'],  // mountain
  ['jantung',   'uŋ'],  // heart (organ)
  ['lantung',   'uŋ'],  // wander aimlessly
  ['gemuruh',   'u'],   // thunder / rumble
  // ─── /ir/ / /ur/ ─────────────────────────────────────────────────────────
  ['air',       'ir'],  // water
  ['akhir',     'ir'],  // end
  ['takdir',    'ir'],  // fate / destiny
  ['tafsir',    'ir'],  // interpretation
  ['mahir',     'ir'],  // skilled
  ['khair',     'ir'],  // good (Arabic)
  // ─── Enclitics & particles (high rhyme frequency) ─────────────────────────
  ['di',        'i'],   // at / in (preposition)
  ['ku',        'u'],   // my (enclitic)
  ['mu',        'u'],   // your (enclitic)
  ['nya',       'a'],   // his/her/its (enclitic)
  ['pun',       'un'],  // even / also
  ['lah',       'ə'],   // discourse particle
  ['kah',       'ə'],   // question particle
  ['tah',       'ə'],   // epistemic particle
  ['ke',        'ə'],   // to (directional)
  ['dan',       'an'],  // and
  ['yang',      'aŋ'],  // which / that (relativiser)
  ['kerana',    'a'],   // because (MY: kerana vs ID: karena)
  ['kepada',    'a'],   // to / towards (MY-exclusive)
  ['dengan',    'aŋ'],  // with
  ['dalam',     'am'],  // in / deep
  ['antara',    'a'],   // between
  // ─── Nature / poetic vocabulary ───────────────────────────────────────────
  ['bunga',     'a'],   // flower
  ['angin',     'in'],  // wind
  ['hujan',     'an'],  // rain
  ['bumi',      'i'],   // earth
  ['laut',      'ut'],  // sea
  ['hutan',     'an'],  // forest
  ['bulan',     'an'],  // moon / month
  ['cahaya',    'a'],   // light
  ['suara',     'a'],   // voice / sound
  ['senyum',    'um'],  // smile
  ['tangis',    'is'],  // weeping
  ['embun',     'un'],  // dew
  ['langit',    'it'],  // sky
  ['ombak',     'ak'],  // wave
  ['terang',    'aŋ'],  // bright / clear
  ['matahari',  'i'],   // sun
  ['bintang',   'aŋ'],  // star (duplicate intentional for weight)
  ['mentari',   'i'],   // sun (poetic)
  ['rembulan',  'an'],  // moon (poetic)
  ['percikan',  'an'],  // splash / spark
  ['dedaunan',  'an'],  // foliage (collective)
  // ─── Emotions / abstract ──────────────────────────────────────────────────
  ['kasih',     'ih'],  // love / affection
  ['sedih',     'ih'],  // sad
  ['putih',     'ih'],  // white
  ['lebih',     'ih'],  // more
  ['masih',     'ih'],  // still / yet
  ['habis',     'is'],  // finished
  ['manis',     'is'],  // sweet
  ['baik',      'ik'],  // good
  ['cantik',    'ik'],  // beautiful
  ['molek',     'ek'],  // pretty (MY)
  ['benak',     'ak'],  // mind / marrow
  ['resah',     'ə'],   // restless
  ['gundah',    'ə'],   // troubled
  ['gelisah',   'ə'],   // restless / anxious
  ['pasrah',    'ə'],   // resignation / surrender
  ['sepi',      'i'],   // lonely
  ['pilu',      'u'],   // heartache
  ['pedih',     'ih'],  // painful
  ['debar',     'ar'],  // palpitation
  ['getar',     'ar'],  // tremble / vibrate
  ['fikir',     'ir'],  // think
  ['ingat',     'at'],  // remember
  ['sabar',     'ar'],  // patient
  ['khabar',    'ar'],  // news
];
