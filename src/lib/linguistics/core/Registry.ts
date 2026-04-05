/**
 * PhonologicalRegistry — singleton orchestrator for language family strategies.
 *
 * Routes a language code to the appropriate PhonologicalStrategy instance
 * via the LANG_TO_FAMILY mapping from constants/langFamilyMap.
 *
 * Pattern: Strategy + Registry (docs_fusion_optimal.md §14).
 *
 * Fallback: when no strategy is found for a language code, ALGO-ROBUST
 * (FallbackStrategy) is used automatically. Score is capped at 0.65
 * and result carries `partialSignal: true`.
 */

import { LANG_TO_FAMILY, type AlgoFamily } from '../../../constants/langFamilyMap';
import type { PhonologicalStrategy } from './PhonologicalStrategy';
import type { RhymePairResult, RhymeResult, SimilarityMethod } from './types';

class PhonologicalRegistryImpl {
  private readonly strategies = new Map<AlgoFamily, PhonologicalStrategy>();
  private fallback: PhonologicalStrategy | undefined;

  /** Register a strategy for the given family. */
  register(family: AlgoFamily, strategy: PhonologicalStrategy): void {
    this.strategies.set(family, strategy);
    if (family === 'ALGO-ROBUST') {
      this.fallback = strategy;
    }
  }

  /**
   * Resolve the strategy for a language code.
   * Falls back to ALGO-ROBUST if no mapping or registration found.
   */
  resolve(langCode: string): PhonologicalStrategy | undefined {
    const family = LANG_TO_FAMILY[langCode.toLowerCase()];
    const strategy = family ? this.strategies.get(family) : undefined;
    return strategy ?? this.fallback;
  }

  /** Resolve with explicit family ID (bypass lang lookup). */
  resolveFamily(family: AlgoFamily): PhonologicalStrategy | undefined {
    return this.strategies.get(family);
  }

  /** Run the full pipeline for a single input. */
  analyze(text: string, langCode: string): RhymeResult | null {
    const strategy = this.resolve(langCode);
    return strategy ? strategy.analyze(text, langCode) : null;
  }

  /** Compare two texts. */
  compare(
    text1: string,
    text2: string,
    langCode: string,
    options?: { method?: SimilarityMethod; threshold?: number },
  ): RhymePairResult | null {
    const strategy = this.resolve(langCode);
    return strategy ? strategy.compare(text1, text2, langCode, options) : null;
  }

  /** List all registered families. */
  registeredFamilies(): AlgoFamily[] {
    return [...this.strategies.keys()];
  }
}

/** Singleton registry instance. */
export const PhonologicalRegistry = new PhonologicalRegistryImpl();
