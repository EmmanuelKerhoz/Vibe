/**
 * it.ts — Lessico fonetico italiano
 * ~300 voci [parola, rnKey] per il PhonemeIndex.
 * rnKey = nucleo finale vocale+coda.
 */

export const itLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ─────────────────────────────────────────────────────────────────
  ['vita', 'ita'], ['notte', 'ɔtte'], ['stella', 'ɛlla'], ['bella', 'ɛlla'],
  ['quella', 'ɛlla'], ['pella', 'ɛlla'], ['favella', 'ɛlla'],
  ['mia', 'ia'], ['via', 'ia'], ['magia', 'ia'], ['poesia', 'ia'],
  ['armonia', 'ia'], ['melodia', 'ia'], ['nostalgia', 'ia'],
  ['nulla', 'ulla'], ['bulla', 'ulla'], ['culla', 'ulla'],
  ['casa', 'aza'], ['rosa', 'oza'], ['cosa', 'oza'], ['sposa', 'oza'],
  ['posa', 'oza'], ['prosa', 'oza'], ['diagnosa', 'oza'],
  ['amore', 'amore'], ['cuore', 'wɔre'], ['dolore', 'olore'], ['errore', 'ɔre'],
  ['calore', 'alore'], ['valore', 'alore'], ['splendore', 'ɔre'],
  ['onore', 'ɔre'], ['terrore', 'ɔre'], ['furore', 'ɔre'],

  // ─── /aɾe/ infinitivi ────────────────────────────────────────────────────
  ['cantare', 'are'], ['parlare', 'are'], ['amare', 'are'], ['trovare', 'are'],
  ['pensare', 'are'], ['guardare', 'are'], ['chiamare', 'are'], ['portare', 'are'],
  ['tornare', 'are'], ['sperare', 'are'], ['restare', 'are'], ['passare', 'are'],
  ['aspettare', 'are'], ['ricordare', 'are'], ['dimenticare', 'are'],

  // ─── /eɾe/ infinitivi ─────────────────────────────────────────────────────
  ['vedere', 'ɛre'], ['cadere', 'ɛre'], ['sapere', 'ɛre'], ['potere', 'ɛre'],
  ['volere', 'ɛre'], ['avere', 'ɛre'], ['tacere', 'ɛre'], ['nascere', 'ɛre'],
  ['crescere', 'ɛre'], ['correre', 'ɔre'], ['perdere', 'ɛre'],

  // ─── /iɾe/ infinitivi ─────────────────────────────────────────────────────
  ['sentire', 'ire'], ['partire', 'ire'], ['venire', 'ire'], ['finire', 'ire'],
  ['salire', 'ire'], ['capire', 'ire'], ['soffrire', 'ire'], ['aprire', 'ire'],
  ['coprire', 'ire'], ['scoprire', 'ire'], ['costruire', 'ire'],

  // ─── /ɔre/ (core, sole) ──────────────────────────────────────────────────
  ['sole', 'ɔle'], ['vole', 'ɔle'], ['console', 'ɔle'], ['parole', 'ɔle'],
  ['pistole', 'ɔle'], ['viole', 'ɔle'],
  ['mare', 'are'], ['cielo', 'ɛlo'], ['campo', 'ampo'], ['fiore', 'jɔre'],
  ['cuore', 'wɔre'], ['tuore', 'wɔre'], ['fuore', 'wɔre'],

  // ─── /ɛnto/ (-mento/-vento) ──────────────────────────────────────────────
  ['momento', 'ɛnto'], ['vento', 'ɛnto'], ['cento', 'ɛnto'], ['lento', 'ɛnto'],
  ['tormento', 'ɛnto'], ['tormento', 'ɛnto'], ['strumento', 'ɛnto'],
  ['sentimento', 'ɛnto'], ['movimento', 'ɛnto'], ['nutrimento', 'ɛnto'],
  ['argomento', 'ɛnto'], ['firmamento', 'ɛnto'], ['tradimento', 'ɛnto'],

  // ─── /ione/ (-zione/-sione) ───────────────────────────────────────────────
  ['canzone', 'tsone'], ['nazione', 'tsone'], ['passione', 'ssione'],
  ['stagione', 'tsone'], ['ragione', 'tsone'], ['prigione', 'tsone'],
  ['visione', 'zjone'], ['decisione', 'zjone'], ['tensione', 'zjone'],
  ['emozione', 'tsone'], ['situazione', 'tsone'], ['educazione', 'tsone'],

  // ─── /ita/ participi passati ──────────────────────────────────────────────
  ['amata', 'ata'], ['cantata', 'ata'], ['trovata', 'ata'], ['persa', 'ɛrsa'],
  ['vinta', 'inta'], ['spenta', 'ɛnta'], ['accesa', 'eza'], ['promessa', 'ɛssa'],

  // ─── /ore/ maschile ───────────────────────────────────────────────────────
  ['cuore', 'wɔre'], ['odore', 'odore'], ['sapore', 'apore'], ['rumore', 'umore'],
  ['tenore', 'enore'], ['umore', 'umore'], ['autore', 'autore'],
  ['pittore', 'ittore'], ['dottore', 'ottore'], ['professore', 'essore'],

  // ─── /anza/-/enza/ ────────────────────────────────────────────────────────
  ['speranza', 'antsa'], ['distanza', 'antsa'], ['sostanza', 'antsa'],
  ['costanza', 'antsa'], ['danza', 'antsa'], ['lontananza', 'antsa'],
  ['presenza', 'ɛntsa'], ['assenza', 'ɛntsa'], ['essenza', 'ɛntsa'],
  ['apparenza', 'ɛntsa'], ['differenza', 'ɛntsa'], ['coscienza', 'ɛntsa'],

  // ─── /ondo/ ───────────────────────────────────────────────────────────────
  ['mondo', 'ondo'], ['fondo', 'ondo'], ['secondo', 'ondo'], ['profondo', 'ondo'],
  ['rotondo', 'ondo'], ['giocondo', 'ondo'],

  // ─── /ente/ ───────────────────────────────────────────────────────────────
  ['gente', 'ɛnte'], ['mente', 'ɛnte'], ['fronte', 'onte'], ['ponte', 'onte'],
  ['fonte', 'onte'], ['monte', 'onte'],
  ['fortemente', 'ɛnte'], ['dolcemente', 'ɛnte'], ['semplicemente', 'ɛnte'],

  // ─── /ura/ ────────────────────────────────────────────────────────────────
  ['natura', 'ura'], ['cultura', 'ura'], ['struttura', 'ura'], ['figura', 'ura'],
  ['creatura', 'ura'], ['apertura', 'ura'], ['lettura', 'ura'], ['avventura', 'ura'],

  // ─── /ento/ rima rap ──────────────────────────────────────────────────────
  ['flow', 'floː'], ['show', 'ʃoː'], ['rap', 'rap'], ['beat', 'bit'],
  ['street', 'strit'], ['feat', 'fit'], ['real', 'riːal'],
  ['Milano', 'ano'], ['Roma', 'oma'], ['Napoli', 'ɔli'], ['Palermo', 'ɛrmo'],
  ['sicuro', 'uro'], ['duro', 'uro'], ['puro', 'uro'], ['futuro', 'uro'],
  ['oscuro', 'uro'], ['maturo', 'uro'],
];
