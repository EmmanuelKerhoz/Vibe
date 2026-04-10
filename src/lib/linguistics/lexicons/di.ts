/**
 * di.ts — Lexique phonémique Dioula / Jula (ISO 639-3: dyu)
 * ~200 entrées [word, rnKey] pour le PhonemeIndex de suggestRhymes().
 * Le Dioula est une langue mandé (Côte d'Ivoire, Burkina Faso, Mali).
 * Code interne du LID : 'di'.
 * rnKey = noyau vocalique final + coda (tons ignorés dans la clé).
 * Orthographe Dioula standard (alphabet latin, avec ɛ ɔ ŋ).
 */

export const diLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ─────────────────────────────────────────────────────────────────
  ['a', 'a'], ['ka', 'a'], ['na', 'a'], ['ba', 'a'],
  ['da', 'a'], ['fa', 'a'], ['ga', 'a'], ['ja', 'a'],
  ['la', 'a'], ['ma', 'a'], ['sa', 'a'], ['ta', 'a'],
  ['wa', 'a'], ['ya', 'a'], ['kana', 'a'], ['mana', 'a'],
  ['bana', 'a'], ['dana', 'a'], ['fana', 'a'], ['jana', 'a'],
  ['lana', 'a'], ['sana', 'a'], ['tana', 'a'], ['wana', 'a'],
  ['folo', 'a'], ['kama', 'a'], ['sama', 'a'], ['tama', 'a'],
  ['wara', 'a'], ['yara', 'a'], ['bara', 'a'], ['dara', 'a'],

  // ─── /an/ ────────────────────────────────────────────────────────────────
  ['kan', 'an'], ['ban', 'an'], ['dan', 'an'], ['fan', 'an'],
  ['jan', 'an'], ['lan', 'an'], ['man', 'an'], ['nan', 'an'],
  ['san', 'an'], ['tan', 'an'], ['wan', 'an'], ['yan', 'an'],
  ['kɔfɛn', 'an'], ['mɔgɔ', 'an'],

  // ─── /e/ ─────────────────────────────────────────────────────────────────
  ['be', 'e'], ['ke', 'e'], ['ne', 'e'], ['de', 'e'],
  ['fe', 'e'], ['ge', 'e'], ['je', 'e'], ['le', 'e'],
  ['me', 'e'], ['se', 'e'], ['te', 'e'], ['we', 'e'],
  ['ye', 'e'], ['kene', 'e'], ['mene', 'e'], ['bene', 'e'],
  ['dene', 'e'], ['fene', 'e'], ['jene', 'e'], ['lene', 'e'],
  ['sene', 'e'], ['tene', 'e'], ['wene', 'e'], ['yene', 'e'],

  // ─── /ɛ/ ─────────────────────────────────────────────────────────────────
  ['bɛ', 'ɛ'], ['kɛ', 'ɛ'], ['nɛ', 'ɛ'], ['dɛ', 'ɛ'],
  ['fɛ', 'ɛ'], ['gɛ', 'ɛ'], ['jɛ', 'ɛ'], ['lɛ', 'ɛ'],
  ['mɛ', 'ɛ'], ['sɛ', 'ɛ'], ['tɛ', 'ɛ'], ['wɛ', 'ɛ'],
  ['yɛ', 'ɛ'], ['kɔfɛ', 'ɛ'], ['kɛlɛ', 'ɛ'], ['sɛbɛ', 'ɛ'],
  ['tɛmɛ', 'ɛ'], ['wɛrɛ', 'ɛ'], ['yɛlɛ', 'ɛ'],

  // ─── /i/ ─────────────────────────────────────────────────────────────────
  ['bi', 'i'], ['ki', 'i'], ['ni', 'i'], ['di', 'i'],
  ['fi', 'i'], ['gi', 'i'], ['ji', 'i'], ['li', 'i'],
  ['mi', 'i'], ['si', 'i'], ['ti', 'i'], ['wi', 'i'],
  ['yi', 'i'], ['kini', 'i'], ['mini', 'i'], ['bini', 'i'],
  ['dini', 'i'], ['fini', 'i'], ['jini', 'i'], ['lini', 'i'],
  ['sini', 'i'], ['tini', 'i'], ['wini', 'i'], ['yini', 'i'],
  ['kisi', 'i'], ['misi', 'i'], ['bisi', 'i'], ['disi', 'i'],

  // ─── /o/ ─────────────────────────────────────────────────────────────────
  ['bo', 'o'], ['ko', 'o'], ['no', 'o'], ['do', 'o'],
  ['fo', 'o'], ['go', 'o'], ['jo', 'o'], ['lo', 'o'],
  ['mo', 'o'], ['so', 'o'], ['to', 'o'], ['wo', 'o'],
  ['yo', 'o'], ['kono', 'o'], ['mono', 'o'], ['bono', 'o'],
  ['dono', 'o'], ['fono', 'o'], ['jono', 'o'], ['lono', 'o'],
  ['sono', 'o'], ['tono', 'o'], ['wono', 'o'], ['yono', 'o'],

  // ─── /ɔ/ ─────────────────────────────────────────────────────────────────
  ['bɔ', 'ɔ'], ['kɔ', 'ɔ'], ['nɔ', 'ɔ'], ['dɔ', 'ɔ'],
  ['fɔ', 'ɔ'], ['gɔ', 'ɔ'], ['jɔ', 'ɔ'], ['lɔ', 'ɔ'],
  ['mɔ', 'ɔ'], ['sɔ', 'ɔ'], ['tɔ', 'ɔ'], ['wɔ', 'ɔ'],
  ['yɔ', 'ɔ'], ['mɔgɔ', 'ɔ'], ['dɔnɔ', 'ɔ'], ['kɔrɔ', 'ɔ'],
  ['sɔrɔ', 'ɔ'], ['tɔnɔ', 'ɔ'], ['wɔlɔ', 'ɔ'], ['yɔrɔ', 'ɔ'],

  // ─── /u/ ─────────────────────────────────────────────────────────────────
  ['bu', 'u'], ['ku', 'u'], ['nu', 'u'], ['du', 'u'],
  ['fu', 'u'], ['gu', 'u'], ['ju', 'u'], ['lu', 'u'],
  ['mu', 'u'], ['su', 'u'], ['tu', 'u'], ['wu', 'u'],
  ['yu', 'u'], ['kunu', 'u'], ['munu', 'u'], ['bunu', 'u'],
  ['dunu', 'u'], ['funu', 'u'], ['junu', 'u'], ['lunu', 'u'],
  ['sunu', 'u'], ['tunu', 'u'], ['wunu', 'u'], ['yunu', 'u'],

  // ─── Mots courants — lexique lyrique dioula ──────────────────────────────
  ['ko', 'o'], ['bɛ', 'ɛ'], ['tun', 'un'], ['bi', 'i'],
  ['don', 'on'], ['mogo', 'o'], ['kama', 'a'], ['folo', 'o'],
  ['minnu', 'u'], ['kɔni', 'i'], ['nka', 'a'], ['hali', 'i'],
  ['dɔ', 'ɔ'], ['kelen', 'en'], ['fila', 'a'], ['saba', 'a'],
  ['naani', 'i'], ['duuru', 'u'], ['wolonwula', 'a'],
  ['ɲɛ', 'ɛ'], ['ɲɔgɔn', 'on'], ['sɔrɔ', 'ɔ'], ['kɔrɔ', 'ɔ'],
  ['taama', 'a'], ['ɲini', 'i'], ['kɛlɛ', 'ɛ'], ['wari', 'i'],
  ['duguma', 'a'], ['sanfɛ', 'ɛ'], ['kɔfɛ', 'ɛ'],

  // ─── Terminaisons fréquentes en chant dioula ─────────────────────────────
  ['la', 'a'], ['na', 'a'], ['ta', 'a'], ['ma', 'a'],
  ['da', 'a'], ['ba', 'a'], ['fa', 'a'], ['ka', 'a'],
  ['li', 'i'], ['ni', 'i'], ['ti', 'i'], ['mi', 'i'],
  ['lɔ', 'ɔ'], ['nɔ', 'ɔ'], ['tɔ', 'ɔ'], ['mɔ', 'ɔ'],
  ['lu', 'u'], ['nu', 'u'], ['tu', 'u'], ['mu', 'u'],
  ['lɛ', 'ɛ'], ['nɛ', 'ɛ'], ['tɛ', 'ɛ'], ['mɛ', 'ɛ'],
];
