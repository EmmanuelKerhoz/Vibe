/**
 * Proxy G2P implementations for 13 approximated language families.
 *
 * Families with a native implementation (ROM, GER, KWA, CRV, SEM) live in
 * their own files. Families here use simplified approximations that are good
 * enough for client-side rhyme detection but should eventually be replaced
 * by proper rule-based or neural G2P.
 *
 * When `isProxied` is exposed in LocalRhymeSectionAnalysis, the UI can signal
 * this degradation to the user.
 */

import { gemG2P } from './gem';

// ---------------------------------------------------------------------------
// Shared helper — basic letter-to-IPA mapper with a custom vowel/consonant map
// ---------------------------------------------------------------------------
const applyMapping = (
  text: string,
  mapping: Record<string, string>,
  preserveToneDiacritics = false,
): string => {
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;
  while (i < normalized.length) {
    let matched = false;
    for (let len = 4; len >= 1; len--) {
      if (i + len <= normalized.length) {
        const substr = normalized.slice(i, i + len);
        if (mapping[substr] !== undefined) {
          ipa += mapping[substr];
          i += len;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      const char = normalized[i]!;
      if (preserveToneDiacritics && /[\u0300-\u0304\u030C]/.test(char)) {
        ipa += char;
      } else if (!/[\u0300-\u036f\s]/.test(char)) {
        ipa += char;
      }
      i++;
    }
  }
  return ipa;
};

// ---------------------------------------------------------------------------
// Slavic (SLV) — Cyrillic-transliteration-aware vowel set
// ---------------------------------------------------------------------------
const SLV_MAPPING: Record<string, string> = {
  // Vowels specific to Slavic transliteration
  'ya': 'ja', 'yu': 'ju', 'ye': 'je', 'yi': 'ji',
  'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u', 'y': 'ɨ',
  'ä': 'ɐ', 'ö': 'ø', 'ü': 'y',
  // Consonants
  'b': 'b', 'c': 'ts', 'ch': 'tʃ', 'cz': 'tʃ',
  'd': 'd', 'dz': 'dz', 'dj': 'dʒ', 'dź': 'dʒ',
  'f': 'f', 'g': 'g', 'h': 'x', 'j': 'j',
  'k': 'k', 'l': 'l', 'ł': 'w', 'm': 'm', 'n': 'n', 'ń': 'ɲ',
  'p': 'p', 'r': 'r', 'rz': 'ʒ', 's': 's', 'sz': 'ʃ', 'ś': 'ɕ',
  't': 't', 'v': 'v', 'w': 'v', 'x': 'ks', 'z': 'z', 'ż': 'ʒ', 'ź': 'zʲ',
};
export const slvG2P = (text: string): string => applyMapping(text, SLV_MAPPING);

// ---------------------------------------------------------------------------
// Sinitic (SIN) — Pinyin-aware, tone-diacritic preserving
// ---------------------------------------------------------------------------
const SIN_MAPPING: Record<string, string> = {
  'zhi': 'dʒɹ̀', 'chi': 'tʃɹ̀', 'shi': 'ʃɹ̀', 'ri': 'ɹ̀ɨ',
  'zi': 'tsɨ', 'ci': 'tsʰɨ', 'si': 'sɨ',
  'zh': 'dʒ', 'ch': 'tʃ', 'sh': 'ʃ', 'ng': 'ŋ', 'nv': 'ny',
  'a': 'a', 'e': 'ɤ', 'i': 'i', 'o': 'o', 'u': 'u', 'ü': 'y',
  'ä': 'ɐ', 'ê': 'ɛ', 'ô': 'o',
  'b': 'p', 'p': 'pʰ', 'm': 'm', 'f': 'f',
  'd': 't', 't': 'tʰ', 'n': 'n', 'l': 'l',
  'g': 'k', 'k': 'kʰ', 'h': 'x',
  'j': 'tsʲ', 'q': 'tsʲʰ', 'x': 'ɕ',
  'r': 'ɹ', 'w': 'w', 'y': 'j', 'z': 'ts', 'c': 'tsʰ', 's': 's',
};
export const sinG2P = (text: string): string => applyMapping(text, SIN_MAPPING, true);

// ---------------------------------------------------------------------------
// Japanese (JAP) — romaji-aware with long vowel and special digraph handling
// ---------------------------------------------------------------------------
const JAP_MAPPING: Record<string, string> = {
  'tsu': 'tsɯ', 'chi': 'tɕi', 'shi': 'ɕi', 'sha': 'ɕa', 'shu': 'ɕɯ', 'sho': 'ɕo',
  'cha': 'tɕa', 'chu': 'tɕɯ', 'cho': 'tɕo',
  'fu': 'ɸɯ', 'ji': 'dʒi', 'zu': 'dzɯ',
  'ou': 'oː', 'uu': 'uː', 'ii': 'iː', 'aa': 'aː', 'ee': 'eː',
  'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'ɯ',
  'b': 'b', 'd': 'd', 'f': 'f', 'g': 'g', 'h': 'h', 'k': 'k',
  'm': 'm', 'n': 'n', 'p': 'p', 'r': 'ɾ', 's': 's', 't': 't',
  'w': 'w', 'y': 'j', 'z': 'dz',
};
export const japG2P = (text: string): string => applyMapping(text, JAP_MAPPING);

// ---------------------------------------------------------------------------
// Korean (KOR) — revised romanisation vowel set
// ---------------------------------------------------------------------------
const KOR_MAPPING: Record<string, string> = {
  'ae': 'ɛ', 'oe': 'ø', 'wi': 'wi', 'ui': 'ɯi', 'eu': 'ɯ', 'eo': 'ʌ',
  'ya': 'ja', 'ye': 'jɛ', 'yo': 'jo', 'yu': 'ju',
  'wa': 'wa', 'we': 'wɛ', 'wo': 'wʌ',
  'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u',
  'b': 'p', 'd': 't', 'g': 'k', 'j': 'tɕ',
  'ch': 'tɕʰ', 'kh': 'kʰ', 'th': 'tʰ', 'ph': 'pʰ',
  'ng': 'ŋ', 'ss': 's*', 'pp': 'p*', 'tt': 't*', 'kk': 'k*', 'jj': 'tɕ*',
  'h': 'h', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'pʰ',
  'r': 'ɾ', 's': 's', 't': 'tʰ', 'w': 'w', 'y': 'j',
};
export const korG2P = (text: string): string => applyMapping(text, KOR_MAPPING);

// ---------------------------------------------------------------------------
// Bantu (BNT) — 5-vowel system with nasal class prefixes, tone-preserving
// ---------------------------------------------------------------------------
const BNT_MAPPING: Record<string, string> = {
  'ng\'': 'ŋ', 'ng': 'ŋ', 'ny': 'ɲ', 'mb': 'mb', 'nd': 'nd', 'nz': 'nz',
  'a': 'a', 'e': 'e', 'ɛ': 'ɛ', 'i': 'i', 'o': 'o', 'ɔ': 'ɔ', 'u': 'u',
  'b': 'b', 'c': 'k', 'd': 'd', 'f': 'f', 'g': 'g', 'h': 'h',
  'j': 'dʒ', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'ɲ': 'ɲ', 'ŋ': 'ŋ',
  'p': 'p', 'r': 'r', 's': 's', 't': 't', 'v': 'v', 'w': 'w',
  'y': 'j', 'z': 'z',
};
export const bntG2P = (text: string): string => applyMapping(text, BNT_MAPPING, true);

// ---------------------------------------------------------------------------
// Indo-Iranian (IIR) — retroflex consonants + aspirates, Devanagari-roman
// ---------------------------------------------------------------------------
const IIR_MAPPING: Record<string, string> = {
  // Long vowels
  'ā': 'aː', 'ī': 'iː', 'ū': 'uː', 'ē': 'eː', 'ō': 'oː',
  // Short vowels
  'a': 'ə', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u',
  // Aspirated stops
  'ph': 'pʰ', 'bh': 'bʰ', 'th': 't̪ʰ', 'dh': 'd̪ʰ', 'kh': 'kʰ', 'gh': 'ɡʰ',
  'ch': 'tɕʰ', 'jh': 'dʒʰ',
  // Retroflexes
  'ṭ': 'ʈ', 'ḍ': 'ɖ', 'ṉ': 'ɳ', 'ṛ': 'ɽ',
  // Nasals & liquids
  'ng': 'ŋ', 'ny': 'ɲ', 'sh': 'ʃ', 'jn': 'ɲ',
  'b': 'b', 'c': 'tɕ', 'd': 'd̪', 'f': 'f', 'g': 'g', 'h': 'h',
  'j': 'dʒ', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n',
  'p': 'p', 'r': 'ɹ', 's': 's', 't': 't̪', 'v': 'v̪', 'w': 'w',
  'y': 'j', 'z': 'z',
};
export const iirG2P = (text: string): string => applyMapping(text, IIR_MAPPING);

// ---------------------------------------------------------------------------
// Dravidian (DRV) — Tamil/Kannada romanisation, retroflex-aware
// ---------------------------------------------------------------------------
const DRV_MAPPING: Record<string, string> = {
  // Long vowels
  'ā': 'aː', 'ī': 'iː', 'ū': 'uː', 'ē': 'eː', 'ō': 'oː',
  'ai': 'aj', 'au': 'aw',
  // Short vowels
  'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u',
  // Retroflexes (Tamil ṭ ḍ ḷ ṛ)
  'ṭ': 'ʈ', 'ḍ': 'ɖ', 'ḷ': 'ɭ', 'ṛ': 'ɽ', 'ṇ': 'ɳ',
  // Nasals
  'ng': 'ŋ', 'ny': 'ɲ', 'ṅ': 'ŋ',
  'b': 'b', 'c': 'k', 'd': 'd', 'f': 'pʰ', 'g': 'g', 'h': 'h',
  'j': 'dʒ', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n',
  'p': 'p', 'r': 'r', 's': 's', 'sh': 'ʃ', 't': 't',
  'v': 'v', 'w': 'w', 'y': 'j', 'z': 'z',
};
export const drvG2P = (text: string): string => applyMapping(text, DRV_MAPPING);

// ---------------------------------------------------------------------------
// Turkic (TRK) — vowel harmony inventory (front/back pairs)
// ---------------------------------------------------------------------------
const TRK_MAPPING: Record<string, string> = {
  // Turkish/Uzbek/Azerbaijani vowels
  'ı': 'ɯ', 'ö': 'ø', 'ü': 'y', 'â': 'aː', 'î': 'iː', 'û': 'uː',
  'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u',
  // Specific consonants
  'ğ': 'ɣ', 'ş': 'ʃ', 'ç': 'tʃ', 'Ĝ': 'ɣ', 'Ş': 'ʃ', 'Ç': 'tʃ',
  'ch': 'tʃ', 'sh': 'ʃ', 'zh': 'ʒ', 'ng': 'ŋ',
  'b': 'b', 'c': 'dʒ', 'd': 'd', 'f': 'f', 'g': 'g', 'h': 'h',
  'j': 'ʒ', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'p',
  'r': 'r', 's': 's', 't': 't', 'v': 'v', 'w': 'w', 'y': 'j', 'z': 'z',
};
export const trkG2P = (text: string): string => applyMapping(text, TRK_MAPPING);

// ---------------------------------------------------------------------------
// Uralic/Finnish (FIN) — vowel harmony + front rounded vowels
// ---------------------------------------------------------------------------
const FIN_MAPPING: Record<string, string> = {
  // Long vowels (Finnish doubles)
  'aa': 'aː', 'ee': 'eː', 'ii': 'iː', 'oo': 'oː', 'uu': 'uː',
  'ää': 'æː', 'öö': 'øː', 'yy': 'yː',
  // Short vowels
  'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u',
  'ä': 'æ', 'ö': 'ø', 'y': 'y',
  // Diphthongs
  'ai': 'ɑi', 'ei': 'ei', 'oi': 'oi', 'ui': 'ui',
  'au': 'ɑu', 'ou': 'ou', 'eu': 'eu', 'iu': 'iu',
  'äi': 'æi', 'öi': 'øi', 'yi': 'yi',
  // Consonants
  'ng': 'ŋ', 'nk': 'ŋk', 'kk': 'kː', 'pp': 'pː', 'tt': 'tː',
  'ss': 'sː', 'll': 'lː', 'nn': 'nː', 'mm': 'mː', 'rr': 'rː',
  'b': 'b', 'c': 'k', 'd': 'd', 'f': 'f', 'g': 'g', 'h': 'h',
  'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'p',
  'r': 'r', 's': 's', 't': 't', 'v': 'v', 'w': 'v',
};
export const finG2P = (text: string): string => applyMapping(text, FIN_MAPPING);

// ---------------------------------------------------------------------------
// Tai-Kadai (TAI) — tonal, preserves tone diacritics
// ---------------------------------------------------------------------------
const TAI_MAPPING: Record<string, string> = {
  'ph': 'pʰ', 'th': 'tʰ', 'kh': 'kʰ', 'ng': 'ŋ', 'ny': 'ɲ',
  'ae': 'ɛ', 'ao': 'aw', 'ia': 'ia', 'ua': 'ɯa', 'ue': 'ɯə',
  'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u', 'eu': 'ɯ',
  'b': 'b', 'c': 'k', 'd': 'd', 'f': 'f', 'g': 'k', 'h': 'h',
  'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'p',
  'r': 'r', 's': 's', 't': 't', 'v': 'v', 'w': 'w', 'y': 'j', 'z': 'z',
};
export const taiG2P = (text: string): string => applyMapping(text, TAI_MAPPING, true);

// ---------------------------------------------------------------------------
// Austroasiatic/Vietnamese (VIET) — tonal, digraph-rich vowel system
// ---------------------------------------------------------------------------
const VIET_MAPPING: Record<string, string> = {
  // Vietnamese vowel digraphs / trigraphs
  'uou': 'uəu', 'iou': 'iəu', 'uoi': 'uəj',
  'oa': 'wa', 'oe': 'wɛ', 'oi': 'oj', 'oo': 'oː',
  'au': 'aw', 'ao': 'aw', 'ai': 'aj', 'ay': 'aj',
  'â': 'ə', 'ă': 'ɛ', 'ê': 'e', 'ô': 'o', 'ư': 'ɯ', 'ơ': 'ɔ',
  'à': 'a˙', 'á': 'aˉ', 'ả': 'aˇ', 'ã': 'a˜', 'ạ': 'a˘',
  'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u',
  // Consonants
  'gi': 'j', 'ph': 'f', 'th': 'tʰ', 'kh': 'x', 'nh': 'ɲ', 'ng': 'ŋ', 'ch': 'tɕ',
  'gh': 'g', 'ngh': 'ŋ', 'qu': 'kw', 'tr': 'tr',
  'b': 'b', 'c': 'k', 'd': 'd̪', 'g': 'ɣ', 'h': 'h',
  'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'p',
  'r': 'r', 's': 's', 't': 't', 'v': 'v', 'x': 's', 'y': 'j',
};
export const vietG2P = (text: string): string => applyMapping(text, VIET_MAPPING, true);

// ---------------------------------------------------------------------------
// Austronesian (AUS) — open syllable CV structure, minimal coda
// ---------------------------------------------------------------------------
const AUS_MAPPING: Record<string, string> = {
  'ng': 'ŋ', 'ny': 'ɲ', 'sy': 'ʃ', 'kh': 'x', 'gh': 'ɣ',
  'a': 'a', 'e': 'ə', 'i': 'i', 'o': 'o', 'u': 'u',
  'é': 'e', 'è': 'ɛ',
  'b': 'b', 'c': 'tɕ', 'd': 'd', 'f': 'f', 'g': 'g', 'h': 'h',
  'j': 'dʒ', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'p',
  'r': 'r', 's': 's', 't': 't', 'v': 'v', 'w': 'w', 'y': 'j', 'z': 'z',
};
export const ausG2P = (text: string): string => applyMapping(text, AUS_MAPPING);

// Re-export gemG2P to avoid unused-import lint errors if callers still reference it
export { gemG2P };
