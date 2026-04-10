/**
 * cfg.ts — Lexique phonémique Camfranglais (Cameroun)
 * ~100 entrées [mot_orthographique, clé_RN].
 *
 * Le Camfranglais est un créole camerounais à base mixte français/anglais
 * avec substrat Beti, Bassa, Fulfulde et autres langues nationales.
 * Structure syllabique : CV/CVC dominant, alternance FR/EN au sein d'un vers.
 * Clé RN : noyau vocalique IPA du rime final.
 *
 * Sources : rap camerounais, parler jeunes Yaoundé/Douala.
 */

export const cfgLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ──────────────────────────────────────────────────────────────────
  ['tchamba', 'a'],   ['mbamba', 'a'],   ['kanda', 'a'],    ['palava', 'a'],
  ['makossa', 'a'],   ['bikutsi', 'a'],  ['saga', 'a'],     ['waka', 'a'],
  ['gbaka', 'a'],     ['bala', 'a'],     ['nda', 'a'],      ['kwa', 'a'],
  ['sawa', 'a'],      ['mboa', 'a'],     ['bangangté', 'a'], ['ngola', 'a'],
  ['manawa', 'a'],    ['feymania', 'a'], ['arnaka', 'a'],   ['tchamba', 'a'],
  ['drama', 'a'],     ['camera', 'a'],   ['saga', 'a'],     ['agenda', 'a'],

  // ─── /ɛ/ / /e/ ────────────────────────────────────────────────────────────
  ['djè', 'ɛ'],       ['kpè', 'ɛ'],      ['blèkè', 'ɛ'],    ['ndè', 'ɛ'],
  ['tchè', 'ɛ'],      ['gbè', 'ɛ'],      ['wèlè', 'ɛ'],     ['bèlè', 'ɛ'],
  ['pèlè', 'ɛ'],      ['kèkè', 'ɛ'],     ['yèkè', 'ɛ'],     ['fèrè', 'ɛ'],
  ['dé', 'e'],        ['bé', 'e'],        ['ké', 'e'],       ['blé', 'e'],
  ['marché', 'e'],    ['bouché', 'e'],    ['touché', 'e'],   ['lancé', 'e'],
  ['pensée', 'e'],    ['idée', 'e'],      ['lycée', 'e'],    ['musée', 'e'],

  // ─── /i/ ──────────────────────────────────────────────────────────────────
  ['fi', 'i'],        ['kri', 'i'],       ['bladi', 'i'],    ['gnadi', 'i'],
  ['chari', 'i'],     ['babi', 'i'],      ['loki', 'i'],     ['moki', 'i'],
  ['city', 'i'],      ['beauty', 'i'],    ['duty', 'i'],     ['booty', 'i'],
  ['party', 'i'],     ['body', 'i'],      ['ready', 'i'],    ['heavy', 'i'],
  ['money', 'i'],     ['honey', 'i'],     ['funny', 'i'],    ['sunny', 'i'],

  // ─── /ɔ/ / /o/ ────────────────────────────────────────────────────────────
  ['moto', 'ɔ'],      ['kpoto', 'ɔ'],    ['mondo', 'ɔ'],    ['bondo', 'ɔ'],
  ['congon', 'ɔ'],    ['tonton', 'ɔ'],   ['pronto', 'ɔ'],   ['ghetto', 'ɔ'],
  ['go', 'o'],        ['no', 'o'],        ['flow', 'o'],     ['show', 'o'],
  ['bro', 'o'],       ['pro', 'o'],       ['promo', 'o'],    ['logo', 'o'],
  ['maison', 'o'],    ['saison', 'o'],    ['raison', 'o'],   ['horizon', 'o'],

  // ─── /u/ ──────────────────────────────────────────────────────────────────
  ['dou', 'u'],       ['gou', 'u'],       ['kou', 'u'],      ['fou', 'u'],
  ['do', 'u'],        ['true', 'u'],      ['move', 'u'],     ['groove', 'u'],
  ['cool', 'u'],      ['school', 'u'],    ['tool', 'u'],     ['pool', 'u'],
  ['tout', 'u'],      ['pour', 'u'],      ['toujours', 'u'], ['amour', 'u'],
  ['retour', 'u'],    ['détour', 'u'],    ['velours', 'u'],  ['discours', 'u'],

  // ─── Rimes rap camerounais ────────────────────────────────────────────────
  ['life', 'aɪ'],     ['wife', 'aɪ'],     ['knife', 'aɪ'],   ['strife', 'aɪ'],
  ['vibe', 'aɪ'],     ['ride', 'aɪ'],     ['grind', 'aɪ'],   ['side', 'aɪ'],
  ['game', 'ɛ'],      ['fame', 'ɛ'],      ['name', 'ɛ'],     ['flame', 'ɛ'],
];
