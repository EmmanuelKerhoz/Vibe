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
import type { DetectedSchema } from '../lib/linguistics/core/types';
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
      if (lines.length < 2) {
        return {
          sectionId: section.id,
          detectedSchema: '',
          lineLabels: lines.map(() => ''),
        };
      }

      const strategy = PhonologicalRegistry.resolve(langCode);
      if (!strategy) {
        return {
          sectionId: section.id,
          detectedSchema: '',
          lineLabels: lines.map(() => ''),
        };
      }

      // Analyse each line
      const analyses = lines.map(l => strategy.analyze(l.text.trim(), langCode));

      // Assign rhyme labels via pairwise comparison
      const labels: string[] = new Array(lines.length).fill('') as string[];
      let nextLabel = 0;
      const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      for (let i = 0; i < analyses.length; i++) {
        if (labels[i]) continue; // already labelled
        const label = ALPHA[nextLabel % ALPHA.length] ?? '?';
        labels[i] = label;
        nextLabel++;
        for (let j = i + 1; j < analyses.length; j++) {
          if (labels[j]) continue;
          const a = analyses[i]!;
          const b = analyses[j]!;
          const score = strategy.score(a.rhymeNucleus, b.rhymeNucleus);
          const rhymeType = categorizeScore(score);
          if (rhymeType === 'rich' || rhymeType === 'sufficient' || rhymeType === 'assonance') {
            labels[j] = label;
          }
        }
      }

      return {
        sectionId: section.id,
        detectedSchema: labels.join(''),
        lineLabels: labels,
      };
    });
  }, [song, songLanguage]);
}
