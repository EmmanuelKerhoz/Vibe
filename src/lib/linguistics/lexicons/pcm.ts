/**
 * pcm.ts — Lexique phonémique Nigerian Pidgin English
 * ~110 entrées [mot_orthographique, clé_RN].
 *
 * Le Nigerian Pidgin (PCM) est un créole à base lexicale anglaise
 * avec substrat yoruba/igbo/hausa. Structure syllabique : CV/CVC dominant.
 * Tons partiellement hérités du substrat mais non distinctifs en rime.
 * Clé RN : noyau vocalique IPA du rime final.
 *
 * Sources : Lagos street language, afrobeats lyrics, Nollywood dialogue.
 */

export const pcmLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ──────────────────────────────────────────────────────────────────
  ['abeg', 'a'],      ['wahala', 'a'],   ['palava', 'a'],   ['kasala', 'a'],
  ['katakata', 'a'],  ['yawa', 'a'],     ['gbege', 'a'],    ['wahala', 'a'],
  ['naija', 'a'],     ['oga', 'a'],      ['madam', 'a'],    ['baba', 'a'],
  ['mama', 'a'],      ['papa', 'a'],     ['kata', 'a'],     ['waka', 'a'],
  ['saka', 'a'],      ['chaka', 'a'],    ['shaka', 'a'],    ['dada', 'a'],
  ['maka', 'a'],      ['nanka', 'a'],    ['ankara', 'a'],   ['fanta', 'a'],
  ['Ghana', 'a'],     ['drama', 'a'],    ['camera', 'a'],   ['saga', 'a'],

  // ─── /ɛ/ / /e/ ────────────────────────────────────────────────────────────
  ['wetin', 'ɛ'],     ['bele', 'e'],     ['pele', 'e'],     ['kele', 'e'],
  ['belle', 'ɛ'],     ['well', 'ɛ'],     ['tell', 'ɛ'],     ['sell', 'ɛ'],
  ['spell', 'ɛ'],     ['yell', 'ɛ'],     ['smell', 'ɛ'],    ['swell', 'ɛ'],
  ['check', 'ɛ'],     ['wreck', 'ɛ'],    ['deck', 'ɛ'],     ['neck', 'ɛ'],
  ['person', 'e'],    ['woman', 'e'],    ['broken', 'e'],   ['open', 'e'],

  // ─── /i/ ──────────────────────────────────────────────────────────────────
  ['dey', 'i'],       ['werey', 'i'],    ['craze', 'i'],    ['be', 'i'],
  ['free', 'i'],      ['see', 'i'],      ['me', 'i'],       ['we', 'i'],
  ['agree', 'i'],     ['degree', 'i'],   ['money', 'i'],    ['honey', 'i'],
  ['funny', 'i'],     ['sunny', 'i'],    ['plenty', 'i'],   ['twenty', 'i'],
  ['party', 'i'],     ['body', 'i'],     ['ready', 'i'],    ['heavy', 'i'],
  ['carry', 'i'],     ['marry', 'i'],    ['hurry', 'i'],    ['worry', 'i'],

  // ─── /ɔ/ / /o/ ────────────────────────────────────────────────────────────
  ['follow', 'ɔ'],    ['tomorrow', 'ɔ'], ['borrow', 'ɔ'],   ['sorrow', 'ɔ'],
  ['go', 'o'],        ['no', 'o'],       ['so', 'o'],       ['know', 'o'],
  ['show', 'o'],      ['flow', 'o'],     ['grow', 'o'],     ['blow', 'o'],
  ['cold', 'o'],      ['bold', 'o'],     ['gold', 'o'],     ['hold', 'o'],
  ['told', 'o'],      ['sold', 'o'],     ['old', 'o'],      ['road', 'o'],
  ['load', 'o'],      ['mode', 'o'],     ['code', 'o'],     ['bone', 'o'],

  // ─── /u/ ──────────────────────────────────────────────────────────────────
  ['do', 'u'],        ['true', 'u'],     ['move', 'u'],     ['prove', 'u'],
  ['groove', 'u'],    ['smooth', 'u'],   ['cool', 'u'],     ['fool', 'u'],
  ['school', 'u'],    ['rule', 'u'],     ['tool', 'u'],     ['pool', 'u'],
  ['food', 'u'],      ['mood', 'u'],     ['good', 'u'],     ['wood', 'u'],
  ['blood', 'u'],     ['flood', 'u'],    ['hood', 'u'],     ['stood', 'u'],

  // ─── /aɪ/ / /aʊ/ — diphthongs fréquents ──────────────────────────────────
  ['life', 'aɪ'],     ['wife', 'aɪ'],    ['knife', 'aɪ'],   ['strife', 'aɪ'],
  ['mine', 'aɪ'],     ['shine', 'aɪ'],   ['time', 'aɪ'],    ['climb', 'aɪ'],
  ['down', 'aʊ'],     ['town', 'aʊ'],    ['crown', 'aʊ'],   ['brown', 'aʊ'],
  ['sound', 'aʊ'],    ['ground', 'aʊ'],  ['found', 'aʊ'],   ['around', 'aʊ'],

  // ─── Afrobeats / trap anglophone ──────────────────────────────────────────
  ['vibe', 'aɪ'],     ['ride', 'aɪ'],    ['grind', 'aɪ'],   ['grind', 'aɪ'],
  ['side', 'aɪ'],     ['pride', 'aɪ'],   ['guide', 'aɪ'],   ['inside', 'aɪ'],
  ['money', 'i'],     ['funny', 'i'],    ['honey', 'i'],    ['sunny', 'i'],
];
