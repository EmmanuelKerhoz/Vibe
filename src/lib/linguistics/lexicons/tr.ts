/**
 * tr.ts — Türkçe fonetik sözlük
 * ~250 giriş [kelime, rnKey] PhonemeIndex için.
 * rnKey = son sesli+koda kümesi.
 */

export const trLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ─────────────────────────────────────────────────────────────────
  ['sevda', 'a'], ['hayat', 'at'], ['kanat', 'at'], ['anat', 'at'],
  ['sanat', 'at'], ['baht', 'at'], ['vakit', 'it'], ['sabah', 'a'],
  ['Allah', 'a'], ['dünya', 'a'], ['para', 'a'], ['yara', 'a'],
  ['dara', 'a'], ['sara', 'a'], ['kara', 'a'], ['hara', 'a'],

  // ─── /an/ ─────────────────────────────────────────────────────────────────
  ['zaman', 'an'], ['duman', 'an'], ['roman', 'an'], ['yaban', 'an'],
  ['çoban', 'an'], ['sultan', 'an'], ['başkan', 'an'], ['kalkan', 'an'],
  ['insan', 'an'], ['hayvan', 'an'], ['heyecan', 'an'],

  // ─── /ar/ ─────────────────────────────────────────────────────────────────
  ['yar', 'ar'], ['diyar', 'ar'], ['bahar', 'ar'], ['karar', 'ar'],
  ['bazar', 'ar'], ['mezar', 'ar'], ['ihbar', 'ar'], ['itbar', 'ar'],
  ['intizar', 'ar'], ['kenar', 'ar'], ['pinar', 'ar'],

  // ─── /i/ ─────────────────────────────────────────────────────────────────
  ['şehir', 'ir'], ['emir', 'ir'], ['nefis', 'is'], ['kalp', 'alp'],
  ['renk', 'ɛŋk'], ['ses', 'ɛs'], ['gece', 'ɛtʃɛ'], ['bece', 'ɛtʃɛ'],
  ['kece', 'ɛtʃɛ'], ['geçe', 'ɛtʃɛ'],

  // ─── /iː/ ─────────────────────────────────────────────────────────────────
  ['deniz', 'iz'], ['yüz', 'yz'], ['söz', 'øz'], ['göz', 'øz'],
  ['kız', 'ɯz'], ['sıkız', 'ɯz'], ['topuz', 'uz'], ['tapuz', 'uz'],

  // ─── /u/ ─────────────────────────────────────────────────────────────────
  ['yol', 'ol'], ['dal', 'al'], ['cal', 'al'], ['hal', 'al'],
  ['nur', 'ur'], ['sur', 'ur'], ['kur', 'ur'], ['bur', 'ur'],
  ['gur', 'ur'], ['tur', 'ur'], ['şur', 'ur'],

  // ─── /y/ ─────────────────────────────────────────────────────────────────
  ['gül', 'yl'], ['bül', 'yl'], ['dül', 'yl'], ['hül', 'yl'],
  ['güç', 'ytʃ'], ['büyük', 'yk'], ['küçük', 'ytʃyk'],
  ['üzüm', 'yzym'], ['özüm', 'øzym'],

  // ─── /ɯ/ ─────────────────────────────────────────────────────────────────
  ['kıyı', 'ɯ'], ['balık', 'ɯk'], ['kapı', 'ɯ'], ['dağı', 'ɯ'],
  ['arı', 'ɯ'], ['sarı', 'ɯ'], ['karı', 'ɯ'], ['bağı', 'ɯ'],

  // ─── vowel harmony suffix families ──────────────────────────────────────
  ['sevgi', 'i'], ['kederi', 'i'], ['hazır', 'ɯr'], ['şehrin', 'in'],
  ['sevmek', 'ɛk'], ['gitmek', 'ɛk'], ['gelmek', 'ɛk'], ['bilmek', 'ɛk'],
  ['olmak', 'ak'], ['kalmak', 'ak'], ['yapmak', 'ak'], ['bakmak', 'ak'],

  // ─── /-lik / -lük / -lık suffix ───────────────────────────────────────────
  ['güzellik', 'ɛlik'], ['iyilik', 'ilik'], ['birlik', 'irlik'],
  ['yücelik', 'ɛlik'], ['ölümlük', 'ylyk'], ['gerçeklik', 'ɛlik'],
  ['gençlik', 'ɛtʃlik'], ['kötülük', 'ytlyk'],

  // ─── /-ış / -iş nominals ─────────────────────────────────────────────────
  ['bakış', 'ɯʃ'], ['gidiş', 'iʃ'], ['seviş', 'iʃ'], ['güliş', 'yʃ'],
  ['oluş', 'uʃ'], ['varış', 'ɯʃ'], ['giriş', 'iʃ'],

  // ─── rap / urban Turkish ─────────────────────────────────────────────────
  ['rap', 'ap'], ['trap', 'ap'], ['flow', 'floː'], ['beat', 'bit'],
  ['İstanbul', 'ul'], ['Ankara', 'a'], ['İzmir', 'ir'],
  ['vibe', 'vajb'], ['street', 'it'], ['freestyle', 'ajl'],
];
