/**
 * initLexicons.test.ts
 * Validates that every registered lexicon loads correctly
 * and that KWA canonical/alias codes both resolve.
 *
 * Coverage:
 *   - getLexiconHealth(): all 23 canonical codes return non-zero entry count
 *   - KWA alias codes (ba/ew/mi/di) → same bucket as canonical (bci/ee/gej/dyu)
 *   - getLexiconSize() for ad-hoc codes returns 0 for unknown keys
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { initLexicons, getLexiconHealth } from './initLexicons';
import { getLexiconSize } from '../rhyme/PhonemeStore';

beforeAll(() => {
  initLexicons();
});

// ─── Health: all canonical codes populated ────────────────────────────────────

describe('getLexiconHealth — all canonical codes non-zero', () => {
  it('every lang has at least one entry', () => {
    const health = getLexiconHealth();
    for (const [lang, count] of Object.entries(health)) {
      expect(count, `lexicon '${lang}' is empty`).toBeGreaterThan(0);
    }
  });

  it('covers all 23 expected canonical codes', () => {
    const health = getLexiconHealth();
    const expected = [
      'fr','es','pt','it','ro',
      'en','de','nl',
      'pl','ru',
      'ar','hi','tr',
      'zh','ja','ko',
      'yo','sw','ha',
      'bci','ee','gej','dyu',
    ];
    for (const code of expected) {
      expect(health, `health map missing '${code}'`).toHaveProperty(code);
    }
  });
});

// ─── KWA alias codes resolve to same size as canonical ───────────────────────

describe('KWA alias codes — ba/ew/mi/di mirror canonical bci/ee/gej/dyu', () => {
  it('ba (alias) === bci (canonical) bucket size', () => {
    expect(getLexiconSize('ba')).toBe(getLexiconSize('bci'));
  });

  it('ew (alias) === ee (canonical) bucket size', () => {
    expect(getLexiconSize('ew')).toBe(getLexiconSize('ee'));
  });

  it('mi (alias) === gej (canonical) bucket size', () => {
    expect(getLexiconSize('mi')).toBe(getLexiconSize('gej'));
  });

  it('di (alias) === dyu (canonical) bucket size', () => {
    expect(getLexiconSize('di')).toBe(getLexiconSize('dyu'));
  });

  it('alias and canonical sizes are both > 0', () => {
    for (const code of ['ba','ew','mi','di','bci','ee','gej','dyu']) {
      expect(getLexiconSize(code), `'${code}' empty`).toBeGreaterThan(0);
    }
  });
});

// ─── Unknown codes return 0 ───────────────────────────────────────────────────

describe('getLexiconSize — unknown codes', () => {
  it('returns 0 for unregistered lang code', () => {
    expect(getLexiconSize('xx')).toBe(0);
    expect(getLexiconSize('')).toBe(0);
  });
});
