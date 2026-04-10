/**
 * ja.ts — 日本語音節辞書 (Japanese Rhyme Lexicon)
 * ~250 entries [word, rnKey] for PhonemeIndex.
 * rnKey = final mora vowel (Japanese rhyme is purely vocalic).
 * Romanized form used as key for ASCII safety.
 */

export const jaLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ─────────────────────────────────────────────────────────────────
  ['空', 'a'], ['花', 'a'], ['夢', 'ɯ'], ['道', 'o'],
  ['空', 'ɔ'], ['波', 'a'], ['朝', 'a'], ['海', 'i'],
  ['星', 'i'], ['月', 'ɯ'], ['雪', 'ɯ'], ['霞', 'a'],
  ['桜', 'a'], ['愛', 'i'], ['命', 'i'], ['記憶', 'ɯ'],
  ['涙', 'a'], ['声', 'e'], ['光', 'a'], ['風', 'ɯ'],

  // ─── /a/ mora endings (romaji keys) ──────────────────────────────────────
  ['hana', 'a'], ['kawa', 'a'], ['sora', 'a'], ['yama', 'a'],
  ['naka', 'a'], ['shita', 'a'], ['mina', 'a'], ['hara', 'a'],
  ['uta', 'a'], ['kata', 'a'], ['mata', 'a'], ['asa', 'a'],

  // ─── /i/ mora endings ────────────────────────────────────────────────────
  ['hoshi', 'i'], ['umi', 'i'], ['machi', 'i'], ['noki', 'i'],
  ['toki', 'i'], ['suki', 'i'], ['tsuki', 'i'], ['yuki', 'i'],
  ['kimi', 'i'], ['kokoro', 'o'], ['hikari', 'i'], ['midori', 'i'],
  ['nagori', 'i'], ['negai', 'i'], ['itami', 'i'],

  // ─── /ɯ/ mora endings ────────────────────────────────────────────────────
  ['kaze', 'e'], ['yume', 'e'], ['kane', 'e'], ['ame', 'e'],
  ['ume', 'e'], ['hane', 'e'], ['sake', 'e'], ['take', 'e'],
  ['mune', 'e'], ['shizuke', 'e'], ['nagare', 'e'],
  ['kokorozu', 'ɯ'], ['kiku', 'ɯ'], ['tsuzuku', 'ɯ'],
  ['shizuku', 'ɯ'], ['katachi', 'i'],

  // ─── /e/ mora endings ────────────────────────────────────────────────────
  ['yake', 'e'], ['koe', 'e'], ['mae', 'e'], ['sore', 'e'],
  ['are', 'e'], ['dare', 'e'], ['kore', 'e'], ['dore', 'e'],
  ['naze', 'e'], ['aze', 'e'], ['maze', 'e'],

  // ─── /o/ mora endings ────────────────────────────────────────────────────
  ['hito', 'o'], ['moto', 'o'], ['soto', 'o'], ['futo', 'o'],
  ['koto', 'o'], ['goto', 'o'], ['oto', 'o'], ['shiro', 'o'],
  ['miro', 'o'], ['siro', 'o'], ['niro', 'o'], ['taro', 'o'],
  ['kokoro', 'o'], ['inochi', 'i'], ['omoide', 'e'],

  // ─── compound endings /ai/ ────────────────────────────────────────────────
  ['itai', 'ai'], ['kawaii', 'ai'], ['samurai', 'ai'], ['takai', 'ai'],
  ['yasai', 'ai'], ['banzai', 'ai'], ['warai', 'ai'], ['akai', 'ai'],

  // ─── compound endings /oi/ ────────────────────────────────────────────────
  ['sugoi', 'oi'], ['kawakoi', 'oi'], ['omoshiroi', 'oi'], ['furui', 'ɯi'],
  ['natsukashii', 'i'], ['ureshii', 'i'], ['kanashii', 'i'],

  // ─── rap / J-hip-hop ─────────────────────────────────────────────────────
  ['ライム', 'ɯ'], ['フロー', 'o'], ['ビート', 'o'], ['ラップ', 'ɯ'],
  ['rhyme', 'ajm'], ['flow', 'oː'], ['beat', 'it'], ['rap', 'ap'],
  ['Tokyo', 'o'], ['Osaka', 'a'],
];
