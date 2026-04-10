/**
 * es.ts — Lexique phonémique espagnol
 * ~300 entrées [word, rnKey] pour le PhonemeIndex de suggestRhymes().
 * rnKey = terminaison vocalique/consonantique de la rime.
 * L'espagnol est quasi-phonémique — le rnKey reflète la terminaison orthographique
 * (qui correspond directement à la prononciation).
 */

export const esLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ──────────────────────────────────────────────────────────────────
  ['alma', 'a'], ['calma', 'a'], ['palma', 'a'], ['llama', 'a'],
  ['fama', 'a'], ['cama', 'a'], ['drama', 'a'], ['panorama', 'a'],
  ['palabra', 'a'], ['sangre', 'aŋɡɾe'], ['madre', 'aðɾe'],
  ['tarde', 'aɾðe'], ['grande', 'ande'],

  // ─── /ar/ ─────────────────────────────────────────────────────────────────
  ['amar', 'ar'], ['cantar', 'ar'], ['soñar', 'ar'], ['brillar', 'ar'],
  ['volar', 'ar'], ['buscar', 'ar'], ['hablar', 'ar'], ['caminar', 'ar'],
  ['despertar', 'ar'], ['olvidar', 'ar'], ['recordar', 'ar'],
  ['lugar', 'ar'], ['mar', 'ar'], ['par', 'ar'], ['hogar', 'ar'],

  // ─── /al/ ─────────────────────────────────────────────────────────────────
  ['igual', 'al'], ['real', 'al'], ['ideal', 'al'], ['leal', 'al'],
  ['mortal', 'al'], ['vital', 'al'], ['brutal', 'al'], ['total', 'al'],
  ['final', 'al'], ['señal', 'al'], ['metal', 'al'], ['capital', 'al'],
  ['natural', 'al'], ['mundial', 'al'], ['especial', 'al'],

  // ─── /e/ ──────────────────────────────────────────────────────────────────
  ['cielo', 'elo'], ['suelo', 'elo'], ['vuelo', 'elo'], ['anhelo', 'elo'],
  ['cuerpo', 'eɾpo'], ['tiempo', 'empo'], ['miedo', 'edo'],
  ['dedo', 'edo'], ['credo', 'edo'],

  // ─── /er/ ─────────────────────────────────────────────────────────────────
  ['poder', 'er'], ['querer', 'er'], ['tener', 'er'], ['volver', 'er'],
  ['saber', 'er'], ['nacer', 'er'], ['crecer', 'er'], ['merecer', 'er'],
  ['mujer', 'er'], ['ayer', 'er'], ['placer', 'er'], ['ayer', 'er'],

  // ─── /es/ ─────────────────────────────────────────────────────────────────
  ['pies', 'es'], ['tres', 'es'], ['mes', 'es'], ['vez', 'es'],
  ['paz', 'as'], ['voz', 'os'], ['luz', 'us'], ['cruz', 'us'],
  ['noces', 'es'], ['verdes', 'es'], ['paredes', 'es'],

  // ─── /i/ ──────────────────────────────────────────────────────────────────
  ['aquí', 'i'], ['así', 'i'], ['allí', 'i'], ['feliz', 'is'],
  ['raíz', 'is'], ['maíz', 'is'], ['país', 'is'],
  ['vivir', 'ir'], ['sentir', 'ir'], ['morir', 'ir'], ['existir', 'ir'],
  ['sonreír', 'ir'], ['seguir', 'ir'],

  // ─── /ido/ ────────────────────────────────────────────────────────────────
  ['olvido', 'ido'], ['herido', 'ido'], ['perdido', 'ido'], ['querido', 'ido'],
  ['vivido', 'ido'], ['partido', 'ido'], ['nacido', 'ido'], ['tenido', 'ido'],
  ['sonido', 'ido'], ['latido', 'ido'], ['ruido', 'ido'],

  // ─── /o/ ──────────────────────────────────────────────────────────────────
  ['amor', 'or'], ['dolor', 'or'], ['calor', 'or'], ['color', 'or'],
  ['temor', 'or'], ['valor', 'or'], ['señor', 'or'], ['interior', 'or'],
  ['exterior', 'or'], ['mayor', 'or'], ['mejor', 'or'], ['peor', 'or'],
  ['corazón', 'on'], ['canción', 'on'], ['ilusión', 'on'], ['pasión', 'on'],
  ['razón', 'on'], ['nación', 'on'], ['emoción', 'on'], ['visión', 'on'],
  ['traición', 'on'], ['perdón', 'on'], ['balcón', 'on'],

  // ─── /ando/ / /iendo/ ─────────────────────────────────────────────────────
  ['amando', 'ando'], ['cantando', 'ando'], ['volando', 'ando'],
  ['soñando', 'ando'], ['llorando', 'ando'], ['esperando', 'ando'],
  ['viviendo', 'endo'], ['corriendo', 'endo'], ['cayendo', 'endo'],
  ['muriendo', 'endo'], ['mintiendo', 'endo'],

  // ─── /ado/ / /ada/ ───────────────────────────────────────────────────────
  ['nada', 'ada'], ['amada', 'ada'], ['mirada', 'ada'], ['llamada', 'ada'],
  ['madrugada', 'ada'], ['tarde', 'ade'], ['verdad', 'ad'],
  ['ciudad', 'ad'], ['libertad', 'ad'], ['eternidad', 'ad'],
  ['felicidad', 'ad'], ['realidad', 'ad'], ['voluntad', 'ad'],

  // ─── /eza/ ─────────────────────────────────────────────────────────────────
  ['belleza', 'esa'], ['tristeza', 'esa'], ['riqueza', 'esa'],
  ['naturaleza', 'esa'], ['pureza', 'esa'], ['firmeza', 'esa'],

  // ─── /ura/ ─────────────────────────────────────────────────────────────────
  ['ternura', 'ura'], ['locura', 'ura'], ['dulzura', 'ura'],
  ['amargura', 'ura'], ['altura', 'ura'], ['hermosura', 'ura'],
  ['figura', 'ura'], ['cultura', 'ura'], ['literatura', 'ura'],

  // ─── /ente/ / /mente/ ─────────────────────────────────────────────────────
  ['gente', 'ente'], ['mente', 'ente'], ['frente', 'ente'], ['puente', 'ente'],
  ['siempre', 'ente'], ['solamente', 'ente'], ['realmente', 'ente'],
  ['verdaderamente', 'ente'], ['simplemente', 'ente'],

  // ─── /ando rhymes for rap ─────────────────────────────────────────────────
  ['flow', 'o'], ['pro', 'o'], ['yo', 'o'], ['bro', 'o'],
  ['rap', 'ap'], ['trap', 'ap'], ['gap', 'ap'],
  ['beat', 'it'], ['street', 'it'], ['freestyle', 'il'],
  ['vibe', 'ib'], ['tribe', 'ib'],
];
