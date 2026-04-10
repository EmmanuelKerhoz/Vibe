/**
 * initLexicons.ts
 * Bootstrap: registers all built-in lexicons into the PhonemeIndex
 * used by suggestRhymes().
 *
 * Call at application startup, after the linguistics engine
 * has been imported (which auto-registers all strategies via
 * src/lib/linguistics/index.ts side-effects).
 *
 * Usage:
 *   import { initLexicons } from 'lib/linguistics/lexicons/initLexicons';
 *   initLexicons();
 *
 * IMPORTANT (Vitest / module isolation):
 *   registerLexicon and getLexiconSize are imported from PhonemeStore —
 *   the canonical singleton that owns the phonemeIndex Map.
 *   Both this file and suggestRhymes.ts resolve to the SAME Map instance
 *   regardless of how Vitest isolates module graphs.
 */

import { registerLexicon, getLexiconSize } from '../rhyme/PhonemeStore';
import { frLexicon } from './fr';
import { enLexicon } from './en';
import { esLexicon } from './es';
import { ptLexicon } from './pt';
import { yoLexicon } from './yo';
import { swLexicon } from './sw';
import { arLexicon } from './ar';

/**
 * Register all built-in lexicons.
 * Idempotent by replacement: registerLexicon() rebuilds and overwrites the
 * per-language bucket, so repeated calls are safe in app code and tests.
 */
export function initLexicons(): void {
  registerLexicon('fr', frLexicon);
  registerLexicon('en', enLexicon);
  registerLexicon('es', esLexicon);
  registerLexicon('pt', ptLexicon);
  registerLexicon('yo', yoLexicon);
  registerLexicon('sw', swLexicon);
  registerLexicon('ar', arLexicon);
}

/**
 * Health check: returns a map of lang → entry count.
 * Useful for startup diagnostics / unit tests.
 */
export function getLexiconHealth(): Record<string, number> {
  return {
    fr: getLexiconSize('fr'),
    en: getLexiconSize('en'),
    es: getLexiconSize('es'),
    pt: getLexiconSize('pt'),
    yo: getLexiconSize('yo'),
    sw: getLexiconSize('sw'),
    ar: getLexiconSize('ar'),
  };
}

/**
 * Reset hook kept for test compatibility.
 * Registration is stateless (PhonemeStore owns the Map), so this is a no-op.
 * NEVER call in production code.
 */
export function _resetLexicons_TEST_ONLY(): void {
  // no-op by design
}
