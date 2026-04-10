/**
 * nou.ts — Lexique phonémique Nouchi (Côte d'Ivoire)
 * ~110 entrées [mot_orthographique, clé_RN].
 *
 * Le Nouchi est un créole urbain ivoirien à base lexicale française,
 * dioula et baoulé, avec emprunts à l'anglais.
 * Structure syllabique : dominante CV/CVC, finales ouvertes préférées.
 * Clé RN : noyau vocalique IPA du rime final (coda ignorée ou réduite).
 *
 * Sources lexicales : vocabulaire de rue abidjanais, rap CI, textos urbains.
 */

export const nouLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ──────────────────────────────────────────────────────────────────
  ['gnaman', 'a'],    ['yako', 'a'],     ['warra', 'a'],    ['para', 'a'],
  ['kata', 'a'],      ['gnata', 'a'],    ['gnamankoudji', 'a'], ['fara', 'a'],
  ['saga', 'a'],      ['abra', 'a'],     ['waza', 'a'],     ['nana', 'a'],
  ['balla', 'a'],     ['gba', 'a'],      ['gbaa', 'a'],     ['sawa', 'a'],
  ['tchaka', 'a'],    ['blaka', 'a'],    ['kraka', 'a'],    ['yalla', 'a'],
  ['tchamba', 'a'],   ['banda', 'a'],    ['wanda', 'a'],    ['ganda', 'a'],
  ['mama', 'a'],      ['daba', 'a'],     ['laba', 'a'],     ['kaba', 'a'],

  // ─── /ɔ/ ──────────────────────────────────────────────────────────────────
  ['corpo', 'ɔ'],     ['fotto', 'ɔ'],    ['moto', 'ɔ'],     ['logo', 'ɔ'],
  ['coco', 'ɔ'],      ['kpoto', 'ɔ'],    ['gnon', 'ɔ'],     ['gon', 'ɔ'],
  ['tonton', 'ɔ'],    ['mondo', 'ɔ'],    ['bondo', 'ɔ'],    ['pronto', 'ɔ'],
  ['combo', 'ɔ'],     ['ghetto', 'ɔ'],   ['drogbo', 'ɔ'],   ['congon', 'ɔ'],

  // ─── /e/ ──────────────────────────────────────────────────────────────────
  ['gbê', 'e'],       ['tchê', 'e'],     ['kpê', 'e'],      ['blê', 'e'],
  ['wê', 'e'],        ['dé', 'e'],       ['ké', 'e'],       ['bê', 'e'],
  ['trê', 'e'],       ['zê', 'e'],       ['lé', 'e'],       ['té', 'e'],
  ['mé', 'e'],        ['yé', 'e'],       ['sé', 'e'],       ['fé', 'e'],
  ['bété', 'e'],      ['doublé', 'e'],   ['dossié', 'e'],   ['quartié', 'e'],

  // ─── /i/ ──────────────────────────────────────────────────────────────────
  ['fi', 'i'],        ['kri', 'i'],      ['tchri', 'i'],    ['bladi', 'i'],
  ['gnadi', 'i'],     ['babi', 'i'],     ['gnabi', 'i'],    ['wari', 'i'],
  ['kpri', 'i'],      ['fli', 'i'],      ['chéri', 'i'],    ['chari', 'i'],
  ['ami', 'i'],       ['zikri', 'i'],    ['bodi', 'i'],     ['ladi', 'i'],
  ['mboki', 'i'],     ['ndoki', 'i'],    ['broki', 'i'],    ['loki', 'i'],

  // ─── /u/ ──────────────────────────────────────────────────────────────────
  ['dou', 'u'],       ['gou', 'u'],      ['blou', 'u'],     ['kou', 'u'],
  ['tchrou', 'u'],    ['gbrou', 'u'],    ['fou', 'u'],      ['trou', 'u'],
  ['doudou', 'u'],    ['coucou', 'u'],   ['tatou', 'u'],    ['bisou', 'u'],
  ['boutou', 'u'],    ['goutou', 'u'],   ['loutou', 'u'],   ['routou', 'u'],

  // ─── /ɛ/ ──────────────────────────────────────────────────────────────────
  ['fèss', 'ɛ'],      ['palè', 'ɛ'],     ['djè', 'ɛ'],      ['kpè', 'ɛ'],
  ['gnè', 'ɛ'],       ['blèkè', 'ɛ'],    ['gbèlè', 'ɛ'],    ['tchèkè', 'ɛ'],
  ['làlè', 'ɛ'],      ['fèrè', 'ɛ'],     ['kèkè', 'ɛ'],     ['yèkè', 'ɛ'],

  // ─── Rimes hip-hop / coupé-décalé / afrobeats ─────────────────────────────
  ['flow', 'o'],      ['bro', 'o'],      ['pro', 'o'],      ['gro', 'o'],
  ['show', 'o'],      ['promo', 'o'],    ['logo', 'o'],     ['ogo', 'o'],
  ['game', 'ɛ'],      ['fame', 'ɛ'],     ['name', 'ɛ'],     ['flame', 'ɛ'],
  ['life', 'i'],      ['vibe', 'i'],     ['tribe', 'i'],    ['grind', 'i'],
  ['swag', 'a'],      ['bag', 'a'],      ['flag', 'a'],     ['drag', 'a'],
  ['top', 'ɔ'],       ['drop', 'ɔ'],     ['hop', 'ɔ'],      ['nonstop', 'ɔ'],
];
