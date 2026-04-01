/**
 * linguistics.worker.ts — Web Worker for off-thread phonological analysis.
 *
 * This worker owns the full PhonologicalRegistry and runs the 5-step
 * pipeline (normalize → g2p → syllabify → extractRN → score) entirely
 * off the main thread.  Results are posted back as typed messages.
 *
 * Architecture invariant (docs_fusion_optimal.md):
 *   All heavy computation happens here — the main thread stays free for
 *   React rendering and user interaction.
 */

import type {
  WorkerRequest,
  WorkerResponse,
  AnalyzePayload,
  AnalysisResult,
  SectionInsight,
  LineInsight,
  SimilarityPair,
} from './linguistics.types';

import type {
  RhymeResult,
  RhymeType,
} from '../linguistics/core/types';

import { PhonologicalStrategy, categorizeScore } from '../linguistics/core/PhonologicalStrategy';
import { PhonologicalRegistry } from '../linguistics/core/Registry';
import { RomanceStrategy } from '../linguistics/strategies/RomanceStrategy';
import { GermanicStrategy } from '../linguistics/strategies/GermanicStrategy';
import { KwaStrategy } from '../linguistics/strategies/KwaStrategy';
import { CrvStrategy } from '../linguistics/strategies/CrvStrategy';

// ─── Bootstrap the registry inside the worker context ──────────────────────

PhonologicalRegistry.register('ALGO-ROM', new RomanceStrategy());
PhonologicalRegistry.register('ALGO-GER', new GermanicStrategy());
PhonologicalRegistry.register('ALGO-KWA', new KwaStrategy());
PhonologicalRegistry.register('ALGO-CRV', new CrvStrategy());

// ─── Utility functions ─────────────────────────────────────────────────────

