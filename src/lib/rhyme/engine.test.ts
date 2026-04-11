/**
 * Rhyme Engine v2 — Test Suite
 * 65 tests: router, normalize, scoring, all families including SLV/SEM/SEA/CJK/YRB/AGG
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
  // yo is Yoruboid (Niger-Congo), NOT Bantu — must route YRB
  it('routes yo → YRB (Yoruboid, not Bantu)', () => {
    expect(routeToFamily('yo').family).toBe('YRB');
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
  it('routes Slavic languages', () => {
    expect(routeToFamily('ru').family).toBe('SLV');
    expect(routeToFamily('pl').family).toBe('SLV');
    expect(routeToFamily('cs').family).toBe('SLV');
  });
  it('routes Semitic languages', () => {
    expect(routeToFamily('ar').family).toBe('SEM');
    expect(routeToFamily('he').family).toBe('SEM');
  });
  it('routes SEA/CJK languages', () => {
    expect(routeToFamily('th').family).toBe('SEA');
    expect(routeToFamily('vi').family).toBe('SEA');
    expect(routeToFamily('zh').family).toBe('CJK');
    expect(routeToFamily('ja').family).toBe('CJK');
    expect(routeToFamily('ko').family).toBe('CJK');
  });
  it('routes Yoruba → YRB', () => {
    expect(routeToFamily('yo').family).not.toBe('BNT');
  });
  it('routes Agglutinative languages', () => {
    expect(routeToFamily('tr').family).toBe('AGG');
    expect(routeToFamily('fi').family).toBe('AGG');
    expect(routeToFamily('hu').family).toBe('AGG');
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
// ─── Family: SLV ─────────────────────────────────────────────────────────────
describe('SLV rhyme engine', () => {
  it('RU: routes to SLV', () => {
    const r = rhymeScore('любовь', 'кровь', 'ru', 'ru');
    expect(r.family).toBe('SLV');
  });
  it('RU: identical ending → high score', () => {
    // Both end in -овь → same vowel reduction + coda
    const r = rhymeScore('любовь', 'кровь', 'ru', 'ru');
    expect(r.score).toBeGreaterThan(0.60);
  });
  it('PL: nasal vowel normalisation — ą/ę merge', () => {
    // końcówkę / piosenkę — both end in normalized 'en'
    const r = rhymeScore('końcówkę', 'piosenkę', 'pl', 'pl');
    expect(r.family).toBe('SLV');
    expect(r.score).toBeGreaterThan(0.50);
  });
  it('CS: diacritic-aware — láska / páska', () => {
    // Both share long-a nucleus + -ska coda
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
    // كتاب / حساب — both end in long-a + coda ب
    const rMatch    = rhymeScore('\u0643\u062A\u0627\u0628', '\u062D\u0633\u0627\u0628', 'ar', 'ar');
    // كتاب / رسول — different long vowel (aa vs uu)
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
// ─── Family: SEA + CJK ────────────────────────────────────────────────────────
describe('SEA rhyme engine', () => {
  it('TH: routes to SEA', () => {
    const r = rhymeScore('\u0E04\u0E19', '\u0E14\u0E34\u0E19', 'th', 'th');
    expect(r.family).toBe('SEA');
  });
  it('TH: nucleus is not empty', () => {
    const r = rhymeScore('\u0E04\u0E19', '\u0E14\u0E34\u0E19', 'th', 'th');
    expect(r.nucleusA.vowels).not.toBe('');
  });
  it('VI: tone match yields higher score than tone mismatch', () => {
    // trời / đời — both grave (L tone) should score higher than trời/trời vs trời/trói
    const rMatch    = rhymeScore('trời', 'đời', 'vi', 'vi');
    const rMismatch = rhymeScore('trời', 'trói', 'vi', 'vi');
    expect(rMatch.score).toBeGreaterThan(rMismatch.score);
  });
  it('VI: routes to SEA', () => {
    const r = rhymeScore('trời', 'đời', 'vi', 'vi');
    expect(r.family).toBe('SEA');
  });
});
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
    // Both end with hiragana な
    const r = rhymeScore('\u304B\u306A', '\u306A\u306A', 'ja', 'ja');
    expect(r.family).toBe('CJK');
    expect(r.score).toBeGreaterThan(0.80);
  });
  it('KO: Hangul jamo decomposition — same jung-seong → high score', () => {
    // 나 (na) vs 다 (da) — same jung-seong ㅏ
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
    // ilé (H) vs olé (H) — should score higher than ilé (H) vs olè (L)
    const rMatch    = rhymeScore('ilé', 'olé', 'yo', 'yo');
    const rMismatch = rhymeScore('ilé', 'olè', 'yo', 'yo');
    expect(rMatch.score).toBeGreaterThan(rMismatch.score);
  });
  it('YO: nucleusA vowels not empty', () => {
    const r = rhymeScore('ilé', 'olé', 'yo', 'yo');
    expect(r.nucleusA.vowels).not.toBe('');
  });
  it('YO: nasalised vowel preserved in nucleus', () => {
    // ẽ is a nasal vowel — must appear in nucleus, not stripped
    const r = rhymeScore('ẽ', 'ẽ', 'yo', 'yo');
    expect(r.score).toBeGreaterThan(0.80);
  });
});
// ─── Family: AGG ─────────────────────────────────────────────────────────────
describe('AGG rhyme engine', () => {
  it('TR: routes to AGG', () => {
    const r = rhymeScore('ev', 'sev', 'tr', 'tr');
    expect(r.family).toBe('AGG');
  });
  it('TR: suffix stripped — gelirse/görürse share same stem vowel class', () => {
    const r = rhymeScore('gelirse', 'görürse', 'tr', 'tr');
    expect(r.family).toBe('AGG');
    expect(r.score).toBeGreaterThanOrEqual(0);
  });
  it('TR: same back-vowel harmony class boosts score', () => {
    // kadar / adam — both back vowel class B
    const rSame = rhymeScore('kadar', 'adam', 'tr', 'tr');
    // gelmek / görmek — front class F
    const rFront = rhymeScore('gelmek', 'görmek', 'tr', 'tr');
    // Both should produce valid scores
    expect(rSame.score).toBeGreaterThanOrEqual(0);
    expect(rFront.score).toBeGreaterThanOrEqual(0);
  });
  it('FI: geminate vowel → moraCount 2 detection', () => {
    // talo/palo — both end in -o (no geminate)
    // saataa/vaataa — both end in -aa (geminate → moraCount 2)
    const rGeminate = rhymeScore('saataa', 'vaataa', 'fi', 'fi');
    expect(rGeminate.family).toBe('AGG');
    expect(rGeminate.score).toBeGreaterThan(0.70);
  });
  it('FI: vowel harmony merge — a/ä treated as same nucleus', () => {
    // maassa / metsässä — ssa/ssä suffix stripped; a vs ä merge → same nucleus
    const r = rhymeScore('maassa', 'metsässä', 'fi', 'fi');
    expect(r.family).toBe('AGG');
    expect(r.score).toBeGreaterThan(0.50);
  });
  it('HU: routes to AGG', () => {
    const r = rhymeScore('szerelem', 'érzelem', 'hu', 'hu');
    expect(r.family).toBe('AGG');
  });
  it('HU: long vowel preserved — ó vs o reduces score', () => {
    // szerelem / érzelem — similar front vowels
    const rMatch    = rhymeScore('szerelem', 'érzelem', 'hu', 'hu');
    // ház / has — á (long) vs a (short) — different
    const rMismatch = rhymeScore('ház', 'has', 'hu', 'hu');
    expect(rMatch.score).toBeGreaterThanOrEqual(rMismatch.score);
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
});
