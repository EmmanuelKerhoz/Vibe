export {
  extractToneFromDiacritic,
  TONE_DIACRITIC_RE,
  TAI_TONE_MARK_RE,
  findToneDiacritic,
  stripToneDiacritics,
  splitToneDiacritics,
  extractToneFromText,
  extractToneFromToneDigit,
} from './toneUtils';

export {
  stripNominalPrefix,
  classifyCoda,
  stripPalatalization,
  normalizeHamza,
  stripTashkeel,
  hasTashkeel,
  HEBREW_MATRES,
} from './phonologyHelpers';

export {
  stripAgglutinativeSuffixes,
} from './agglutinativeUtils';

export {
  isHanCharacter,
  isHangulSyllable,
  isKana,
  katakanaToHiragana,
} from './scriptUtils';

export type { DetectLanguageResult, LangCandidate } from './detectLanguage';
export { detectLanguage } from './detectLanguage';
