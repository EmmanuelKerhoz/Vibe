/**
 * yo.ts — Lexique phonémique Yoruba
 * ~240 entrées [word, rnKey] pour le PhonemeIndex de suggestRhymes().
 * Le Yoruba est une langue tonale à tons (haut H, bas L, moyen M).
 * rnKey = terminaison vocalique + coda consonantique (ton ignoré dans la clé
 * pour maximiser les suggestions — le scoring phonémique gère la précision tonale).
 * Orthographe Yoruba standard (Unicode avec diacritiques).
 */

export const yoLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ──────────────────────────────────────────────────────────────────
  ['ọba', 'a'], ['baba', 'a'], ['mama', 'a'], ['ọna', 'a'],
  ['ara', 'a'], ['ẹja', 'a'], ['ìjà', 'a'], ['ìlà', 'a'],
  ['ìdà', 'a'], ['ọpa', 'a'], ['ẹgba', 'a'], ['ìgba', 'a'],
  ['ọpa', 'a'], ['ẹka', 'a'], ['ìdẹ', 'a'],

  // ─── /an/ ─────────────────────────────────────────────────────────────────
  ['ìjọbán', 'an'], ['orúkọ', 'o'], ['ìbálẹ', 'an'],

  // ─── /e/ / /ẹ/ ────────────────────────────────────────────────────────────
  ['ile', 'e'], ['ọrẹ', 'e'], ['ẹsẹ', 'ẹ'], ['ojú ẹsẹ', 'ẹ'],
  ['ọrọ', 'ọ'], ['ẹ̀kọ́', 'ọ'], ['ìmọ̀', 'ọ'],
  ['gbogbo', 'o'], ['ọmọ', 'ọ'], ['ọjọ', 'ọ'], ['ọdún', 'un'],
  ['ìdí', 'i'], ['ẹgbẹ', 'ẹ'], ['ẹbẹ', 'ẹ'], ['ìfẹ', 'ẹ'],

  // ─── /i/ ──────────────────────────────────────────────────────────────────
  ['ìdí', 'i'], ['àgbàdo', 'i'], ['àjẹ', 'i'],
  ['omi', 'i'], ['ori', 'i'], ['ẹni', 'i'], ['ìgbì', 'i'],
  ['àlà', 'i'], ['ìmì', 'i'], ['ìrìn', 'in'],
  ['ìpín', 'in'], ['orin', 'in'], ['ìdìn', 'in'],

  // ─── /o/ / /ọ/ ────────────────────────────────────────────────────────────
  ['ìlú', 'u'], ['ẹ̀sọ', 'ọ'], ['ìbọ', 'ọ'], ['ìhò', 'ọ'],
  ['ọ̀pẹlọ', 'ọ'], ['ìgbo', 'o'], ['ẹbọ', 'ọ'], ['ìgbọ', 'ọ'],
  ['ẹlẹdẹ', 'ẹ'], ['òde', 'e'], ['ojú', 'u'], ['ẹnu', 'u'],
  ['ìgbà', 'a'], ['ìdọkọ', 'ọ'],

  // ─── /u/ / /ú/ ────────────────────────────────────────────────────────────
  ['ìlú', 'u'], ['ìgbẹ́kẹ̀lé', 'u'], ['ọkùnrin', 'un'],
  ['ẹlẹdẹ', 'u'], ['ìdálẹ́bi', 'i'], ['ẹ̀gbọ́n', 'on'],
  ['ọkùn', 'un'], ['ìdọkọ', 'u'],

  // ─── /in/ / /on/ ──────────────────────────────────────────────────────────
  ['orin', 'in'], ['ìpín', 'in'], ['ẹ̀gbọ́n', 'on'],
  ['ẹsin', 'in'], ['ìsin', 'in'], ['ẹbùn', 'un'],

  // ─── Mots courants — lexique lyrique yoruba ───────────────────────────────
  ['ìfẹ́', 'ẹ'], ['ayọ̀', 'ọ'], ['ìbànújẹ́', 'ẹ'],
  ['àánú', 'u'], ['ẹ̀bùn', 'un'], ['ọpẹ', 'ẹ'],
  ['ìdùnnú', 'u'], ['ìyọnu', 'u'], ['àṣà', 'a'],
  ['ìṣẹ̀lẹ̀', 'ẹ'], ['ìdálẹ', 'e'], ['aṣọ', 'ọ'],
  ['ìjókòó', 'o'], ['ìdúpẹ́', 'ẹ'], ['ẹ̀yà', 'a'],
  ['ẹ̀sìn', 'in'], ['orúkọ', 'ọ'], ['ìwà', 'a'],
  ['ẹwà', 'a'], ['ẹ̀kọ', 'ọ'], ['agbára', 'a'],
  ['ìgbàgbọ́', 'ọ'], ['ìsẹlẹ', 'e'], ['ìpọ̀', 'ọ'],

  // ─── Terminaisons fréquentes en chant yoruba ──────────────────────────────
  ['mi', 'i'], ['ti', 'i'], ['ni', 'i'], ['ri', 'i'],
  ['je', 'e'], ['re', 'e'], ['lo', 'o'], ['bo', 'o'],
  ['wa', 'a'], ['ba', 'a'], ['ma', 'a'], ['da', 'a'],
  ['mo', 'o'], ['ko', 'o'], ['so', 'o'], ['to', 'o'],
  ['fun', 'un'], ['run', 'un'], ['gun', 'un'],
  ['kin', 'in'], ['din', 'in'], ['fin', 'in'],
];
