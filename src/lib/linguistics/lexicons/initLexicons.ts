/**
 * initLexicons.ts
 * Bootstrap: registers all built-in lexicons into the PhonemeIndex
 * used by suggestRhymes().
 *
 * Call ONCE at application startup, after the linguistics engine
 * has been imported (which auto-registers all strategies via
 * src/lib/linguistics/index.ts side-effects).
 *
 * Usage:
 *   import { initLexicons } from 'lib/linguistics/lexicons/initLexicons';
 *   initLexicons(); // idempotent — safe to call multiple times
 *
 * Pattern: same bootstrap shape as PhonologicalRegistry.register() calls
 * in src/lib/linguistics/index.ts.
 */

import { registerLexicon, getLexiconSize } from '../rhyme/suggestRhymes';
import { frLexicon } from './fr';

let _initialized = false;

/**
 * Register all built-in lexicons.
 * Idempotent: subsequent calls are no-ops.
 */
export function initLexicons(): void {
  if (_initialized) return;

  registerLexicon('fr', frLexicon);

  // Future languages — uncomment as lexicons are onboarded:
  // registerLexicon('en', enLexicon);
  // registerLexicon('es', esLexicon);
  // registerLexicon('pt', ptLexicon);
  // registerLexicon('yo', yoLexicon);
  // registerLexicon('sw', swLexicon);
  // registerLexicon('ar', arLexicon);

  _initialized = true;
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
 * Reset for testing — allows re-registration between test suites.
 * NEVER call in production code.
 */
export function _resetLexicons_TEST_ONLY(): void {
  _initialized = false;
}