function countSyllables(text: string): number {
  // Simple heuristic: count vowel groups
  const vowelGroups = text.toLowerCase().match(/[aeiouyàâäéèêëïîôùûüÿœæáíóúãõ]+/gi);
  return vowelGroups ? vowelGroups.length : 0;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/** Compute assonance density: ratio of lines sharing a vowel nucleus. */
function computeAssonanceDensity(analyses: (RhymeResult | null)[]): number {
  const valid = analyses.filter((a): a is RhymeResult => a !== null);
  if (valid.length < 2) return 0;
  const nuclei = valid.map(a => a.rhymeNucleus.nucleus);
  const nucleusCounts = new Map<string, number>();
  for (const n of nuclei) {
    nucleusCounts.set(n, (nucleusCounts.get(n) ?? 0) + 1);
  }
  const repeating = [...nucleusCounts.values()].filter(c => c > 1).reduce((s, c) => s + c, 0);
  return repeating / valid.length;
}

/** Compute alliteration density: ratio of lines sharing initial consonant. */
function computeAlliterationDensity(lines: string[]): number {
  const nonEmpty = lines.filter(l => l.trim().length > 0);
  if (nonEmpty.length < 2) return 0;
  const initials = nonEmpty.map(l => {
    const first = l.trim().charAt(0).toLowerCase();
    return first;
  });
  const counts = new Map<string, number>();
  for (const c of initials) {
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const repeating = [...counts.values()].filter(c => c > 1).reduce((s, c) => s + c, 0);
  return repeating / nonEmpty.length;
}

// ─── Analysis engine ────────────────────────────────────────────────────────

function runAnalysis(payload: AnalyzePayload): AnalysisResult {
  const start = performance.now();
  const { requestId, sections, langCode } = payload;
  const strategy = PhonologicalRegistry.resolve(langCode);

  const sectionInsights: SectionInsight[] = [];
  const allSimilarityPairs: SimilarityPair[] = [];

  for (const section of sections) {
    const nonMetaLines = section.lines.filter(l => !l.isMeta && l.text.trim().length > 0);

    // Analyze each line
    const analyses: (RhymeResult | null)[] = nonMetaLines.map(l =>
      strategy ? strategy.analyze(l.text.trim(), langCode) : null,
    );

    // Assign rhyme labels (A, B, C, …) via pairwise scoring
    const labels: string[] = new Array(nonMetaLines.length).fill('') as string[];
    let nextLabel = 0;
    const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const rhymeTypes: Record<RhymeType, number> = {
      rich: 0, sufficient: 0, assonance: 0, weak: 0, none: 0,
    };

    if (strategy && nonMetaLines.length >= 2) {
      for (let i = 0; i < analyses.length; i++) {
        if (labels[i]) continue;
        const label = ALPHA[nextLabel % ALPHA.length] ?? '?';
        labels[i] = label;
        nextLabel++;
        for (let j = i + 1; j < analyses.length; j++) {
          if (labels[j]) continue;
          const a = analyses[i];
          const b = analyses[j];
          if (!a || !b) continue;
          const score = strategy.score(a.rhymeNucleus, b.rhymeNucleus);
          const rhymeType = categorizeScore(score);
          if (rhymeType === 'rich' || rhymeType === 'sufficient' || rhymeType === 'assonance') {
            labels[j] = label;
          }
        }
      }

      // Build similarity pairs (top N closest pairs)
      for (let i = 0; i < analyses.length; i++) {
        for (let j = i + 1; j < analyses.length; j++) {
          const a = analyses[i];
          const b = analyses[j];
          if (!a || !b) continue;
          const score = strategy.score(a.rhymeNucleus, b.rhymeNucleus);
          const rhymeType = categorizeScore(score);
          rhymeTypes[rhymeType]++;
          if (score > 0.3) {
            allSimilarityPairs.push({
              lineIdA: nonMetaLines[i]!.lineId,
              lineIdB: nonMetaLines[j]!.lineId,
              textA: nonMetaLines[i]!.text,
              textB: nonMetaLines[j]!.text,
              score,
              rhymeType,
              pairResult: strategy.compare(
                nonMetaLines[i]!.text.trim(),
                nonMetaLines[j]!.text.trim(),
                langCode,
              ),
            });
          }
        }
      }
    }

    // Build line insights
    const lineInsights: LineInsight[] = nonMetaLines.map((l, idx) => ({
      lineId: l.lineId,
      text: l.text,
      syllableCount: analyses[idx]?.syllables.length ?? countSyllables(l.text),
      charCount: l.text.length,
      wordCount: countWords(l.text),
      rhymeLabel: labels[idx] ?? '',
      rhymeResult: analyses[idx] ?? null,
    }));

    const totalSyllables = lineInsights.reduce((s, li) => s + li.syllableCount, 0);
    const totalWords = lineInsights.reduce((s, li) => s + li.wordCount, 0);
    const totalChars = lineInsights.reduce((s, li) => s + li.charCount, 0);
    const lineCount = lineInsights.length || 1;

    sectionInsights.push({
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      targetSchema: section.targetSchema ?? '',
      detectedSchema: labels.join(''),
      lineInsights,
      totalSyllables,
      totalWords,
      totalChars,
      avgSyllablesPerLine: totalSyllables / lineCount,
      avgWordsPerLine: totalWords / lineCount,
      rhymeTypes,
      assonanceDensity: computeAssonanceDensity(analyses),
      alliterationDensity: computeAlliterationDensity(nonMetaLines.map(l => l.text)),
    });
  }

  // Sort similarity pairs by score descending
  allSimilarityPairs.sort((a, b) => b.score - a.score);

  return {
    requestId,
    sections: sectionInsights,
    similarityPairs: allSimilarityPairs.slice(0, 50), // Cap at 50 pairs
    computeTimeMs: performance.now() - start,
  };
}

// ─── Message handler ────────────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    if (request.type === 'analyze') {
      const result = runAnalysis(request.payload);
      const response: WorkerResponse = { type: 'result', payload: result };
      self.postMessage(response);
    }
  } catch (err) {
    const errorResponse: WorkerResponse = {
      type: 'error',
      payload: {
        requestId: request.type === 'analyze' ? request.payload.requestId : 'unknown',
        message: err instanceof Error ? err.message : String(err),
      },
    };
    self.postMessage(errorResponse);
  }
};
