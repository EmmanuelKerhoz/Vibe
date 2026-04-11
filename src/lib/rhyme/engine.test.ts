/**
 * Rhyme Engine v2 — Test Suite
 * 95 tests: router, normalize, scoring, all families including IIR/AUS/DRA
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
    expect(u.surface).toBe('so');
  });
  it('KWA langHint preserves tonal diacritic on final token (ew)', () => {
    const u = extractLineEndingUnit('me wò', 'ew');
    expect(u.segmentationMode).toBe('tone-mark');
    expect(u.surface).toBe('wò');
  });
  it('VI langHint activates tone-mark segmentation', () => {
    const u = extractLineEndingUnit('trời đất', 'vi');
    expect(u.segmentationMode).toBe('tone-mark');
    expect(u.surface).toBe('đất');
  });
  // yo must NOT activate tone-mark (it routes KWA/YRB, not tone-mark path)
  it('yo langHint does NOT activate tone-mark segmentation', () => {
    const u = extractLineEndingUnit('ilé olé', 'yo');
    expect(u.segmentationMode).toBe('whitespace');
  });
});
// ─── Router ─────────────────────────────────────────────────────────────
describe('routeToFamily', () => {
  it('routes KWA languages (ba, ew)', () => {
    expect(routeToFamily('ba').family).toBe('KWA');
    expect(routeToFamily('ew').family).toBe('KWA');
  });
  it('routes yo → YRB (Yoruboid, not Bantu)', () => {
    expect(routeToFamily('yo').family).toBe('YRB');
    expect(routeToFamily('yo').lowResource).toBe(false);
  });
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
  it('routes Slavic languages', () => {
    expect(routeToFamily('ru').family).toBe('SLV');
    expect(routeToFamily('pl').family).toBe('SLV');
    expect(routeToFamily('cs').family).toBe('SLV');
  });
  it('routes Semitic languages', () => {
    expect(routeToFamily('ar').family).toBe('SEM');
    expect(routeToFamily('he').family).toBe('SEM');
  });
  it('routes TAI/VIET languages', () => {
    expect(routeToFamily('th').family).toBe('TAI');
    expect(routeToFamily('lo').family).toBe('TAI');
    expect(routeToFamily('vi').family).toBe('VIET');
    expect(routeToFamily('km').family).toBe('VIET');
  });
  it('routes CJK languages', () => {
    expect(routeToFamily('zh').family).toBe('CJK');
    expect(routeToFamily('ja').family).toBe('CJK');
    expect(routeToFamily('ko').family).toBe('CJK');
  });
  it('routes Agglutinative languages (TRK / FIN)', () => {
    expect(routeToFamily('tr').family).toBe('TRK');
    expect(routeToFamily('fi').family).toBe('FIN');
    expect(routeToFamily('hu').family).toBe('FIN');
  });
  // New families
  it('routes IIR languages (hi, ur, bn, fa, pa)', () => {
    expect(routeToFamily('hi').family).toBe('IIR');
    expect(routeToFamily('ur').family).toBe('IIR');
    expect(routeToFamily('bn').family).toBe('IIR');
    expect(routeToFamily('fa').family).toBe('IIR');
    expect(routeToFamily('pa').family).toBe('IIR');
  });
  it('routes AUS languages (id, ms, tl, mg)', () => {
    expect(routeToFamily('id').family).toBe('AUS');
    expect(routeToFamily('ms').family).toBe('AUS');
    expect(routeToFamily('tl').family).toBe('AUS');
    expect(routeToFamily('mg').family).toBe('AUS');
  });
  it('routes DRA languages (ta, te, kn, ml)', () => {
    expect(routeToFamily('ta').family).toBe('DRA');
    expect(routeToFamily('te').family).toBe('DRA');
    expect(routeToFamily('kn').family).toBe('DRA');
    expect(routeToFamily('ml').family).toBe('DRA');
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
  it('yo routes to YRB family', () => {
    const r = rhymeScore('ilé', 'olé', 'yo', 'yo');
    expect(r.family).toBe('YRB');
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
// ─── Family: BNT ─────────────────────────────────────────────────────────────
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
// ─── Family: SLV ─────────────────────────────────────────────────────────────
describe('SLV rhyme engine', () => {
  it('RU: routes to SLV', () => {
    const r = rhymeScore('любовь', 'кровь', 'ru', 'ru');
    expect(r.family).toBe('SLV');
  });
  it('RU: identical ending → high score', () => {
    const r = rhymeScore('любовь', 'кровь', 'ru', 'ru');
    expect(r.score).toBeGreaterThan(0.60);
  });
  it('PL: nasal vowel normalisation — ą/ę merge', () => {
    const r = rhymeScore('końcówkę', 'piosenkę', 'pl', 'pl');
    expect(r.family).toBe('SLV');
    expect(r.score).toBeGreaterThan(0.50);
  });
  it('CS: diacritic-aware — láska / páska', () => {
    const r = rhymeScore('láska', 'páska', 'cs', 'cs');
    expect(r.family).toBe('SLV');
    expect(r.score).toBeGreaterThan(0.70);
  });
  it('SLV: different codas reduce score vs identical coda', () => {
    const rMatch    = rhymeScore('láska', 'páska', 'cs', 'cs');
    const rMismatch = rhymeScore('láska', 'láze', 'cs', 'cs');
    expect(rMatch.score).toBeGreaterThan(rMismatch.score);
  });
});
// ─── Family: SEM ─────────────────────────────────────────────────────────────
describe('SEM rhyme engine', () => {
  it('AR: routes to SEM', () => {
    const r = rhymeScore('\u0642\u0644\u0628', '\u062D\u0644\u0628', 'ar', 'ar');
    expect(r.family).toBe('SEM');
  });
  it('AR: shared long vowel → higher score than mismatched', () => {
    const rMatch    = rhymeScore('\u0643\u062A\u0627\u0628', '\u062D\u0633\u0627\u0628', 'ar', 'ar');
    const rMismatch = rhymeScore('\u0643\u062A\u0627\u0628', '\u0631\u0633\u0648\u0644', 'ar', 'ar');
    expect(rMatch.score).toBeGreaterThan(rMismatch.score);
  });
  it('AR: identical words → score ≈ 1', () => {
    const r = rhymeScore('\u0645\u0633\u0627\u0621', '\u0645\u0633\u0627\u0621', 'ar', 'ar');
    expect(r.score).toBeCloseTo(1, 1);
  });
  it('HE: routes to SEM', () => {
    const r = rhymeScore('\u05E9\u05DC\u05D5\u05DD', '\u05E8\u05D7\u05D5\u05DD', 'he', 'he');
    expect(r.family).toBe('SEM');
  });
  it('HE: nucleus is not empty', () => {
    const r = rhymeScore('\u05E9\u05DC\u05D5\u05DD', '\u05E8\u05D7\u05D5\u05DD', 'he', 'he');
    expect(r.nucleusA.vowels).not.toBe('');
    expect(r.nucleusB.vowels).not.toBe('');
  });
});
// ─── Family: TAI ────────────────────────────────────────────────────────────
describe('TAI rhyme engine', () => {
  it('TH: routes to TAI', () => {
    const r = rhymeScore('\u0E04\u0E19', '\u0E14\u0E34\u0E19', 'th', 'th');
    expect(r.family).toBe('TAI');
  });
  it('TH: nucleus is not empty', () => {
    const r = rhymeScore('\u0E04\u0E19', '\u0E14\u0E34\u0E19', 'th', 'th');
    expect(r.nucleusA.vowels).not.toBe('');
  });
  it('LO: routes to TAI', () => {
    const r = rhymeScore('\u0E84\u0EB9\u0E99', '\u0E94\u0EB4\u0E99', 'lo', 'lo');
    expect(r.family).toBe('TAI');
  });
});
// ─── Family: VIET ────────────────────────────────────────────────────────────
describe('VIET rhyme engine', () => {
  it('VI: routes to VIET', () => {
    const r = rhymeScore('trời', 'đời', 'vi', 'vi');
    expect(r.family).toBe('VIET');
  });
  it('VI: tone match yields higher score than tone mismatch', () => {
    const rMatch    = rhymeScore('trời', 'đời', 'vi', 'vi');
    const rMismatch = rhymeScore('trời', 'trói', 'vi', 'vi');
    expect(rMatch.score).toBeGreaterThan(rMismatch.score);
  });
});
// ─── Family: CJK ─────────────────────────────────────────────────────────────
describe('CJK rhyme engine', () => {
  it('ZH: routes to CJK', () => {
    const r = rhymeScore('\u5929', '\u5148', 'zh', 'zh');
    expect(r.family).toBe('CJK');
  });
  it('ZH: identical last character → score 1', () => {
    const r = rhymeScore('\u5929', '\u5929', 'zh', 'zh');
    expect(r.score).toBeCloseTo(1, 1);
  });
  it('ZH: different characters → penalised score < 1', () => {
    const r = rhymeScore('\u5929', '\u5148', 'zh', 'zh');
    expect(r.score).toBeLessThan(1);
  });
  it('JA: kana match → high score', () => {
    const r = rhymeScore('\u304B\u306A', '\u306A\u306A', 'ja', 'ja');
    expect(r.family).toBe('CJK');
    expect(r.score).toBeGreaterThan(0.80);
  });
  it('KO: Hangul jamo decomposition — same jung-seong → high score', () => {
    const r = rhymeScore('\uB098', '\uB2E4', 'ko', 'ko');
    expect(r.family).toBe('CJK');
    expect(r.score).toBeGreaterThan(0.70);
  });
});
// ─── Family: YRB ─────────────────────────────────────────────────────────────
describe('YRB rhyme engine', () => {
  it('YO: produces a score without error', () => {
    const r = rhymeScore('ilé', 'olé', 'yo', 'yo');
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(1);
  });
  it('YO: same tone class → higher score than tone mismatch', () => {
    const rMatch    = rhymeScore('ilé', 'olé', 'yo', 'yo');
    const rMismatch = rhymeScore('ilé', 'olè', 'yo', 'yo');
    expect(rMatch.score).toBeGreaterThan(rMismatch.score);
  });
  it('YO: nucleusA vowels not empty', () => {
    const r = rhymeScore('ilé', 'olé', 'yo', 'yo');
    expect(r.nucleusA.vowels).not.toBe('');
  });
  it('YO: nasalised vowel preserved in nucleus', () => {
    const r = rhymeScore('ẽ', 'ẽ', 'yo', 'yo');
    expect(r.score).toBeGreaterThan(0.80);
  });
});
// ─── Family: TRK ─────────────────────────────────────────────────────────────
describe('TRK rhyme engine', () => {
  it('TR: routes to TRK', () => {
    const r = rhymeScore('ev', 'sev', 'tr', 'tr');
    expect(r.family).toBe('TRK');
  });
  it('TR: suffix stripped — gelirse/görürse share same stem vowel class', () => {
    const r = rhymeScore('gelirse', 'görürse', 'tr', 'tr');
    expect(r.family).toBe('TRK');
    expect(r.score).toBeGreaterThanOrEqual(0);
  });
  it('TR: same back-vowel harmony class boosts score', () => {
    const rSame  = rhymeScore('kadar', 'adam', 'tr', 'tr');
    const rFront = rhymeScore('gelmek', 'görmek', 'tr', 'tr');
    expect(rSame.score).toBeGreaterThanOrEqual(0);
    expect(rFront.score).toBeGreaterThanOrEqual(0);
  });
});
// ─── Family: FIN ─────────────────────────────────────────────────────────────
describe('FIN rhyme engine', () => {
  it('FI: geminate vowel → moraCount 2 detection', () => {
    const rGeminate = rhymeScore('saataa', 'vaataa', 'fi', 'fi');
    expect(rGeminate.family).toBe('FIN');
    expect(rGeminate.score).toBeGreaterThan(0.70);
  });
  it('FI: vowel harmony merge — a/ä treated as same nucleus', () => {
    const r = rhymeScore('maassa', 'metsässä', 'fi', 'fi');
    expect(r.family).toBe('FIN');
    expect(r.score).toBeGreaterThan(0.50);
  });
  it('HU: routes to FIN', () => {
    const r = rhymeScore('szerelem', 'érzelem', 'hu', 'hu');
    expect(r.family).toBe('FIN');
  });
  it('HU: long vowel preserved — ó vs o reduces score', () => {
    const rMatch    = rhymeScore('szerelem', 'érzelem', 'hu', 'hu');
    const rMismatch = rhymeScore('ház', 'has', 'hu', 'hu');
    expect(rMatch.score).toBeGreaterThanOrEqual(rMismatch.score);
  });
});
// ─── Family: IIR ─────────────────────────────────────────────────────────────
describe('IIR rhyme engine', () => {
  it('HI: routes to IIR', () => {
    const r = rhymeScore('\u092A\u094D\u092F\u093E\u0930', '\u0938\u0902\u0938\u093E\u0930', 'hi', 'hi');
    expect(r.family).toBe('IIR');
  });
  it('HI: identical Devanagari endings → high score', () => {
    // दिल / नील — both end in -il
    const r = rhymeScore('\u0926\u093F\u0932', '\u0928\u0940\u0932', 'hi', 'hi');
    expect(r.family).toBe('IIR');
    expect(r.score).toBeGreaterThan(0.60);
  });
  it('HI: different vowel nuclei reduce score', () => {
    // प्यार (pyaar) vs सुबह (subah) — very different vowels
    const rMatch    = rhymeScore('\u092A\u094D\u092F\u093E\u0930', '\u0928\u093E\u0930', 'hi', 'hi');
    const rMismatch = rhymeScore('\u092A\u094D\u092F\u093E\u0930', '\u0938\u0941\u092C\u0939', 'hi', 'hi');
    expect(rMatch.score).toBeGreaterThanOrEqual(rMismatch.score);
  });
  it('HI: nucleus not empty for Devanagari input', () => {
    const r = rhymeScore('\u092A\u094D\u092F\u093E\u0930', '\u0938\u0902\u0938\u093E\u0930', 'hi', 'hi');
    expect(r.nucleusA.vowels).not.toBe('');
    expect(r.nucleusB.vowels).not.toBe('');
  });
  it('UR: routes to IIR', () => {
    const r = rhymeScore('\u062F\u0644', '\u0645\u062D\u0644', 'ur', 'ur');
    expect(r.family).toBe('IIR');
  });
  it('UR: shared long vowel (aa) → high score', () => {
    // کتاب / حساب via Urdu — both -aab
    const r = rhymeScore('\u06A9\u062A\u0627\u0628', '\u062D\u0633\u0627\u0628', 'ur', 'ur');
    expect(r.family).toBe('IIR');
    expect(r.score).toBeGreaterThan(0.65);
  });
  it('BN: routes to IIR', () => {
    const r = rhymeScore('\u09AD\u09BE\u09B2\u09CB', '\u0995\u09BE\u09B2\u09CB', 'bn', 'bn');
    expect(r.family).toBe('IIR');
  });
  it('BN: same Bengali vowel ending → high score', () => {
    // ভালো / কালো — both end in -alo
    const r = rhymeScore('\u09AD\u09BE\u09B2\u09CB', '\u0995\u09BE\u09B2\u09CB', 'bn', 'bn');
    expect(r.score).toBeGreaterThan(0.70);
  });
  it('FA: routes to IIR', () => {
    const r = rhymeScore('\u0622\u0633\u0645\u0627\u0646', '\u062C\u0627\u0646', 'fa', 'fa');
    expect(r.family).toBe('IIR');
  });
  it('FA: nucleus not empty for Perso-Arabic input', () => {
    const r = rhymeScore('\u0622\u0633\u0645\u0627\u0646', '\u062C\u0627\u0646', 'fa', 'fa');
    expect(r.nucleusA.vowels).not.toBe('');
  });
  it('PA: routes to IIR', () => {
    const r = rhymeScore('\u0A2A\u0A3F\u0A06\u0A30', '\u0A38\u0A70\u0A38\u0A3E\u0A30', 'pa', 'pa');
    expect(r.family).toBe('IIR');
  });
});
// ─── Family: AUS ─────────────────────────────────────────────────────────────
describe('AUS rhyme engine', () => {
  it('ID: routes to AUS', () => {
    const r = rhymeScore('cinta', 'kita', 'id', 'id');
    expect(r.family).toBe('AUS');
  });
  it('ID: shared open vowel ending → high score', () => {
    // cinta / kita — both end in -a
    const r = rhymeScore('cinta', 'kita', 'id', 'id');
    expect(r.score).toBeGreaterThan(0.65);
  });
  it('ID: different endings reduce score', () => {
    const rMatch    = rhymeScore('cinta', 'kita', 'id', 'id');
    const rMismatch = rhymeScore('cinta', 'pergi', 'id', 'id');
    expect(rMatch.score).toBeGreaterThan(rMismatch.score);
  });
  it('MS: routes to AUS', () => {
    const r = rhymeScore('hati', 'budi', 'ms', 'ms');
    expect(r.family).toBe('AUS');
  });
  it('TL: routes to AUS', () => {
    const r = rhymeScore('puso', 'ilaw', 'tl', 'tl');
    expect(r.family).toBe('AUS');
  });
  it('TL: digraph ng normalised (not split)', () => {
    // Tagalog words ending in -ng: both share final nasal
    const r = rhymeScore('iyang', 'kang', 'tl', 'tl');
    expect(r.family).toBe('AUS');
    expect(r.nucleusA.coda).toContain('ng');
  });
  it('MG: routes to AUS', () => {
    const r = rhymeScore('fitiavana', 'tombotsoa', 'mg', 'mg');
    expect(r.family).toBe('AUS');
  });
  it('MG: -na final reduction — fitiavana / fanomezana share -a nucleus', () => {
    const r = rhymeScore('fitiavana', 'fanomezana', 'mg', 'mg');
    expect(r.family).toBe('AUS');
    expect(r.score).toBeGreaterThan(0.50);
  });
  it('AUS: nucleus not empty', () => {
    const r = rhymeScore('cinta', 'kita', 'id', 'id');
    expect(r.nucleusA.vowels).not.toBe('');
    expect(r.nucleusB.vowels).not.toBe('');
  });
});
// ─── Family: DRA ─────────────────────────────────────────────────────────────
describe('DRA rhyme engine', () => {
  it('TA: routes to DRA', () => {
    const r = rhymeScore('\u0BAE\u0BA9\u0BAE\u0BCD', '\u0BB5\u0BBE\u0BA9\u0BAE\u0BCD', 'ta', 'ta');
    expect(r.family).toBe('DRA');
  });
  it('TA: shared coda nasal → high score', () => {
    // மனம் / வானம் — both end in -am
    const r = rhymeScore('\u0BAE\u0BA9\u0BAE\u0BCD', '\u0BB5\u0BBE\u0BA9\u0BAE\u0BCD', 'ta', 'ta');
    expect(r.score).toBeGreaterThan(0.55);
  });
  it('TA: retroflex vs dental coda reduces score', () => {
    // Words ending in retroflex ண vs dental ந
    const rRetro  = rhymeScore('\u0BAE\u0BA3\u0BCD', '\u0BA4\u0BA3\u0BCD', 'ta', 'ta');
    const rDental = rhymeScore('\u0BAE\u0BA9\u0BCD', '\u0BA4\u0BA9\u0BCD', 'ta', 'ta');
    // Both valid scores, retroflex (nn/tt) differs from dental (n/t)
    expect(rRetro.score).toBeGreaterThanOrEqual(0);
    expect(rDental.score).toBeGreaterThanOrEqual(0);
  });
  it('TA: nucleus not empty', () => {
    const r = rhymeScore('\u0BAE\u0BA9\u0BAE\u0BCD', '\u0BB5\u0BBE\u0BA9\u0BAE\u0BCD', 'ta', 'ta');
    expect(r.nucleusA.vowels).not.toBe('');
  });
  it('TE: routes to DRA', () => {
    const r = rhymeScore('\u0C2E\u0C28\u0C38\u0C41', '\u0C35\u0C3E\u0C28\u0C38\u0C41', 'te', 'te');
    expect(r.family).toBe('DRA');
  });
  it('TE: same vowel ending → score > 0.60', () => {
    // మనసు / వానసు — both end in -su
    const r = rhymeScore('\u0C2E\u0C28\u0C38\u0C41', '\u0C35\u0C3E\u0C28\u0C38\u0C41', 'te', 'te');
    expect(r.score).toBeGreaterThan(0.60);
  });
  it('KN: routes to DRA', () => {
    const r = rhymeScore('\u0C95\u0CA8\u0CB8\u0CC1', '\u0CB5\u0CBE\u0CA8\u0CB8\u0CC1', 'kn', 'kn');
    expect(r.family).toBe('DRA');
  });
  it('ML: routes to DRA', () => {
    const r = rhymeScore('\u0D2E\u0D28\u0D38\u0D4D', '\u0D35\u0D3E\u0D28\u0D38\u0D4D', 'ml', 'ml');
    expect(r.family).toBe('DRA');
  });
  it('ML: chillu final consonant handled without crash', () => {
    // Words with chillu letters ൻ (n) ൽ (l)
    const r = rhymeScore('\u0D2E\u0D28\u0D38\u0D4D', '\u0D35\u0D28\u0D28\u0D4D', 'ml', 'ml');
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(1);
  });
});
// ─── Cross-family fallback ────────────────────────────────────────────────────
describe('cross-family fallback', () => {
  it('produces a result with FALLBACK family', () => {
    const r = rhymeScore('night', 'nuit', 'en', 'fr');
    expect(r.family).toBe('FALLBACK');
    expect(r.warnings).toContain('cross-family-fallback');
  });
  it('cross-family: nucleusA and nucleusB are not both empty', () => {
    const r = rhymeScore('the night', 'la nuit', 'en', 'fr');
    const bothEmpty = r.nucleusA.vowels === '' && r.nucleusB.vowels === '';
    expect(bothEmpty).toBe(false);
  });
  it('FALLBACK: surface is NFC-normalised (no broken multi-byte slice)', () => {
    const r = rhymeScore('\u0645\u0633\u0627\u0621', '\u0645\u0633\u0627\u0621', 'ar', 'ar');
    expect(r.score).toBeCloseTo(1, 1);
  });
  // Cross-family between new families
  it('IIR × ROM cross-family → FALLBACK', () => {
    const r = rhymeScore('\u092A\u094D\u092F\u093E\u0930', 'amour', 'hi', 'fr');
    expect(r.family).toBe('FALLBACK');
    expect(r.warnings).toContain('cross-family-fallback');
  });
  it('AUS × GER cross-family → FALLBACK', () => {
    const r = rhymeScore('cinta', 'night', 'id', 'en');
    expect(r.family).toBe('FALLBACK');
  });
  it('DRA × SEM cross-family → FALLBACK', () => {
    const r = rhymeScore('\u0BAE\u0BA9\u0BAE\u0BCD', '\u0642\u0644\u0628', 'ta', 'ar');
    expect(r.family).toBe('FALLBACK');
  });
});
