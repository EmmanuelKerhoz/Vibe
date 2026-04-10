/**
 * pt.ts — Lexique phonémique portugais (Portugal + Brésil)
 * ~280 entrées [word, rnKey].
 * rnKey = terminaison phonémique de la rime (voyelle + coda).
 * Couvre le portuñol et les variantes brésilienne/lusitanienne.
 */

export const ptLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ / /ar/ ───────────────────────────────────────────────────────────
  ['alma', 'alma'], ['calma', 'alma'], ['palma', 'alma'],
  ['fama', 'ama'], ['cama', 'ama'], ['drama', 'ama'],
  ['amar', 'ar'], ['cantar', 'ar'], ['sonhar', 'ar'], ['brilhar', 'ar'],
  ['voar', 'ar'], ['buscar', 'ar'], ['falar', 'ar'], ['caminar', 'ar'],
  ['lugar', 'ar'], ['mar', 'ar'], ['lar', 'ar'], ['par', 'ar'],

  // ─── /al/ ─────────────────────────────────────────────────────────────────
  ['igual', 'al'], ['real', 'al'], ['ideal', 'al'], ['leal', 'al'],
  ['mortal', 'al'], ['vital', 'al'], ['total', 'al'], ['final', 'al'],
  ['sinal', 'al'], ['metal', 'al'], ['capital', 'al'], ['natural', 'al'],
  ['mundial', 'al'], ['especial', 'al'],

  // ─── /e/ / /er/ / /es/ ───────────────────────────────────────────────────
  ['poder', 'er'], ['querer', 'er'], ['ter', 'er'], ['volver', 'er'],
  ['saber', 'er'], ['nascer', 'er'], ['crescer', 'er'], ['mulher', 'er'],
  ['ontem', 'em'], ['também', 'em'], ['alguém', 'em'], ['ninguém', 'em'],
  ['além', 'em'], ['bem', 'em'], ['sem', 'em'], ['tem', 'em'],

  // ─── /ão/ ─────────────────────────────────────────────────────────────────
  ['coração', 'ão'], ['canção', 'ão'], ['ilusão', 'ão'], ['paixão', 'ão'],
  ['razão', 'ão'], ['nação', 'ão'], ['emoção', 'ão'], ['visão', 'ão'],
  ['traição', 'ão'], ['perdão', 'ão'], ['não', 'ão'], ['mão', 'ão'],
  ['pão', 'ão'], ['chão', 'ão'], ['irmão', 'ão'], ['solidão', 'ão'],
  ['solidariedade', 'ade'],

  // ─── /ade/ ────────────────────────────────────────────────────────────────
  ['verdade', 'ade'], ['cidade', 'ade'], ['liberdade', 'ade'],
  ['eternidade', 'ade'], ['felicidade', 'ade'], ['realidade', 'ade'],
  ['vontade', 'ade'], ['qualidade', 'ade'], ['lealdade', 'ade'],

  // ─── /i/ / /ir/ ───────────────────────────────────────────────────────────
  ['aqui', 'i'], ['assim', 'im'], ['ali', 'i'], ['feliz', 'iz'],
  ['raiz', 'iz'], ['país', 'iz'],
  ['viver', 'ir'], ['sentir', 'ir'], ['sorrir', 'ir'], ['seguir', 'ir'],

  // ─── /ido/ / /ida/ ────────────────────────────────────────────────────────
  ['vida', 'ida'], ['querida', 'ida'], ['saída', 'ida'], ['partida', 'ida'],
  ['vindo', 'ido'], ['partido', 'ido'], ['nascido', 'ido'], ['perdido', 'ido'],
  ['esquecido', 'ido'], ['sofrido', 'ido'],

  // ─── /o/ / /or/ ───────────────────────────────────────────────────────────
  ['amor', 'or'], ['dor', 'or'], ['calor', 'or'], ['cor', 'or'],
  ['temor', 'or'], ['valor', 'or'], ['senhor', 'or'], ['interior', 'or'],
  ['melhor', 'or'], ['pior', 'or'], ['maior', 'or'],

  // ─── /eza/ / /ura/ ────────────────────────────────────────────────────────
  ['beleza', 'eza'], ['tristeza', 'eza'], ['riqueza', 'eza'],
  ['pureza', 'eza'], ['firmeza', 'eza'],
  ['ternura', 'ura'], ['loucura', 'ura'], ['doçura', 'ura'],
  ['amargura', 'ura'], ['altura', 'ura'], ['figura', 'ura'],
  ['cultura', 'ura'], ['literatura', 'ura'],

  // ─── /ente/ / /mente/ ─────────────────────────────────────────────────────
  ['gente', 'ente'], ['mente', 'ente'], ['frente', 'ente'], ['ponte', 'onte'],
  ['somente', 'ente'], ['realmente', 'ente'], ['verdadeiramente', 'ente'],

  // ─── /ando/ / /endo/ ──────────────────────────────────────────────────────
  ['amando', 'ando'], ['cantando', 'ando'], ['voando', 'ando'],
  ['sonhando', 'ando'], ['chorando', 'ando'], ['esperando', 'ando'],
  ['vivendo', 'endo'], ['correndo', 'endo'], ['caindo', 'endo'],
  ['morrendo', 'endo'], ['sorrindo', 'indo'],

  // ─── /inha/ / /inho/ ──────────────────────────────────────────────────────
  ['sozinha', 'inha'], ['rainha', 'inha'], ['minha', 'inha'],
  ['vizinha', 'inha'], ['menina', 'ina'],
  ['caminho', 'inho'], ['carinho', 'inho'], ['destino', 'ino'],

  // ─── urban / hip-hop ──────────────────────────────────────────────────────
  ['flow', 'o'], ['pro', 'o'], ['bro', 'o'],
  ['rap', 'ap'], ['trap', 'ap'], ['beat', 'it'],
  ['vibe', 'ib'], ['tribe', 'ib'],
];
