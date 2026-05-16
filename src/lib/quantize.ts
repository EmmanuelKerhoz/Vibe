/**
 * quantize.ts — Pure utility for per-line rhythmic quantization.
 *
 * No side-effects. Fully unit-testable.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuantizeResult {
  /** Number of bars the line was snapped to (1, 2, or 4) */
  bars: number;
  /** Total number of beats (bars × beatsPerBar) */
  beats: number;
  /** Line text with soft break markers (`·`) inserted at syllable group boundaries */
  markedText: string;
  /** Number of syllables counted in the original line */
  syllableCount: number;
  /** Syllables per beat at the snapped grid */
  syllablesPerBeat: number;
}

// ---------------------------------------------------------------------------
// Syllable counting
// ---------------------------------------------------------------------------

// ISO-like language hints and common language names used to bypass
// Latin-script-only syllable heuristics for unsupported writing systems.
const NON_LATIN_LANGUAGE_HINTS = [
  'ar', 'arabic',
  'zh', 'chinese', 'mandarin', 'cantonese',
  'ko', 'korean',
  'ja', 'japanese',
  'ru', 'russian',
  'he', 'hebrew',
  'hi', 'hindi',
  'th', 'thai',
] as const;
const NON_LATIN_LANGUAGE_PATTERN = new RegExp(`\\b(${NON_LATIN_LANGUAGE_HINTS.join('|')})\\b`, 'i');
const LATIN_VOWEL_GROUP_PATTERN = /[aeiouyàáâãäåæèéêëìíîïòóôõöœùúûüýÿ]+/g;
const LATIN_SILENT_E_PATTERN = /[^aeiouyàáâãäåæèéêëìíîïòóôõöœùúûüýÿ]e$/;

function hasUnsupportedLetters(text: string): boolean {
  for (const char of text) {
    if (/\p{L}/u.test(char) && !/\p{Script=Latin}/u.test(char)) {
      return true;
    }
  }
  return false;
}

/**
 * Whether the lightweight syllable heuristic can be used safely.
 * It is intentionally limited to Latin-script lyrics; non-Latin scripts fall
 * back to no quantization instead of producing misleading rhythmic scores.
 */
export function supportsSyllableHeuristics(text: string, language: string = ''): boolean {
  if (NON_LATIN_LANGUAGE_PATTERN.test(language)) return false;
  return !hasUnsupportedLetters(text);
}

/**
 * Lightweight Latin-script syllable counter.
 * Counts vowel groups (including common accented vowels) as syllable nuclei.
 * Handles the common English silent-e pattern.
 */
export function countSyllables(word: string): number {
  const w = word.toLowerCase().normalize('NFC').replace(/[^\p{Script=Latin}]/gu, '');
  if (w.length === 0) return 0;

  // Count vowel groups
  let count = (w.match(LATIN_VOWEL_GROUP_PATTERN) ?? []).length;

  // Subtract silent final 'e' if word is > 2 chars and ends with consonant+e
  if (w.length > 2 && LATIN_SILENT_E_PATTERN.test(w)) {
    count -= 1;
  }

  // Minimum 1 syllable per non-empty Latin-script word
  return Math.max(1, count);
}

/**
 * Count total syllables across all words in a line.
 */
export function countLineSyllables(line: string): number {
  const words = line.trim().split(/\s+/).filter(Boolean);
  return words.reduce((sum, w) => sum + countSyllables(w), 0);
}

// ---------------------------------------------------------------------------
// Bar subdivision snapping
// ---------------------------------------------------------------------------

const BAR_OPTIONS = [1, 2, 4] as const;
type BarCount = (typeof BAR_OPTIONS)[number];

/**
 * Given a time signature and syllable count, snap the line to the nearest
 * standard bar subdivision (1, 2, or 4 bars).
 *
 * Heuristic: assume a comfortable delivery pace of ~1 syllable per beat.
 * The "best fit" bar count is the smallest that accommodates all syllables.
 */
export function snapToNearestBars(
  syllableCount: number,
  timeSignature: [number, number],
): BarCount {
  const beatsPerBar = timeSignature[0];

  let best: BarCount = 4;
  for (const bars of BAR_OPTIONS) {
    const totalBeats = bars * beatsPerBar;
    if (totalBeats >= syllableCount) {
      best = bars;
      break;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Marker insertion
// ---------------------------------------------------------------------------

/**
 * Insert soft break markers (`·`) into the line text to visually suggest
 * syllable groupings that match the quantized grid.
 *
 * Words are grouped into chunks of roughly (beatsPerBar) syllables each
 * (one "beat group" per bar beat).
 */
function insertMarkers(line: string, beatsPerBar: number, bars: number): string {
  const words = line.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return line;

  const totalBeats = beatsPerBar * bars;
  // Syllables per beat group (fractional, rounded to nearest integer, min 1)
  const syllableCount = countLineSyllables(line);
  const syllablesPerGroup = Math.max(1, Math.round(syllableCount / totalBeats));

  const groups: string[] = [];
  let currentGroup: string[] = [];
  let groupSyllables = 0;

  for (const word of words) {
    const wSyllables = countSyllables(word);
    currentGroup.push(word);
    groupSyllables += wSyllables;

    if (groupSyllables >= syllablesPerGroup) {
      groups.push(currentGroup.join(' '));
      currentGroup = [];
      groupSyllables = 0;
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup.join(' '));
  }

  return groups.join(' · ');
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Quantize a lyric line against the current song BPM and time signature.
 *
 * @param line             Raw lyric line text.
 * @param bpm              Song BPM (fallback: 120).
 * @param timeSignature    [beatsPerBar, beatUnit] (fallback: [4, 4]).
 * @param language         Language hint for script detection.
 * @param targetSyllables  Optional override: treat this value as the syllable
 *                         count instead of re-counting from text. Used when
 *                         the user has manually set a syllable target via the
 *                         COUNT inline editor before triggering quantize.
 * @returns                A {@link QuantizeResult} with the snapped bar count,
 *                         beat count, soft-break-marked text, and syllable stats.
 */
export function quantizeLine(
  line: string,
  bpm: number = 120,
  timeSignature: [number, number] = [4, 4],
  language: string = '',
  targetSyllables?: number,
): QuantizeResult {
  const safeTs: [number, number] = timeSignature[0] > 0 ? timeSignature : [4, 4];

  if (!supportsSyllableHeuristics(line, language)) {
    return {
      bars: 1,
      beats: safeTs[0],
      markedText: line,
      syllableCount: 0,
      syllablesPerBeat: 0,
    };
  }

  // Use caller-supplied target if valid, otherwise count from text.
  const syllableCount = (targetSyllables !== undefined && targetSyllables > 0)
    ? targetSyllables
    : countLineSyllables(line);

  const bars = snapToNearestBars(syllableCount, safeTs);
  const beats = bars * safeTs[0];
  const markedText = syllableCount > 0 ? insertMarkers(line, safeTs[0], bars) : line;
  const syllablesPerBeat = beats > 0 ? syllableCount / beats : 0;

  return {
    bars,
    beats,
    markedText,
    syllableCount,
    syllablesPerBeat,
  };
}
