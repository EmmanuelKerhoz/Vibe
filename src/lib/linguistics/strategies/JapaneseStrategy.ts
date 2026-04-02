import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';
import { isHanCharacter, isKana, katakanaToHiragana } from '../utils';

type Mora = {
  onset: string;
  nucleus: string;
  raw: string;
};

const JAPANESE_VOWELS = ['a', 'i', 'u', 'e', 'o'] as const;
const KANA_DIGRAPH_MAP: Record<string, string> = {
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
};
const KANA_MONOGRAPH_MAP: Record<string, string> = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'o', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
  'ゔ': 'vu',
};

export class JapaneseStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-JAP' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,
    weight: 0.0,
    codaClass: 0.0,
    threshold: 0.75,
  };

  normalize(text: string, _lang: string): string {
    return text.normalize('NFC').toLowerCase().trim()
      .replace(/[^\p{L}\p{M}\p{Script=Han}\sー'-]/gu, '');
  }

  g2p(normalized: string, _lang: string): string {
    return normalized
      .split(/\s+/u)
      .filter(Boolean)
      .flatMap((token) => romanizeJapaneseWord(token).map((mora) => mora.raw))
      .join(' ');
  }

  syllabify(ipa: string, _lang: string): Syllable[] {
    const syllables = ipa.split(/\s+/u).filter(Boolean).map(buildJapaneseMora);

    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    const last = syllables[syllables.length - 1];

    return {
      nucleus: last?.nucleus ?? '',
      coda: '',
      toneClass: null,
      weight: null,
      codaClass: null,
      raw: last?.nucleus ?? '',
    };
  }

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

function romanizeJapaneseWord(word: string): Mora[] {
  const normalized = katakanaToHiragana(word.normalize('NFC'));
  const morae: Mora[] = [];
  let index = 0;

  while (index < normalized.length) {
    const char = normalized[index]!;
    const pair = normalized.slice(index, index + 2);

    if (char === 'っ') {
      morae.push({ onset: '', nucleus: 'q', raw: 'q' });
      index += 1;
      continue;
    }

    if (char === 'ー') {
      const previousVowel = morae.length > 0 ? extractJapaneseVowel(morae[morae.length - 1]!.raw) : '';
      if (previousVowel) {
        morae.push({ onset: '', nucleus: previousVowel, raw: previousVowel });
      }
      index += 1;
      continue;
    }

    if (KANA_DIGRAPH_MAP[pair]) {
      morae.push(toJapaneseMora(KANA_DIGRAPH_MAP[pair]!));
      index += 2;
      continue;
    }

    if (KANA_MONOGRAPH_MAP[char]) {
      morae.push(toJapaneseMora(KANA_MONOGRAPH_MAP[char]!));
      index += 1;
      continue;
    }

    if (isHanCharacter(char) || !isKana(char)) {
      morae.push({ onset: '', nucleus: char, raw: char });
    }
    index += 1;
  }

  return morae;
}

function toJapaneseMora(raw: string): Mora {
  const vowel = extractJapaneseVowel(raw);
  if (!vowel || raw === 'n' || raw === 'q') {
    return {
      onset: '',
      nucleus: raw,
      raw,
    };
  }

  return {
    onset: raw.slice(0, raw.length - vowel.length),
    nucleus: vowel,
    raw,
  };
}

function buildJapaneseMora(token: string): Syllable {
  const mora = toJapaneseMora(token);
  return {
    onset: mora.onset,
    nucleus: mora.nucleus,
    coda: '',
    tone: null,
    weight: null,
    stressed: false,
    template: mora.onset ? 'CV' : 'V',
  };
}

function extractJapaneseVowel(token: string): string {
  return [...JAPANESE_VOWELS].reverse().find((vowel) => token.endsWith(vowel)) ?? '';
}
