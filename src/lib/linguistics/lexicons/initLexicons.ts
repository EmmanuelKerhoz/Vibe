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
import { deLexicon } from './de';
import { itLexicon } from './it';
import { roLexicon } from './ro';
import { nlLexicon } from './nl';
import { plLexicon } from './pl';
import { ruLexicon } from './ru';
import { zhLexicon } from './zh';
import { jaLexicon } from './ja';
import { koLexicon } from './ko';
import { hiLexicon } from './hi';
import { trLexicon } from './tr';
import { haLexicon } from './ha';
import { baLexicon } from './ba';
import { ewLexicon } from './ew';
import { miLexicon } from './mi';
import { diLexicon } from './di';

/**
 * Register all built-in lexicons.
 * Idempotent by replacement: registerLexicon() rebuilds and overwrites the
 * per-language bucket, so repeated calls are safe in app code and tests.
 */
export function initLexicons(): void {
  // — Romance
  registerLexicon('fr', frLexicon);
  registerLexicon('es', esLexicon);
  registerLexicon('pt', ptLexicon);
  registerLexicon('it', itLexicon);
  registerLexicon('ro', roLexicon);
  // — Germanic
  registerLexicon('en', enLexicon);
  registerLexicon('de', deLexicon);
  registerLexicon('nl', nlLexicon);
  // — Slavic
  registerLexicon('pl', plLexicon);
  registerLexicon('ru', ruLexicon);
  // — Semitic
  registerLexicon('ar', arLexicon);
  // — Indo-Iranian
  registerLexicon('hi', hiLexicon);
  // — Turkic
  registerLexicon('tr', trLexicon);
  // — Sinitic
  registerLexicon('zh', zhLexicon);
  // — Japanese
  registerLexicon('ja', jaLexicon);
  // — Korean
  registerLexicon('ko', koLexicon);
  // — Bantu / Niger-Congo
  registerLexicon('yo', yoLexicon);
  registerLexicon('sw', swLexicon);
  // — Afro-Asiatic (Chadic)
  registerLexicon('ha', haLexicon);
  // — KWA (Côte d'Ivoire / Ghana / Togo)
  registerLexicon('ba', baLexicon);
  registerLexicon('ew', ewLexicon);
  registerLexicon('mi', miLexicon);
  registerLexicon('di', diLexicon);
}

/**
 * Health check: returns a map of lang → entry count.
 * Useful for startup diagnostics / unit tests.
 */
export function getLexiconHealth(): Record<string, number> {
  return {
    // Romance
    fr: getLexiconSize('fr'),
    es: getLexiconSize('es'),
    pt: getLexiconSize('pt'),
    it: getLexiconSize('it'),
    ro: getLexiconSize('ro'),
    // Germanic
    en: getLexiconSize('en'),
    de: getLexiconSize('de'),
    nl: getLexiconSize('nl'),
    // Slavic
    pl: getLexiconSize('pl'),
    ru: getLexiconSize('ru'),
    // Semitic
    ar: getLexiconSize('ar'),
    // Indo-Iranian
    hi: getLexiconSize('hi'),
    // Turkic
    tr: getLexiconSize('tr'),
    // Sinitic
    zh: getLexiconSize('zh'),
    // Japanese
    ja: getLexiconSize('ja'),
    // Korean
    ko: getLexiconSize('ko'),
    // Bantu / Niger-Congo
    yo: getLexiconSize('yo'),
    sw: getLexiconSize('sw'),
    // Afro-Asiatic (Chadic)
    ha: getLexiconSize('ha'),
    // KWA (Côte d'Ivoire / Ghana / Togo)
    ba: getLexiconSize('ba'),
    ew: getLexiconSize('ew'),
    mi: getLexiconSize('mi'),
    di: getLexiconSize('di'),
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
