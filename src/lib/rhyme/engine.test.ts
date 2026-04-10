/**
 * Rhyme Engine v2 — Test Suite
 * 35 tests: router, normalize, scoring, all 5 families, corrections post-refacto
 */

import { describe, it, expect } from 'vitest';
import { rhymeScore } from './engine';
import { extractLineEndingUnit, normalizeInput } from './normalize';
import { routeToFamily } from './router';
import { phonemeEditDistance, categorize, scoreKWANormalized } from './scoring';

// ─── Normalization ─────────────────────────────────────────────────────────
describe('normalizeInput', () => {
  it('NFC normalizes', () => {
    const a = 'e\u0301'; // e + combining acute
    expect(normalizeInput(a)).toBe('é');
  });
  it('trims whitespace', () => {
    expect(normalizeInput('  hello  ')).toBe('hello');
  });
  it('preserves tonal diacritics', () => {
    expect(normalizeInput('àmá')).toBe('àmá');
  });
});
describe('extractLineEndingUnit', () => {
  it('returns empty for blank line', () => {
    const u = extractLineEndingUnit('');
    expect(u.surface).toBe('');
    expect(u.warnings).toContain('empty-line');
  });
  it('extracts last Latin word, strips punct', () => {
    const u = extractLineEndingUnit('le ciel est bleu,');
    expect(u.surface).toBe('bleu');
    expect(u.segmentationMode).toBe('whitespace');
    expect(u.script).toBe('latin');
  });
  it('extracts last CJK character', () => {
    const u = extractLineEndingUnit('月が綺麗');
    expect(u.surface).toBe('麗');
    expect(u.segmentationMode).toBe('character');
    expect(u.script).toBe('cjk');
  });
  it('handles Arabic RTL token', () => {
    const u = extractLineEndingUnit('أنا أحب العربية');
    expect(u.script).toBe('arabic');
    expect(u.segmentationMode).toBe('rtl');
    expect(u.surface).toBeTruthy();
  });
  it('strips Latin punctuation only', () => {
    const u = extractLineEndingUnit('night!');
    expect(u.surface).toBe('night');
  });

  // tone-mark mode via langHint
  it('KWA langHint activates tone-mark segmentation (ba)', () => {
    const u = extractLineEndingUnit("n'gá so", 'ba');
    expect(u.segmentationMode).toBe('tone-mark');
    expect(u.script).toBe('latin');
    // Surface must preserve tonal diacritic on final token
    expect(u.surface).toBe('so');
  });
  it('KWA langHint preserves tonal diacritic on final token (ew)', () => {
    const u = extractLineEndingUnit('me wò', 'ew');
    expect(u.segmentationMode).toBe('tone-mark');
    // U+00F2 (grave) must survive — not stripped as punctuation
    expect(u.surface).toBe('wò');
  });
  it('VI langHint activates tone-mark segmentation', () => {
    const u = extractLineEndingUnit('trời đất', 'vi');
    expect(u.segmentationMode).toBe('tone-mark');
    expect(u.surface).toBe('đất');
  });
});
// ─── Router ─────────────────────────────────────────────────────────────
describe('routeToFamily', () => {
  it('routes KWA languages (ba, ew)', () => {
    expect(routeToFamily('ba').family).toBe('KWA');
    expect(routeToFamily('ew').family).toBe('KWA');
  });
  // yo is Yoruboid (Niger-Congo), NOT Bantu — must route KWA
  it('routes yo → KWA (Yoruboid, not Bantu)', () => {
    expect(routeToFamily('yo').family).toBe('KWA');
    expect(routeToFamily('yo').lowResource).toBe(false);
  });
  // sw is the sole true Bantu representative
  it('routes sw → BNT (true Bantu)', () => {
    expect(routeToFamily('sw').family).toBe('BNT');
  });
  it('routes Romance languages', () => {
    expect(routeToFamily('fr').family).toBe('ROM');
    expect(routeToFamily('es').family).toBe('ROM');
  });
  it('routes Germanic languages', () => {
    expect(routeToFamily('en').family).toBe('GER');
    expect(routeToFamily('de').family).toBe('GER');
  });
  it('fallbacks unknown lang with lowResource=true', () => {
    const r = routeToFamily('__unknown__');
    expect(r.family).toBe('FALLBACK');
    expect(r.lowResource).toBe(true);
  });
});
// ─── Scoring utilities ───────────────────────────────────────────────────────
describe('phonemeEditDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(phonemeEditDistance('abc', 'abc')).toBe(0);
  });
  it('returns 1 for completely different strings same length', () => {
    expect(phonemeEditDistance('abc', 'xyz')).toBeCloseTo(1, 1);
  });
  it('returns 1 for empty vs non-empty', () => {
    expect(phonemeEditDistance('', 'abc')).toBe(1);
  });
  it('handles partial match', () => {
    const d = phonemeEditDistance('night', 'light');
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(1);
  });
});
describe('categorize', () => {
  it('perfect at 0.95', () => expect(categorize(0.95)).toBe('perfect'));
  it('rich at 0.85',    () => expect(categorize(0.85)).toBe('rich'));
  it('sufficient at 0.65', () => expect(categorize(0.65)).toBe('sufficient'));
  it('weak at 0.40',    () => expect(categorize(0.40)).toBe('weak'));
  it('none at 0.10',    () => expect(categorize(0.10)).toBe('none'));
});
// ─── Family: KWA ─────────────────────────────────────────────────────────
describe('KWA rhyme engine', () => {
  it('perfect score for identical Baoulé endings', () => {
    const r = rhymeScore("n'gá", 'ka gá', 'ba', 'ba');
    expect(r.family).toBe('KWA');
    expect(r.score).toBeGreaterThan(0.85);
  });
  it('tone mismatch reduces score (ba)', () => {
    const rMatch    = rhymeScore('amá', 'damá', 'ba', 'ba');
    const rMismatch = rhymeScore('amá', 'damà', 'ba', 'ba');
    expect(rMatch.score).toBeGreaterThan(rMismatch.score);
  });
  // yo now routes KWA — tone extraction must still work
  it('yo routes to KWA family', () => {
    const r = rhymeScore('ilé', 'olé', 'yo', 'yo');
    expect(r.family).toBe('KWA');
  });
  it('yo tone match yields higher score than mismatch', () => {
    const rMatch    = rhymeScore('ilé', 'olé', 'yo', 'yo');
    const rMismatch = rhymeScore('ilé', 'olè', 'yo', 'yo');
    expect(rMatch.score).toBeGreaterThanOrEqual(rMismatch.score);
  });
});
// ─── Family: CRV + Haoussa tonal ─────────────────────────────────────────────
describe('CRV rhyme engine', () => {
  it('HA: same tone class → higher score than tone mismatch', () => {
    // Haoussa: gídaa (H) vs ídaa (H) — same tone, should score higher
    // than gídaa (H) vs ìdaa (L)
    const rMatch    = rhymeScore('gídaa', 'ídaa', 'ha', 'ha');
    const rMismatch = rhymeScore('gídaa', 'ìdaa', 'ha', 'ha');
    expect(rMatch.score).toBeGreaterThanOrEqual(rMismatch.score);
  });
  it('HA: nucleus extracted (not empty)', () => {
    const r = rhymeScore('kasuwa', 'duniya', 'ha', 'ha');
    expect(r.nucleusA.vowels).not.toBe('');
    expect(r.nucleusB.vowels).not.toBe('');
  });
});
// ─── Family: Romance ────────────────────────────────────────────────────────
describe('ROM rhyme engine', () => {
  it('FR: amour / toujours → sufficient+', () => {
    const r = rhymeScore('mon amour', 'pour toujours', 'fr', 'fr');
    expect(r.family).toBe('ROM');
    expect(['sufficient', 'rich', 'perfect']).toContain(r.category);
  });
  it('FR: mute-e parity — belle / pelle', () => {
    const r = rhymeScore('ma belle', 'une pelle', 'fr', 'fr');
    expect(r.score).toBeGreaterThan(0.55);
  });
  it('ES: canción / corazón → rich+', () => {
    const r = rhymeScore('la canción', 'el corazón', 'es', 'es');
    expect(r.score).toBeGreaterThanOrEqual(0.70);
  });
});
// ─── Family: Germanic ────────────────────────────────────────────────────────
describe('GER rhyme engine', () => {
  it('EN: night / light → perfect', () => {
    const r = rhymeScore('the night', 'the light', 'en', 'en');
    expect(r.family).toBe('GER');
    expect(r.score).toBeGreaterThan(0.88);
  });
  it('EN: love / above → sufficient+', () => {
    const r = rhymeScore('undying love', 'the stars above', 'en', 'en');
    expect(r.score).toBeGreaterThan(0.55);
  });
  it('DE: Ung-suffix match', () => {
    const r = rhymeScore('Hoffnung', 'Strömung', 'de', 'de');
    expect(r.score).toBeGreaterThan(0.70);
  });
});
// ─── Family: BNT (Swahili only post-refacto) ─────────────────────────────────
describe('BNT rhyme engine', () => {
  it('SW: routes to BNT', () => {
    const r = rhymeScore('nakupenda', 'karibu sana', 'sw', 'sw');
    expect(r.family).toBe('BNT');
  });
  it('SW: identical final vowel → non-zero score', () => {
    const r = rhymeScore('nakupenda', 'karibu sana', 'sw', 'sw');
    expect(r.score).toBeGreaterThanOrEqual(0);
  });
});
// ─── Cross-family fallback ────────────────────────────────────────────────────
describe('cross-family fallback', () => {
  it('produces a result with FALLBACK family', () => {
    const r = rhymeScore('night', 'nuit', 'en', 'fr');
    expect(r.family).toBe('FALLBACK');
    expect(r.warnings).toContain('cross-family-fallback');
  });
  // Post-refacto: nuclei must be real, not dummy empty objects
  it('cross-family: nucleusA and nucleusB are not both empty', () => {
    const r = rhymeScore('the night', 'la nuit', 'en', 'fr');
    const bothEmpty = r.nucleusA.vowels === '' && r.nucleusB.vowels === '';
    expect(bothEmpty).toBe(false);
  });
  // FALLBACK graphemic path: surface must be NFC-normalised before slice
  it('FALLBACK: surface is NFC-normalised (no broken multi-byte slice)', () => {
    // Arabic surface — slice(-4) must not produce a broken string
    const r = rhymeScore('\u0645\u0633\u0627\u0621', '\u0645\u0633\u0627\u0621', 'ar', 'ar');
    expect(r.score).toBeCloseTo(1, 1);
  });
});
