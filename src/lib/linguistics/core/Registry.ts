/**
 * PhonologicalRegistry — singleton orchestrator for language family strategies.
 *
 * Routes a language code to the appropriate PhonologicalStrategy instance
 * via the LANG_TO_FAMILY mapping from constants/langFamilyMap.
 *
 * Pattern: Strategy + Registry (docs_fusion_optimal.md §14).
 */

import { LANG_TO_FAMILY, type AlgoFamily } from '../../../constants/langFamilyMap';
import type { PhonologicalStrategy } from './PhonologicalStrategy';
import type { RhymePairResult, RhymeResult, SimilarityMethod } from './types';

class PhonologicalRegistryImpl {
  private readonly strategies = new Map<AlgoFamily, PhonologicalStrategy>();

  /** Register a strategy for the given family. */
  register(family: AlgoFamily, strategy: PhonologicalStrategy): void {
    this.strategies.set(family, strategy);
  }

  /** Resolve the strategy for a language code, or undefined if not registered. */
  resolve(langCode: string): PhonologicalStrategy | undefined {
    const family = LANG_TO_FAMILY[langCode.toLowerCase()];
    return family ? this.strategies.get(family) : undefined;
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
