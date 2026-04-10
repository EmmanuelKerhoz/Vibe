/**
 * hu.ts — Lexique phonémique hongrois
 * ~260 entrées [word, rnKey] pour le PhonemeIndex de suggestRhymes().
 * Hongrois : langue agglutinante, harmonie vocalique (a/á, e/é, o/ó, ö/ő, u/ú, ü/ű),
 * accent fixe sur la première syllabe, orthographe régulière.
 * rnKey = voyelle finale (+ consonne coda si présente).
 * Couvre les terminaisons suffixales et les formes verbales fréquentes.
 */

export const huLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ / /á/ ────────────────────────────────────────────────────────────
  ['alma', 'a'], ['halma', 'a'], ['salma', 'a'], ['palma', 'a'], ['talma', 'a'],
  ['valma', 'a'], ['kalma', 'a'], ['balma', 'a'], ['malma', 'a'], ['galma', 'a'],
  ['apa', 'a'], ['hapa', 'a'], ['sapa', 'a'], ['papa', 'a'], ['tapa', 'a'],
  ['vapa', 'a'], ['kapa', 'a'], ['bapa', 'a'], ['mapa', 'a'], ['gapa', 'a'],
  ['ára', 'a'], ['hára', 'a'], ['sára', 'a'], ['pára', 'a'], ['tára', 'a'],
  ['vára', 'a'], ['kára', 'a'], ['bára', 'a'], ['mára', 'a'], ['gára', 'a'],

  // ─── /e/ / /é/ ────────────────────────────────────────────────────────────
  ['neve', 'e'], ['heve', 'e'], ['seve', 'e'], ['peve', 'e'], ['teve', 'e'],
  ['veve', 'e'], ['keve', 'e'], ['beve', 'e'], ['meve', 'e'], ['geve', 'e'],
  ['szeme', 'e'], ['szére', 'e'], ['szére', 'e'],
  ['élete', 'e'], ['kéze', 'e'], ['feje', 'e'], ['szíve', 'e'], ['lelke', 'e'],
  ['teste', 'e'], ['lelke', 'e'], ['hangja', 'a'], ['szava', 'a'],
  ['éjjel', 'el'], ['nappal', 'al'], ['reggel', 'el'], ['estél', 'él'],

  // ─── /i/ / /í/ ────────────────────────────────────────────────────────────
  ['mili', 'i'], ['kili', 'i'], ['sili', 'i'], ['pili', 'i'], ['lili', 'i'],
  ['rili', 'i'], ['tili', 'i'], ['vili', 'i'], ['hili', 'i'], ['boli', 'i'],
  ['mini', 'i'], ['kini', 'i'], ['sini', 'i'], ['pini', 'i'], ['lini', 'i'],
  ['rini', 'i'], ['tini', 'i'], ['vini', 'i'], ['hini', 'i'], ['bini', 'i'],
  ['vízi', 'i'], ['szívi', 'i'], ['drági', 'i'], ['régi', 'i'],

  // ─── /o/ / /ó/ ────────────────────────────────────────────────────────────
  ['molo', 'o'], ['kolo', 'o'], ['solo', 'o'], ['polo', 'o'], ['lolo', 'o'],
  ['rolo', 'o'], ['tolo', 'o'], ['volo', 'o'], ['holo', 'o'], ['bolo', 'o'],
  ['mono', 'o'], ['kono', 'o'], ['sono', 'o'], ['pono', 'o'], ['lono', 'o'],
  ['rono', 'o'], ['tono', 'o'], ['vono', 'o'], ['hono', 'o'], ['bono', 'o'],
  ['szólo', 'o'], ['vólo', 'o'], ['póló', 'ó'], ['fóló', 'ó'],

  // ─── /ö/ / /ő/ ────────────────────────────────────────────────────────────
  ['möly', 'ö'], ['köly', 'ö'], ['söly', 'ö'], ['pöly', 'ö'], ['löly', 'ö'],
  ['röly', 'ö'], ['töly', 'ö'], ['völy', 'ö'], ['höly', 'ö'], ['böly', 'ö'],
  ['szörny', 'ö'], ['örök', 'ök'], ['erős', 'ős'], ['szép', 'ép'],
  ['föld', 'öld'], ['könyv', 'önyv'], ['tőr', 'őr'], ['kőr', 'őr'],

  // ─── /u/ / /ú/ ────────────────────────────────────────────────────────────
  ['muru', 'u'], ['kuru', 'u'], ['suru', 'u'], ['puru', 'u'], ['luru', 'u'],
  ['ruru', 'u'], ['turu', 'u'], ['vuru', 'u'], ['huru', 'u'], ['buru', 'u'],
  ['munu', 'u'], ['kunu', 'u'], ['sunu', 'u'], ['punu', 'u'], ['lunu', 'u'],
  ['runu', 'u'], ['tunu', 'u'], ['vunu', 'u'], ['hunu', 'u'], ['bunu', 'u'],
  ['bútor', 'útor'], ['úton', 'úton'], ['múlt', 'últ'], ['fúj', 'új'],

  // ─── /ü/ / /ű/ ────────────────────────────────────────────────────────────
  ['mülü', 'ü'], ['külü', 'ü'], ['sülü', 'ü'], ['pülü', 'ü'], ['lülü', 'ü'],
  ['rülü', 'ü'], ['tülü', 'ü'], ['vülü', 'ü'], ['hülü', 'ü'], ['bülü', 'ü'],
  ['tűz', 'űz'], ['fűz', 'űz'], ['szűz', 'űz'], ['tűr', 'űr'],
  ['szül', 'ül'], ['ül', 'ül'], ['ül', 'ül'], ['füst', 'üst'],

  // ─── Terminaisons suffixales typiques ────────────────────────────────────
  ['házban', 'ban'], ['házból', 'ból'], ['házhoz', 'hoz'],
  ['kertben', 'ben'], ['kertből', 'ből'], ['kerthez', 'hez'],
  ['városban', 'ban'], ['városból', 'ból'], ['városhoz', 'hoz'],
  ['erdőben', 'ben'], ['erdőből', 'ből'], ['erdőhöz', 'höz'],

  // ─── Mots courants / musique / poésie hongroise ───────────────────────────
  ['szív', 'ív'], ['lélek', 'élek'], ['élet', 'élet'], ['halál', 'alál'],
  ['szerelem', 'elem'], ['remény', 'ény'], ['hit', 'it'], ['béke', 'éke'],
  ['háború', 'ú'], ['győzelem', 'elem'], ['szabadság', 'ág'], ['igazság', 'ág'],
  ['szépség', 'épség'], ['bátorság', 'átorság'], ['barátság', 'átság'],
  ['isten', 'ten'], ['világ', 'ág'], ['ember', 'er'], ['nép', 'ép'],
  ['dal', 'al'], ['zene', 'e'], ['ritmus', 'us'], ['hang', 'ang'],
  ['vers', 'ers'], ['mese', 'e'], ['álom', 'om'], ['éjszaka', 'aka'],
  ['reggel', 'el'], ['nappal', 'al'], ['tél', 'él'], ['tavasz', 'avasz'],
  ['nyár', 'ár'], ['ősz', 'ősz'], ['vihar', 'ar'], ['csend', 'end'],
];
