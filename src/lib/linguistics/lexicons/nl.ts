/**
 * nl.ts — Nederlands fonemisch lexicon
 * ~250 ingangen [woord, rnKey] voor de PhonemeIndex.
 * rnKey = finale klinker+coda cluster.
 */

export const nlLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /eɪ/ (mijn, tijd) ───────────────────────────────────────────────────
  ['mijn', 'ɛin'], ['tijd', 'ɛit'], ['wijk', 'ɛik'], ['rijk', 'ɛik'],
  ['blijf', 'ɛif'], ['schrijf', 'ɛif'], ['dijk', 'ɛik'], ['kijk', 'ɛik'],
  ['gelijk', 'əlɛik'], ['verschil', 'ɛrsxɪl'],

  // ─── /aʊ/ (nou, kou) ─────────────────────────────────────────────────────
  ['nou', 'ɑu'], ['kou', 'ɑu'], ['blauw', 'ɑu'], ['dauw', 'ɑu'],
  ['goud', 'ɑut'], ['oud', 'ɑut'], ['houd', 'ɑut'], ['trouw', 'ɑu'],
  ['vrouw', 'ɑu'], ['sneeuw', 'eːu'],

  // ─── /aː/ (naam, daad) ───────────────────────────────────────────────────
  ['naam', 'aːm'], ['daad', 'aːt'], ['staat', 'aːt'], ['graad', 'aːt'],
  ['maat', 'aːt'], ['saat', 'aːt'], ['praat', 'aːt'],
  ['zaal', 'aːl'], ['taal', 'aːl'], ['paal', 'aːl'], ['haal', 'aːl'],

  // ─── /eː/ (been, meen) ───────────────────────────────────────────────────
  ['been', 'eːn'], ['meen', 'eːn'], ['steen', 'eːn'], ['scheen', 'eːn'],
  ['reden', 'eːdən'], ['leven', 'eːvən'], ['geven', 'eːvən'], ['wegen', 'eːɣən'],
  ['bezweken', 'eːkən'], ['gekregen', 'eːɣən'],

  // ─── /iː/ (zien, dier) ───────────────────────────────────────────────────
  ['zien', 'iːn'], ['dier', 'iːr'], ['vier', 'iːr'], ['hier', 'iːr'],
  ['wie', 'iː'], ['nie', 'iː'], ['blij', 'ɛi'], ['vrij', 'ɛi'],
  ['spij', 'ɛi'], ['lij', 'ɛi'],

  // ─── /oː/ (groot, rood) ──────────────────────────────────────────────────
  ['groot', 'oːt'], ['rood', 'oːt'], ['brood', 'oːt'], ['dood', 'oːt'],
  ['moot', 'oːt'], ['boot', 'oːt'], ['noot', 'oːt'],
  ['boom', 'oːm'], ['room', 'oːm'], ['stroom', 'oːm'], ['droom', 'oːm'],

  // ─── /uː/ (boek, zoek) ───────────────────────────────────────────────────
  ['boek', 'uːk'], ['zoek', 'uːk'], ['hoek', 'uːk'], ['groek', 'uːk'],
  ['doen', 'uːn'], ['goen', 'uːn'], ['zoen', 'uːn'], ['groen', 'uːn'],

  // ─── /ɪ/ (dit, bit) ──────────────────────────────────────────────────────
  ['dit', 'ɪt'], ['bit', 'ɪt'], ['pit', 'ɪt'], ['hit', 'ɪt'],
  ['slim', 'ɪm'], ['dim', 'ɪm'], ['trim', 'ɪm'], ['film', 'ɪlm'],

  // ─── /ɛ/ (bed, web) ──────────────────────────────────────────────────────
  ['bed', 'ɛt'], ['web', 'ɛp'], ['lek', 'ɛk'], ['plek', 'ɛk'],
  ['trek', 'ɛk'], ['sec', 'ɛk'], ['tech', 'ɛk'],

  // ─── /ɑ/ (bad, dag) ──────────────────────────────────────────────────────
  ['bad', 'ɑt'], ['dag', 'ɑx'], ['slag', 'ɑx'], ['lag', 'ɑx'],
  ['mag', 'ɑx'], ['zag', 'ɑx'], ['had', 'ɑt'], ['glad', 'ɑt'],

  // ─── /œy/ (huis, uit) ────────────────────────────────────────────────────
  ['huis', 'œys'], ['uit', 'œyt'], ['kluit', 'œyt'], ['spuit', 'œyt'],
  ['trui', 'œy'], ['rui', 'œy'], ['bui', 'œy'], ['lui', 'œy'],
  ['kluif', 'œyf'], ['druif', 'œyf'],

  // ─── /ŋ/ (-ing suffix) ───────────────────────────────────────────────────
  ['kring', 'ɪŋ'], ['ding', 'ɪŋ'], ['zing', 'ɪŋ'], ['spring', 'ɪŋ'],
  ['woning', 'oːnɪŋ'], ['opleiding', 'ɛidɪŋ'], ['regering', 'eːrɪŋ'],
  ['beweging', 'eːɣɪŋ'], ['omgeving', 'eːvɪŋ'], ['uitdrukking', 'ɪŋ'],

  // ─── /lɪk/ (-lijk suffix) ────────────────────────────────────────────────
  ['moeilijk', 'ɛilɪk'], ['eerlijk', 'eːrlɪk'], ['duidelijk', 'œydəlɪk'],
  ['werkelijk', 'ɛrkəlɪk'], ['geweldig', 'əvɛldəx'], ['heerlijk', 'eːrlɪk'],
  ['prachtig', 'ɑxtəx'], ['machtig', 'ɑxtəx'],

  // ─── rap / urban ──────────────────────────────────────────────────────────
  ['flow', 'floː'], ['show', 'ʃoː'], ['bro', 'broː'], ['yo', 'joː'],
  ['rap', 'ɑp'], ['trap', 'ɑp'], ['beat', 'biːt'], ['feat', 'fiːt'],
  ['Amsterdam', 'ɑm'], ['Rotterdam', 'ɑm'],
  ['vibe', 'vɑib'], ['tribe', 'trɑib'], ['real', 'riːl'],
];
