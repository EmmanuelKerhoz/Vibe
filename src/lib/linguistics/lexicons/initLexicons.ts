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
 *   Do not guard registration behind a module-level `_initialized` flag.
 *   Vitest may load multiple isolated module instances; a flag can become
 *   true in one instance while the test reads a different `phonemeIndex`
 *   singleton in another instance. Re-registering is safe because
 *   registerLexicon() overwrites the language bucket atomically.
 */

import { registerLexicon, getLexiconSize } from '../rhyme/suggestRhymes';
import { frLexicon } from './fr';

/**
 * Register all built-in lexicons.
 * Idempotent by replacement: registerLexicon() rebuilds and overwrites the
 * per-language bucket, so repeated calls are safe in app code and tests.
 */
export function initLexicons(): void {
  registerLexicon('fr', frLexicon);

  // Future languages — uncomment as lexicons are onboarded:
  // registerLexicon('en', enLexicon);
  // registerLexicon('es', esLexicon);
  // registerLexicon('pt', ptLexicon);
  // registerLexicon('yo', yoLexicon);
  // registerLexicon('sw', swLexicon);
  // registerLexicon('ar', arLexicon);
}

/**
 * Health check: returns a map of lang → entry count.
 * Useful for startup diagnostics / unit tests.
 */
export function getLexiconHealth(): Record<string, number> {
  return {
    fr: getLexiconSize('fr'),
    // en: getLexiconSize('en'),
  };
}

/**
 * Reset hook kept for test compatibility.
 * Registration is now stateless, so this is intentionally a no-op.
 * NEVER call in production code.
 */
export function _resetLexicons_TEST_ONLY(): void {
  // no-op by design
}
