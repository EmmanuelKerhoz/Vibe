/**
 * ha.ts — Lexique phonémique Hausa
 * ~200 entrées [word, rnKey] pour le PhonemeIndex de suggestRhymes().
 * Le Hausa est une langue chamito-sémitique à tons (haut H, bas L).
 * rnKey = noyau vocalique final + coda (tons ignorés dans la clé).
 * Orthographe standard (sans barre, sans tons diacritiques).
 */

export const haLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ─────────────────────────────────────────────────────────────────
  ['gida', 'a'], ['kasa', 'a'], ['hanya', 'a'], ['rana', 'a'],
  ['daba', 'a'], ['kafa', 'a'], ['banza', 'a'], ['dariya', 'a'],
  ['fada', 'a'], ['harka', 'a'], ['jama', 'a'], ['kama', 'a'],
  ['lamba', 'a'], ['magana', 'a'], ['nama', 'a'], ['raba', 'a'],
  ['salla', 'a'], ['taba', 'a'], ['wata', 'a'], ['yara', 'a'],
  ['zama', 'a'], ['abba', 'a'], ['baba', 'a'], ['mama', 'a'],
  ['fara', 'a'], ['gara', 'a'], ['karya', 'a'], ['masa', 'a'],
  ['tara', 'a'], ['wasa', 'a'],

  // ─── /an/ ────────────────────────────────────────────────────────────────
  ['dan', 'an'], ['ban', 'an'], ['kan', 'an'], ['ran', 'an'],
  ['jan', 'an'], ['nan', 'an'], ['san', 'an'], ['wan', 'an'],
  ['damban', 'an'], ['garban', 'an'],

  // ─── /e/ ─────────────────────────────────────────────────────────────────
  ['sake', 'e'], ['kane', 'e'], ['take', 'e'], ['make', 'e'],
  ['rake', 'e'], ['lake', 'e'], ['bake', 'e'], ['fare', 'e'],
  ['dare', 'e'], ['hare', 'e'], ['mare', 'e'], ['bare', 'e'],
  ['zare', 'e'], ['gare', 'e'], ['kare', 'e'],

  // ─── /i/ ─────────────────────────────────────────────────────────────────
  ['rafi', 'i'], ['kifi', 'i'], ['doki', 'i'], ['moki', 'i'],
  ['tafi', 'i'], ['yafi', 'i'], ['baki', 'i'], ['faki', 'i'],
  ['gari', 'i'], ['kari', 'i'], ['nari', 'i'], ['sari', 'i'],
  ['wuri', 'i'], ['zuri', 'i'], ['hari', 'i'], ['dari', 'i'],
  ['ciki', 'i'], ['daki', 'i'], ['raki', 'i'], ['waki', 'i'],
  ['sabi', 'i'], ['rabi', 'i'], ['kabi', 'i'],

  // ─── /in/ ────────────────────────────────────────────────────────────────
  ['cin', 'in'], ['din', 'in'], ['fin', 'in'], ['kin', 'in'],
  ['min', 'in'], ['nin', 'in'], ['sin', 'in'], ['tin', 'in'],
  ['warin', 'in'], ['kashin', 'in'], ['bazin', 'in'],

  // ─── /o/ ─────────────────────────────────────────────────────────────────
  ['kolo', 'o'], ['bolo', 'o'], ['dolo', 'o'], ['folo', 'o'],
  ['goro', 'o'], ['horo', 'o'], ['koro', 'o'], ['loro', 'o'],
  ['moro', 'o'], ['nono', 'o'], ['sono', 'o'], ['tono', 'o'],
  ['woro', 'o'], ['zoro', 'o'], ['boko', 'o'], ['doko', 'o'],
  ['foko', 'o'], ['koko', 'o'], ['moko', 'o'], ['roko', 'o'],

  // ─── /on/ ────────────────────────────────────────────────────────────────
  ['don', 'on'], ['kon', 'on'], ['ron', 'on'], ['son', 'on'],
  ['ton', 'on'], ['won', 'on'], ['bakon', 'on'], ['makon', 'on'],

  // ─── /u/ ─────────────────────────────────────────────────────────────────
  ['kuru', 'u'], ['guru', 'u'], ['duru', 'u'], ['furu', 'u'],
  ['huru', 'u'], ['bunu', 'u'], ['dunu', 'u'], ['kunu', 'u'],
  ['munu', 'u'], ['runu', 'u'], ['sunu', 'u'], ['tunu', 'u'],
  ['wutu', 'u'], ['zutu', 'u'], ['bubu', 'u'], ['dudu', 'u'],
  ['kudu', 'u'], ['sudu', 'u'],

  // ─── /un/ ────────────────────────────────────────────────────────────────
  ['dun', 'un'], ['fun', 'un'], ['kun', 'un'], ['run', 'un'],
  ['sun', 'un'], ['tun', 'un'], ['wun', 'un'], ['babun', 'un'],

  // ─── Mots courants — lexique lyrique hausa ───────────────────────────────
  ['soyayya', 'a'], ['zuciya', 'a'], ['farin ciki', 'i'],
  ['bakin ciki', 'i'], ['tsoro', 'o'], ['fushi', 'i'],
  ['murna', 'a'], ['damuwa', 'a'], ['rayuwa', 'a'],
  ['rai', 'ai'], ['so', 'o'], ['nema', 'a'], ['bege', 'e'],
  ['kishi', 'i'], ['godiya', 'a'], ['raha', 'a'],
  ['dadi', 'i'], ['wahala', 'a'], ['sauran', 'an'],
  ['duniya', 'a'], ['yawon', 'on'], ['kasuwanci', 'i'],
  ['yanci', 'i'], ['adalci', 'i'], ['gaskiya', 'a'],

  // ─── Terminaisons fréquentes en chant hausa ──────────────────────────────
  ['na', 'a'], ['ka', 'a'], ['ta', 'a'], ['ma', 'a'],
  ['da', 'a'], ['ba', 'a'], ['fa', 'a'], ['ga', 'a'],
  ['ni', 'i'], ['ki', 'i'], ['ti', 'i'], ['mi', 'i'],
  ['no', 'o'], ['ko', 'o'], ['to', 'o'], ['mo', 'o'],
  ['nu', 'u'], ['ku', 'u'], ['su', 'u'], ['mu', 'u'],
  ['ne', 'e'], ['ce', 'e'], ['ke', 'e'], ['me', 'e'],
];
