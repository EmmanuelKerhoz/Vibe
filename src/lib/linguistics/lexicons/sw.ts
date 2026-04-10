/**
 * sw.ts — Lexique phonémique swahili (Kiswahili)
 * ~280 entrées [word, rnKey] pour le PhonemeIndex de suggestRhymes().
 * Le swahili est quasi-phonémique, orthographe régulière, accent pénultième.
 * rnKey = terminaison vocalique + coda (voyelle finale pour la plupart des mots).
 * Couvre les terminaisons de classe nominale et les formes verbales fréquentes.
 */

export const swLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ — classe nominale ki-/vi, infinitifs ────────────────────────────
  ['mama', 'a'], ['baba', 'a'], ['dada', 'a'], ['nana', 'a'],
  ['paka', 'a'], ['nyota', 'a'], ['vita', 'a'], ['mwamba', 'a'],
  ['sawa', 'a'], ['ndoa', 'a'], ['hewa', 'a'], ['njia', 'a'],
  ['mwiba', 'a'], ['starehe', 'a'], ['pamoja', 'a'],

  // ─── /ana/ / /ama/ ────────────────────────────────────────────────────────
  ['tazama', 'ama'], ['karibu', 'u'], ['wajibu', 'u'],
  ['habari', 'i'], ['safari', 'i'], ['bahati', 'i'],

  // ─── /e/ ──────────────────────────────────────────────────────────────────
  ['wote', 'e'], ['barabara', 'a'], ['mbele', 'ele'],
  ['nyumba', 'a'], ['teke', 'eke'], ['peke', 'eke'],
  ['pete', 'ete'], ['mlete', 'ete'], ['lete', 'ete'],

  // ─── Verbe infinitif -a ────────────────────────────────────────────────────
  ['penda', 'enda'], ['imba', 'imba'], ['omba', 'omba'],
  ['enda', 'enda'], ['soma', 'oma'], ['tuma', 'uma'],
  ['lipa', 'ipa'], ['piga', 'iga'], ['toka', 'oka'],
  ['ruka', 'uka'], ['sema', 'ema'], ['tema', 'ema'],
  ['piga', 'iga'], ['cheza', 'eza'], ['leza', 'eza'],

  // ─── Formes verbales négatives / -ji ─────────────────────────────────────
  ['ambia', 'ia'], ['niambie', 'ie'], ['nakupenda', 'enda'],
  ['nitakuja', 'uja'], ['tutakwenda', 'enda'],

  // ─── /i/ ──────────────────────────────────────────────────────────────────
  ['mimi', 'i'], ['wewe', 'e'], ['yeye', 'e'],
  ['nchi', 'i'], ['uchi', 'i'], ['dachi', 'i'],
  ['roho', 'o'], ['moyo', 'o'], ['hofu', 'u'],
  ['furaha', 'a'], ['huzuni', 'i'], ['upendo', 'endo'],
  ['uhuru', 'u'], ['amani', 'i'], ['imani', 'i'],

  // ─── /o/ ──────────────────────────────────────────────────────────────────
  ['nyumbao', 'ao'], ['rafiki', 'i'], ['polisi', 'i'],
  ['baridi', 'i'], ['haridi', 'i'], ['ugomvi', 'i'],
  ['wimbo', 'imbo'], ['chombo', 'ombo'], ['tumbo', 'umbo'],

  // ─── /u/ ──────────────────────────────────────────────────────────────────
  ['mtu', 'u'], ['kitu', 'u'], ['kiatu', 'u'], ['chakula', 'ula'],
  ['sanamu', 'amu'], ['elimu', 'imu'], ['thamani', 'ani'],
  ['kusudi', 'udi'], ['nguvu', 'uvu'], ['mvua', 'ua'],
  ['dua', 'ua'], ['jua', 'ua'], ['hua', 'ua'],

  // ─── /endo/ / /undo/ / /inda/ ────────────────────────────────────────────
  ['upendo', 'endo'], ['mwendo', 'endo'], ['mapenzi', 'enzi'],
  ['nguvu', 'uvu'], ['ushindi', 'indi'], ['mapinduzi', 'uzi'],

  // ─── /isha/ / /esha/ ──────────────────────────────────────────────────────
  ['mwalimu', 'imu'], ['karibisho', 'isho'], ['amrisha', 'isha'],
  ['ongelesha', 'esha'],

  // ─── Mots courants chant / hip-hop swahili ───────────────────────────────
  ['bongo', 'ongo'], ['mshindo', 'indo'], ['mchezo', 'ezo'],
  ['msisimko', 'imko'], ['damu', 'amu'], ['jeshi', 'eshi'],
  ['shida', 'ida'], ['raha', 'aha'], ['tabia', 'ia'],
  ['akili', 'ili'], ['nguvu', 'uvu'], ['bidii', 'idii'],
  ['heshima', 'ima'], ['ujasiri', 'iri'], ['mapambano', 'ano'],
  ['maisha', 'aisha'], ['ndoto', 'oto'], ['mtoto', 'oto'],
  ['mzigo', 'igo'], ['msumari', 'ari'], ['neno', 'eno'],
  ['jibu', 'ibu'], ['jicho', 'icho'], ['kimbia', 'ia'],
];
