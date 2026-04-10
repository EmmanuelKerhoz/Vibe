/**
 * ro.ts — Lexic fonemic român
 * ~250 intrări [cuvânt, rnKey] pentru PhonemeIndex.
 * rnKey = nucleul rimei (vocală finală + codă).
 */

export const roLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ─────────────────────────────────────────────────────────────────
  ['inimă', 'imə'], ['lumea', 'umea'], ['seara', 'ara'], ['vara', 'ara'],
  ['primăvara', 'ara'], ['țara', 'ara'], ['oara', 'wara'], ['floare', 'ware'],
  ['soare', 'ware'], ['oare', 'ware'], ['coare', 'ware'],
  ['viața', 'jatsa'], ['clipa', 'ipa'], ['ripa', 'ipa'], ['aripa', 'ipa'],

  // ─── /e/ ─────────────────────────────────────────────────────────────────
  ['mele', 'ele'], ['tele', 'ele'], ['sele', 'ele'],
  ['noapte', 'apte'], ['carte', 'arte'], ['parte', 'arte'],
  ['frate', 'ate'], ['sate', 'ate'], ['moarte', 'warte'],
  ['verde', 'erde'], ['pierde', 'jerde'], ['crede', 'ede'],
  ['vede', 'ede'], ['cade', 'ade'], ['merge', 'erge'],

  // ─── /i/ ─────────────────────────────────────────────────────────────────
  ['iubi', 'ubi'], ['veni', 'eni'], ['pleci', 'etʃi'], ['crezi', 'ezi'],
  ['simți', 'imtsi'], ['ochi', 'oki'], ['nochi', 'oki'],
  ['visuri', 'uri'], ['doruri', 'uri'], ['glasuri', 'uri'],
  ['timpuri', 'uri'], ['chipuri', 'uri'],

  // ─── /ire/ infinitive ────────────────────────────────────────────────────
  ['iubire', 'ire'], ['venire', 'ire'], ['simțire', 'ire'], ['gândire', 'ire'],
  ['trăire', 'ire'], ['dorime', 'ime'], ['tăcere', 'ɛre'], ['vedere', 'ɛre'],
  ['putere', 'ɛre'], ['durere', 'ɛre'], ['plăcere', 'ɛre'],

  // ─── /or/ ─────────────────────────────────────────────────────────────────
  ['dor', 'or'], ['cor', 'or'], ['zor', 'or'], ['nor', 'or'],
  ['izvor', 'or'], ['condor', 'or'], ['tuturor', 'or'],
  ['amor', 'or'], ['onor', 'or'], ['tricolor', 'or'],

  // ─── /oare/ ───────────────────────────────────────────────────────────────
  ['oare', 'ware'], ['oare', 'ware'], ['oare', 'ware'],
  ['valoare', 'ware'], ['culoare', 'ware'], ['cântare', 'are'],
  ['uitare', 'are'], ['visare', 'are'], ['speranță', 'antsa'],

  // ─── /ân/ / /în/ ─────────────────────────────────────────────────────────
  ['gând', 'ɨnd'], ['vânt', 'ɨnt'], ['cânt', 'ɨnt'], ['pânt', 'ɨnt'],
  ['câmp', 'ɨmp'], ['sânt', 'ɨnt'], ['mânt', 'ɨnt'],
  ['dânsul', 'ɨnsul'], ['împreună', 'ɨmpreunə'],

  // ─── /ul/ / /ului/ ────────────────────────────────────────────────────────
  ['cerul', 'erul'], ['stelele', 'elele'], ['noaptea', 'aptea'],
  ['sufletul', 'uflɛtul'], ['inima', 'imə'], ['iubitul', 'ubitʊl'],

  // ─── /esc/ ───────────────────────────────────────────────────────────────
  ['cresc', 'ɛsk'], ['măresc', 'ɛsk'], ['sporesc', 'ɛsk'], ['iubesc', 'ɛsk'],
  ['trăiesc', 'ɛsk'], ['simțesc', 'ɛsk'], ['gândesc', 'ɛsk'],
  ['povestesc', 'ɛsk'], ['înfloresc', 'ɛsk'],

  // ─── /ând/ participe ─────────────────────────────────────────────────────
  ['plângând', 'ɨnd'], ['cântând', 'ɨnd'], ['visând', 'ɨnd'],
  ['iubind', 'ind'], ['venind', 'ind'], ['mergând', 'ɨnd'],

  // ─── /ume/ ────────────────────────────────────────────────────────────────
  ['lume', 'ume'], ['fume', 'ume'], ['anume', 'ume'], ['renume', 'ume'],
  ['costume', 'ume'], ['parfume', 'ume'],

  // ─── /ine/ ────────────────────────────────────────────────────────────────
  ['bine', 'ine'], ['sine', 'ine'], ['mine', 'ine'], ['pline', 'ine'],
  ['destine', 'ine'], ['vecine', 'ine'], ['luminine', 'ine'],

  // ─── /ult/ ────────────────────────────────────────────────────────────────
  ['mult', 'ult'], ['cult', 'ult'], ['adult', 'ult'], ['rezultat', 'ultat'],

  // ─── /are/ ────────────────────────────────────────────────────────────────
  ['mare', 'are'], ['tare', 'are'], ['care', 'are'], ['pare', 'are'],
  ['sare', 'are'], ['zare', 'are'], ['zboare', 'ware'],

  // ─── rap / urban ──────────────────────────────────────────────────────────
  ['flow', 'floː'], ['show', 'ʃoː'], ['beat', 'bit'], ['feat', 'fit'],
  ['București', 'ɨʃti'], ['Cluj', 'luʒ'], ['Iași', 'jaʃi'],
  ['vibe', 'vajb'], ['tribe', 'trajb'],
];
