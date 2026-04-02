const HANGUL_SYLLABLE_START = 0xac00;
const HANGUL_SYLLABLE_END = 0xd7a3;
const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30f6;
const KATAKANA_TO_HIRAGANA_OFFSET = 0x60;

const HAN_CHAR_RE = /\p{Script=Han}/u;
const KANA_CHAR_RE = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;

export function isHanCharacter(char: string): boolean {
  return HAN_CHAR_RE.test(char);
}

export function isHangulSyllable(char: string): boolean {
  const codePoint = char.codePointAt(0);
  return codePoint !== undefined && codePoint >= HANGUL_SYLLABLE_START && codePoint <= HANGUL_SYLLABLE_END;
}

export function isKana(char: string): boolean {
  return char === 'ー' || KANA_CHAR_RE.test(char);
}

export function katakanaToHiragana(text: string): string {
  return [...text].map((char) => {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined || codePoint < KATAKANA_START || codePoint > KATAKANA_END) {
      return char;
    }
    return String.fromCodePoint(codePoint - KATAKANA_TO_HIRAGANA_OFFSET);
  }).join('');
}
