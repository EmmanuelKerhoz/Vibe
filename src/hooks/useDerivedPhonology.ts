/**
 * useDerivedPhonology — pure derived state for detected rhyme schemas.
 *
 * This hook computes `detectedSchema` per section from the linguistic registry.
 * It is intentionally NOT stored in the UNDO/REDO history stack — it is a
 * side-effect-free derivation of the current song state.
 *
 * Architecture invariant (docs_fusion_optimal.md):
 *   targetSchema ∈ history (user intent)
 *   detectedSchema ∉ history (computed/derived)
 */

import { useMemo } from 'react';
import type { Section } from '../types';
import type { DetectedSchema, RhymeNucleus, RhymeResult } from '../lib/linguistics/core/types';
import { PhonologicalRegistry } from '../lib/linguistics/core/Registry';
import { categorizeScore } from '../lib/linguistics/core/PhonologicalStrategy';
import { languageNameToCode } from '../constants/langFamilyMap';

export interface SectionPhonologyResult {
  sectionId: string;
  detectedSchema: DetectedSchema;
  /** Per-line rhyme labels (A, B, C, …) derived from pairwise scoring. */
  lineLabels: string[];
}

/**
 * Extract the last prosodic word from a line for rhyme nucleus analysis.
 * Strips trailing punctuation before returning the token.
 */
function lastWord(line: string): string {
  const tokens = line.trim().split(/\s+/);
  const last = tokens[tokens.length - 1] ?? '';
  return last.replace(/[.,!?;:\-—…"'«»]+$/g, '');
}

/**
 * Assign rhyme labels (A, B, C, …) to an array of pre-computed RN analyses.
 *
 * Algorithm:
 *   - For each unlabelled line i, assign the next free letter.
 *   - Then compare line i against ALL subsequent unlabelled lines j.
 *   - Also compare line j against ALL already-labelled buckets to enable
 *     ABAB / embraced (ABBA) detection — a line already seen as unlabelled
 *     in a previous pass can still match an existing bucket.
 *
 * This replaces the previous greedy AABB-only assignment.
 */
function assignRhymeLabels(
  analyses: RhymeResult[],
  scoreFn: (a: RhymeNucleus, b: RhymeNucleus) => number,
): { labels: string[]; confidence: number } {
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const labels: string[] = new Array(analyses.length).fill('');
  const buckets = new Map<string, number[]>();
  let nextLabel = 0;
  let totalScore = 0;
  let pairCount = 0;

  for (let i = 0; i < analyses.length; i++) {
    // Try to match line i against an existing bucket first (enables ABAB)
    if (!labels[i]) {
      let matched = false;
      for (const [bucketLabel, members] of buckets) {
        for (const mi of members) {
          const bucketScore = scoreFn(analyses[mi]!.rhymeNucleus, analyses[i]!.rhymeNucleus);
          const bucketRt = categorizeScore(bucketScore);
          if (bucketRt === 'rich' || bucketRt === 'sufficient' || bucketRt === 'assonance') {
            labels[i] = bucketLabel;
            buckets.get(bucketLabel)!.push(i);
            totalScore += bucketScore;
            pairCount++;
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
      // No existing bucket matched — open a new one
      if (!labels[i]) {
        const label = ALPHA[nextLabel % ALPHA.length] ?? '?';
        labels[i] = label;
        buckets.set(label, [i]);
        nextLabel++;
      }
    }

    // Propagate current label forward to all subsequent unlabelled lines
    for (let j = i + 1; j < analyses.length; j++) {
      if (labels[j]) continue;
      const fwdScore = scoreFn(analyses[i]!.rhymeNucleus, analyses[j]!.rhymeNucleus);
      const fwdRt = categorizeScore(fwdScore);
      if (fwdRt === 'rich' || fwdRt === 'sufficient' || fwdRt === 'assonance') {
        labels[j] = labels[i]!;
        buckets.get(labels[i]!)!.push(j);
        totalScore += fwdScore;
        pairCount++;
      }
    }
  }

  return {
    labels,
    confidence: pairCount > 0 ? totalScore / pairCount : 0,
  };
}

/**
 * Derive per-section detected rhyme schema from phonological analysis.
 * Returns a stable reference when the song/language input has not changed.
 */
export function useDerivedPhonology(
  song: Section[],
  songLanguage?: string,
): SectionPhonologyResult[] {
  return useMemo(() => {
    const langCode = languageNameToCode(songLanguage ?? 'English') ?? 'en';

    return song.map(section => {
      const lines = section.lines.filter(l => !l.isMeta && l.text.trim().length > 0);
      const emptySchema: DetectedSchema = { pattern: '', confidence: 0, lineCount: 0 };

      if (lines.length < 2) {
        return {
          sectionId: section.id,
          detectedSchema: emptySchema,
          lineLabels: lines.map(() => ''),
        };
      }

      const strategy = PhonologicalRegistry.resolve(langCode);
      if (!strategy) {
        return {
          sectionId: section.id,
          detectedSchema: emptySchema,
          lineLabels: lines.map(() => ''),
        };
      }

      // Analyse the last prosodic word of each line (rhyme-bearing token)
      const analyses: RhymeResult[] = lines.map(l => strategy.analyze(lastWord(l.text), langCode));

      const { labels, confidence } = assignRhymeLabels(analyses, strategy.score.bind(strategy));

      return {
        sectionId: section.id,
        detectedSchema: {
          pattern: labels.join(''),
          confidence,
          lineCount: lines.length,
        } satisfies DetectedSchema,
        lineLabels: labels,
      };
    });
  }, [song, songLanguage]);
}
