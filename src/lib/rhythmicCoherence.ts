/**
 * rhythmicCoherence.ts — Pure utility for rhythmic coherence checking.
 *
 * Compares lyrics syllable density against musical prompt parameters
 * to compute a coherence score and surface actionable suggestions.
 *
 * No side-effects. Fully unit-testable.
 */

import { countLineSyllables, supportsSyllableHeuristics } from './quantize';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MusicalPromptParams {
  /** BPM extracted from the musical prompt or song settings (fallback: 120) */
  bpm: number;
  /** Estimated song duration in seconds (fallback: 180) */
  durationSeconds?: number;
  /** Time signature [beatsPerBar, beatUnit] (fallback: [4, 4]) */
  timeSignature?: [number, number];
  /** Optional style string for display purposes */
  style?: string;
  /** Song language hint used to skip unsupported non-Latin syllable heuristics */
  language?: string;
}

export interface LineDiff {
  /** 0-based index of the line within the song */
  lineIndex: number;
  /** Actual text of the line */
  text: string;
  /** Syllable count of the line */
  syllables: number;
  /** Estimated maximum syllables for a single bar at this BPM */
  maxSyllablesPerBar: number;
  /** Whether the line exceeds the single-bar capacity */
  isTooLong: boolean;
}

export interface CoherenceResult {
  /** Match score from 0 to 100 */
  score: number;
  /** Total syllable count in the provided lyrics */
  totalSyllables: number;
  /** Estimated syllable capacity given the musical prompt params */
  estimatedCapacity: number;
  /** Per-line diff for lines that exceed the rhythmic grid capacity */
  lineDiffs: LineDiff[];
  /**
   * Auto-proposed BPM range when Option A (prioritise lyrics) is chosen.
   * Ensures the capacity at least matches the lyric density.
   */
  suggestedBpmRange: [number, number];
  /** Whether the score is below the 70-point threshold for user intervention */
  needsReview: boolean;
  /** Why the check was skipped, when no meaningful syllable heuristic is available */
  skippedReason?: 'unsupported-language';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Count total syllables across all lines in a multi-line lyrics string.
 * Lines are split on `\n`; empty lines are ignored.
 */
export function countLyricsSyllables(lyrics: string): number {
  return lyrics
    .split('\n')
    .filter(l => l.trim().length > 0)
    .reduce((sum, line) => sum + countLineSyllables(line), 0);
}

/**
 * Estimate the total syllable capacity for the given musical prompt parameters.
 * Assumption: ~1 syllable per beat at comfortable delivery pace.
 */
export function estimateCapacity(params: MusicalPromptParams): number {
  const bpm = params.bpm > 0 ? params.bpm : 120;
  const duration = (params.durationSeconds ?? 180) > 0 ? (params.durationSeconds ?? 180) : 180;
  const totalBeats = (bpm / 60) * duration;
  // Comfortable delivery: ~1 syllable per beat (some lines faster, some slower)
  return Math.round(totalBeats);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Check rhythmic coherence between lyrics and musical prompt parameters.
 *
 * @param lyrics        Full lyrics text (newline-separated lines).
 * @param musicalPrompt Musical prompt parameters (BPM, duration, time signature).
 * @returns             A {@link CoherenceResult} with a 0–100 score and diagnostics.
 */
export function checkRhythmicCoherence(
  lyrics: string,
  musicalPrompt: MusicalPromptParams,
): CoherenceResult {
  const bpm = musicalPrompt.bpm > 0 ? musicalPrompt.bpm : 120;
  const duration = (musicalPrompt.durationSeconds ?? 180) > 0
    ? (musicalPrompt.durationSeconds ?? 180)
    : 180;
  const timeSignature = musicalPrompt.timeSignature ?? [4, 4];
  const beatsPerBar = timeSignature[0] > 0 ? timeSignature[0] : 4;

  const estimatedCapacity = estimateCapacity({ ...musicalPrompt, bpm, durationSeconds: duration });

  if (!supportsSyllableHeuristics(lyrics, musicalPrompt.language)) {
    return {
      score: 100,
      totalSyllables: 0,
      estimatedCapacity,
      lineDiffs: [],
      suggestedBpmRange: [bpm, bpm + 20],
      needsReview: false,
      skippedReason: 'unsupported-language',
    };
  }

  const totalSyllables = countLyricsSyllables(lyrics);

  // Score: ratio of capacity to syllables, clamped to 0–100.
  // If syllables <= capacity → full score; if syllables >> capacity → score → 0.
  let score: number;
  if (totalSyllables === 0) {
    score = 100; // Empty lyrics are always "coherent"
  } else if (estimatedCapacity === 0) {
    score = 0;
  } else {
    const ratio = estimatedCapacity / totalSyllables;
    score = Math.round(Math.min(1, ratio) * 100);
  }

  // Per-line analysis: flag lines that exceed single-bar capacity.
  // At 1 syllable per beat, max syllables per bar = beatsPerBar.
  const maxSyllablesPerBar = beatsPerBar;

  const lineDiffs: LineDiff[] = lyrics
    .split('\n')
    .filter(l => l.trim().length > 0)
    .map((text, i) => {
      const syllables = countLineSyllables(text);
      return {
        lineIndex: i,
        text: text.trim(),
        syllables,
        maxSyllablesPerBar,
        isTooLong: syllables > maxSyllablesPerBar * 2, // >2 bars worth is "too long"
      };
    })
    .filter(d => d.isTooLong);

  // Suggested BPM range: if lyrics are denser than capacity, increase BPM
  // so that capacity >= totalSyllables.
  // Formula: (syllables ÷ durationSeconds) × 60 = syllables-per-minute →
  // multiply by 1.1 for 10% headroom so the new tempo comfortably fits the lyrics.
  const minRequiredBpm =
    totalSyllables > 0
      ? Math.ceil((totalSyllables / duration) * 60 * 1.1)
      : bpm;
  const suggestedBpmRange: [number, number] = [
    Math.min(bpm, minRequiredBpm),
    Math.max(bpm, minRequiredBpm + 20),
  ];

  return {
    score,
    totalSyllables,
    estimatedCapacity,
    lineDiffs,
    suggestedBpmRange,
    needsReview: score < 70,
  };
}
