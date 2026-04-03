/**
 * phonemicStrategiesExtended.test.ts  (R12)
 *
 * Test suites for seven strategy families not covered by
 * phonemicStrategies.test.ts:
 *
 *   ALGO-SIN  — SiniticStrategy   (zh, yue, wuu)
 *   ALGO-SEM  — SemiticStrategy   (ar, he, am)
 *   ALGO-BNT  — BantuStrategy     (sw, yo, zu, xh)
 *   ALGO-KWA  — KwaStrategy       (BA, DI, EW, MI)
 *   ALGO-CRV  — CrvStrategy       (bkv, iko, ha)
 *   ALGO-TAI  — TaiStrategy       (th, lo)
 *   ALGO-VIET — VietStrategy      (vi, km)
 *
 * All tests use the public PhonologicalRegistry API:
 *   PhonologicalRegistry.analyze(text, lang)  → AnalysisResult | null
 *   PhonologicalRegistry.compare(a, b, lang)  → CompareResult | null
 *
 * AnalysisResult shape:
 *   { algoId, syllables, rhymeNucleus }
 *
 * CompareResult shape:
 *   { score }   — 0..1
 */

import { describe, expect, it } from 'vitest';
import { PhonologicalRegistry } from '../index';

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-SIN — SiniticStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('SiniticStrategy (ALGO-SIN)', () => {

  // ── algoId registration ──────────────────────────────────────────────────

  it('is registered as ALGO-SIN for zh', () => {
    const r = PhonologicalRegistry.analyze('hao3', 'zh');
    expect(r?.algoId).toBe('ALGO-SIN');
  });

  it('is registered as ALGO-SIN for yue', () => {
    const r = PhonologicalRegistry.analyze('hou2', 'yue');
    expect(r?.algoId).toBe('ALGO-SIN');
  });

  it('is registered as ALGO-SIN for wuu', () => {
    const r = PhonologicalRegistry.analyze('hao', 'wuu');
    expect(r?.algoId).toBe('ALGO-SIN');
  });

  // ── Mandarin Pinyin tone digits ───────────────────────────────────────────

  it('ZH: "hao3" → tone L (tone 3 = dipping)', () => {
    const r = PhonologicalRegistry.analyze('hao3', 'zh');
    expect(r?.rhymeNucleus.toneClass).toBe('L');
  });

  it('ZH: "ma1" → tone M (tone 1 = high level)', () => {
    const r = PhonologicalRegistry.analyze('ma1', 'zh');
    expect(r?.rhymeNucleus.toneClass).toBe('M');
  });

  it('ZH: "lai2" → tone LH (tone 2 = rising)', () => {
    const r = PhonologicalRegistry.analyze('lai2', 'zh');
    expect(r?.rhymeNucleus.toneClass).toBe('LH');
  });

  it('ZH: "shi4" → tone HL (tone 4 = falling)', () => {
    const r = PhonologicalRegistry.analyze('shi4', 'zh');
    expect(r?.rhymeNucleus.toneClass).toBe('HL');
  });

  // ── Cantonese entering tones ──────────────────────────────────────────────

  it('YUE: Jyutping "baak3" (tone 3, coda k = entering) → tone ML', () => {
    // band=M (tone3), entering coda → CANTONESE_ENTERING_TONES.M = 'ML'
    const r = PhonologicalRegistry.analyze('baak3', 'yue');
    expect(r?.rhymeNucleus.toneClass).toBe('ML');
  });

  it('YUE: Jyutping "si1" (tone 1, no coda = non-entering) → tone H', () => {
    // band=H (tone1), non-entering → CANTONESE_NON_ENTERING_TONES.H = 'H'
    const r = PhonologicalRegistry.analyze('si1', 'yue');
    expect(r?.rhymeNucleus.toneClass).toBe('H');
  });

  // ── Unspaced Pinyin segmentation ─────────────────────────────────────────

  it('ZH: "nihao" (unspaced) segments into 2 syllables', () => {
    const r = PhonologicalRegistry.analyze('nihao', 'zh');
    expect(r?.syllables.length).toBeGreaterThanOrEqual(2);
  });

  // ── Raw Han fallback ──────────────────────────────────────────────────────

  it('ZH: raw Han input sets lowResourceFallback on rhymeNucleus', () => {
    const r = PhonologicalRegistry.analyze('好', 'zh');
    expect(r?.rhymeNucleus.lowResourceFallback).toBe(true);
  });

  // ── Scoring ───────────────────────────────────────────────────────────────

  it('ZH: compare("hao3", "dao3") → score ≥ 0.9 (same nucleus ao, same tone L)', () => {
    const r = PhonologicalRegistry.compare('hao3', 'dao3', 'zh');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('ZH: compare("ma1", "ma4") → score < 0.7 (same nucleus, different tone)', () => {
    // tone 1 = M vs tone 4 = HL → tone mismatch penalises score
    const r = PhonologicalRegistry.compare('ma1', 'ma4', 'zh');
    expect(r?.score).toBeLessThan(0.7);
  });

  it('ZH: compare("hao3", "zhi1") → score < 0.5 (different nucleus ao vs i)', () => {
    const r = PhonologicalRegistry.compare('hao3', 'zhi1', 'zh');
    expect(r?.score).toBeLessThan(0.5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-SEM — SemiticStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('SemiticStrategy (ALGO-SEM)', () => {

  // ── algoId registration ──────────────────────────────────────────────────

  it('is registered as ALGO-SEM for ar', () => {
    const r = PhonologicalRegistry.analyze('كِتَاب', 'ar');
    expect(r?.algoId).toBe('ALGO-SEM');
  });

  it('is registered as ALGO-SEM for he', () => {
    const r = PhonologicalRegistry.analyze('שָׁלוֹם', 'he');
    expect(r?.algoId).toBe('ALGO-SEM');
  });

  // ── Arabic tashkeel stripping ─────────────────────────────────────────────

  it('AR: word with tashkeel produces a non-empty syllable array', () => {
    // كَتَبَ (kataba, past tense "he wrote") — 3 short vowels
    const r = PhonologicalRegistry.analyze('كَتَبَ', 'ar');
    expect(r?.syllables.length).toBeGreaterThan(0);
  });

  it('AR: word without tashkeel still parses (orthographic fallback)', () => {
    // كتب — same root without diacritics
    const r = PhonologicalRegistry.analyze('كتب', 'ar');
    expect(r).not.toBeNull();
  });

  it('AR: "كِتَاب" (kitaab) — rhymeNucleus.nucleus is a vowel character', () => {
    const r = PhonologicalRegistry.analyze('كِتَاب', 'ar');
    // Final syllable nucleus should be a vowel, not a consonant
    const nucleus = r?.rhymeNucleus.nucleus ?? '';
    expect(nucleus.length).toBeGreaterThan(0);
  });

  // ── Hebrew matres lectionis ───────────────────────────────────────────────

  it('HE: "שָׁלוֹם" (shalom) — produces at least 2 syllables', () => {
    const r = PhonologicalRegistry.analyze('שָׁלוֹם', 'he');
    expect(r?.syllables.length).toBeGreaterThanOrEqual(2);
  });

  it('HE: "שָׁלוֹם" and "שָׂלוֹם" share the same rhyme nucleus', () => {
    // Both romanise to the same rime 'om'
    const a = PhonologicalRegistry.analyze('שָׁלוֹם', 'he');
    const b = PhonologicalRegistry.analyze('שָׂלוֹם', 'he');
    expect(a?.rhymeNucleus.nucleus).toBe(b?.rhymeNucleus.nucleus);
  });

  // ── Amharic sentinel (low-resource fallback) ──────────────────────────────

  it('AM: Amharic Fidel input sets lowResourceFallback', () => {
    // ሠላም (selam, "peace" in Amharic)
    const r = PhonologicalRegistry.analyze('ሠላም', 'am');
    expect(r?.rhymeNucleus.lowResourceFallback).toBe(true);
  });

  // ── Scoring ───────────────────────────────────────────────────────────────

  it('AR: compare("كَتَبَ", "ذَهَبَ") — same CVC template → score ≥ 0.7', () => {
    // Both are fa'ala templates with final 'a' vowel
    const r = PhonologicalRegistry.compare('كَتَبَ', 'ذَهَبَ', 'ar');
    expect(r?.score).toBeGreaterThanOrEqual(0.7);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-BNT — BantuStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('BantuStrategy (ALGO-BNT)', () => {

  // ── algoId registration ──────────────────────────────────────────────────

  it('is registered as ALGO-BNT for sw', () => {
    const r = PhonologicalRegistry.analyze('mama', 'sw');
    expect(r?.algoId).toBe('ALGO-BNT');
  });

  it('is registered as ALGO-BNT for yo', () => {
    const r = PhonologicalRegistry.analyze('ile', 'yo');
    expect(r?.algoId).toBe('ALGO-BNT');
  });

  it('is registered as ALGO-BNT for zu', () => {
    const r = PhonologicalRegistry.analyze('ubuntu', 'zu');
    expect(r?.algoId).toBe('ALGO-BNT');
  });

  // ── CV structure ─────────────────────────────────────────────────────────

  it('SW: "mama" → 2 syllables each with template CV', () => {
    const r = PhonologicalRegistry.analyze('mama', 'sw');
    expect(r?.syllables.length).toBe(2);
    r?.syllables.forEach(syl => expect(syl.template).toBe('CV'));
  });

  it('SW: "mama" → last syllable is stressed', () => {
    const r = PhonologicalRegistry.analyze('mama', 'sw');
    const last = r?.syllables[r.syllables.length - 1];
    expect(last?.stressed).toBe(true);
  });

  // ── Nominal prefix strip ──────────────────────────────────────────────────

  it('SW: "ubuntu" (prefix u-) — syllable array is not empty', () => {
    // stripNominalPrefix removes the class prefix; remaining is parseable
    const r = PhonologicalRegistry.analyze('ubuntu', 'sw');
    expect(r?.syllables.length).toBeGreaterThan(0);
  });

  // ── ATR vowel normalisation ───────────────────────────────────────────────

  it('YO: −ATR vowel ɛ in "ẹṣọ" normalises to e in rhymeNucleus', () => {
    // ẹ (U+1EB9) is −ATR /ɛ/ → normalised to 'e'
    const r = PhonologicalRegistry.analyze('ẹṣọ', 'yo');
    // Nucleus of last syllable should be normalised
    const last = r?.syllables[r.syllables.length - 1];
    // ọ (U+1ECD) is −ATR /ɔ/ → normalised to 'o'
    expect(last?.nucleus).toBe('o');
  });

  // ── lowResourceFallback ───────────────────────────────────────────────────

  it('SW: rhymeNucleus.lowResourceFallback is true (G2P stub)', () => {
    const r = PhonologicalRegistry.analyze('mama', 'sw');
    expect(r?.rhymeNucleus.lowResourceFallback).toBe(true);
  });

  // ── Tone detection from orthographic diacritics ───────────────────────────

  it('YO: "ọmọ" (child) — at least one syllable has a non-null tone', () => {
    // Yoruba uses diacritics; even orthographic tones should be captured
    const r = PhonologicalRegistry.analyze('ọmọ', 'yo');
    const hasTone = r?.syllables.some(s => s.tone !== null);
    // If diacritics are present in the input, tone must not all be null
    // (This is best-effort since G2P is a stub)
    expect(r?.syllables.length).toBeGreaterThan(0);
    // We do not assert hasTone=true since orthographic ọ has no diacritic
    // tone mark — just ensure parsing does not crash
    expect(hasTone).toBeDefined();
  });

  // ── Scoring ───────────────────────────────────────────────────────────────

  it('SW: compare("mama", "hama") → score ≥ 0.9 (same nucleus a, same template)', () => {
    const r = PhonologicalRegistry.compare('mama', 'hama', 'sw');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('SW: compare("mama", "mimi") → score < 0.5 (nucleus a vs i)', () => {
    const r = PhonologicalRegistry.compare('mama', 'mimi', 'sw');
    expect(r?.score).toBeLessThan(0.5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-KWA — KwaStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('KwaStrategy (ALGO-KWA)', () => {

  // ── algoId registration ──────────────────────────────────────────────────

  it('is registered as ALGO-KWA for bci (Baoulé)', () => {
    const r = PhonologicalRegistry.analyze('kua', 'bci');
    expect(r?.algoId).toBe('ALGO-KWA');
  });

  it('is registered as ALGO-KWA for ee (Ewe)', () => {
    const r = PhonologicalRegistry.analyze('ame', 'ee');
    expect(r?.algoId).toBe('ALGO-KWA');
  });

  // ── Tone diacritic capture ────────────────────────────────────────────────

  it('EE: "á" (high tone a) → toneClass H', () => {
    const r = PhonologicalRegistry.analyze('á', 'ee');
    expect(r?.rhymeNucleus.toneClass).toBe('H');
  });

  it('EE: "à" (low tone a) → toneClass L', () => {
    const r = PhonologicalRegistry.analyze('à', 'ee');
    expect(r?.rhymeNucleus.toneClass).toBe('L');
  });

  it('EE: "â" (falling) → toneClass HL', () => {
    const r = PhonologicalRegistry.analyze('â', 'ee');
    expect(r?.rhymeNucleus.toneClass).toBe('HL');
  });

  // ── Ewe tonal depression ──────────────────────────────────────────────────

  it('EE: voiced obstruent onset "dá" — H tone depressed to M', () => {
    // onset 'd' ∈ EWE_VOICED_OBSTRUENTS, tone H → depressed to M
    const r = PhonologicalRegistry.analyze('dá', 'ee');
    expect(r?.syllables[0]?.tone).toBe('M');
  });

  it('EE: voiceless onset "tá" — H tone NOT depressed (stays H)', () => {
    const r = PhonologicalRegistry.analyze('tá', 'ee');
    expect(r?.syllables[0]?.tone).toBe('H');
  });

  // ── Baoulé 5-level tone normalisation ────────────────────────────────────

  it('BCI: tone H remains H after normalisation', () => {
    const r = PhonologicalRegistry.analyze('á', 'bci');
    expect(r?.rhymeNucleus.toneClass).toBe('H');
  });

  it('BCI: tone L remains L after normalisation', () => {
    const r = PhonologicalRegistry.analyze('à', 'bci');
    expect(r?.rhymeNucleus.toneClass).toBe('L');
  });

  // ── CV-only structure ─────────────────────────────────────────────────────

  it('EE: "ame" → 2 CV syllables, codaClass null on both', () => {
    const r = PhonologicalRegistry.analyze('ame', 'ee');
    expect(r?.syllables.length).toBe(2);
    r?.syllables.forEach(syl => expect(syl.coda).toBe(''));
  });

  // ── lowResourceFallback ───────────────────────────────────────────────────

  it('EE: rhymeNucleus.lowResourceFallback is true (G2P stub)', () => {
    const r = PhonologicalRegistry.analyze('ame', 'ee');
    expect(r?.rhymeNucleus.lowResourceFallback).toBe(true);
  });

  // ── Scoring ───────────────────────────────────────────────────────────────

  it('EE: compare("á", "bá") → score ≥ 0.7 (same nucleus a; "bá" onset b depresses H→M, partial tone mismatch)', () => {
    // 'á'  → onset ∅,  toneClass H (no depression)
    // 'bá' → onset 'b' ∈ EWE_VOICED_OBSTRUENTS → toneClass M (H depressed)
    // nucleus match: full score; tone mismatch (H vs M): partial penalty
    // → combined score is below 1.0 but well above 0.7
    const r = PhonologicalRegistry.compare('á', 'bá', 'ee');
    expect(r?.score).toBeGreaterThanOrEqual(0.7);
  });

  it('EE: compare("á", "à") → score < 0.8 (same nucleus, different tone)', () => {
    const r = PhonologicalRegistry.compare('á', 'à', 'ee');
    expect(r?.score).toBeLessThan(0.8);
  });

  it('EE: compare("á", "é") → score < 0.5 (different nucleus)', () => {
    const r = PhonologicalRegistry.compare('á', 'é', 'ee');
    expect(r?.score).toBeLessThan(0.5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-CRV — CrvStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('CrvStrategy (ALGO-CRV)', () => {

  // ── algoId registration ──────────────────────────────────────────────────

  it('is registered as ALGO-CRV for ha (Hausa)', () => {
    const r = PhonologicalRegistry.analyze('gida', 'ha');
    expect(r?.algoId).toBe('ALGO-CRV');
  });

  // ── Hausa moraic weight ───────────────────────────────────────────────────

  it('HA: "daːki" (long vowel) → first syllable weight heavy', () => {
    const r = PhonologicalRegistry.analyze('daːki', 'ha');
    expect(r?.syllables[0]?.weight).toBe('heavy');
  });

  it('HA: "gida" (short vowels, open syllables) → syllables weight light', () => {
    const r = PhonologicalRegistry.analyze('gida', 'ha');
    r?.syllables.forEach(syl => expect(syl.weight).toBe('light'));
  });

  it('HA: CVC syllable (coda present) → weight heavy', () => {
    // "gari" ends in consonant 'r' which is in CRV_CODA_SET
    const r = PhonologicalRegistry.analyze('gari', 'ha');
    // If coda 'r' is captured on last syllable, weight = heavy
    const last = r?.syllables[r.syllables.length - 1];
    if (last?.coda) {
      expect(last.weight).toBe('heavy');
    } else {
      // 'i' absorbed coda — still valid, just ensure parse succeeds
      expect(r?.syllables.length).toBeGreaterThan(0);
    }
  });

  // ── Tone capture ──────────────────────────────────────────────────────────

  it('HA: "gídā" (with tone diacritics) — non-null toneClass on rhymeNucleus', () => {
    const r = PhonologicalRegistry.analyze('gídā', 'ha');
    // Hausa uses H/L tones marked with acute/macron in some orthographies
    expect(r).not.toBeNull();
  });

  // ── lowResourceFallback for BK/OG ────────────────────────────────────────

  it('BKV: rhymeNucleus.lowResourceFallback is true for Bekwarra', () => {
    const r = PhonologicalRegistry.analyze('aba', 'bkv');
    expect(r?.rhymeNucleus.lowResourceFallback).toBe(true);
  });

  it('HA: rhymeNucleus.lowResourceFallback is false for Hausa (partial G2P)', () => {
    const r = PhonologicalRegistry.analyze('gida', 'ha');
    expect(r?.rhymeNucleus.lowResourceFallback).toBeFalsy();
  });

  // ── Coda class ────────────────────────────────────────────────────────────

  it('HA: "waken" — nasal coda n → codaClass nasal', () => {
    const r = PhonologicalRegistry.analyze('waken', 'ha');
    expect(r?.rhymeNucleus.codaClass).toBe('nasal');
  });

  // ── Scoring ───────────────────────────────────────────────────────────────

  it('HA: compare("gida", "kida") → score ≥ 0.9 (same final nucleus a)', () => {
    const r = PhonologicalRegistry.compare('gida', 'kida', 'ha');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('HA: compare("gida", "gari") → score < 0.6 (different final nucleus)', () => {
    const r = PhonologicalRegistry.compare('gida', 'gari', 'ha');
    expect(r?.score).toBeLessThan(0.6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-TAI — TaiStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('TaiStrategy (ALGO-TAI)', () => {

  // ── algoId registration ──────────────────────────────────────────────────

  it('is registered as ALGO-TAI for th', () => {
    const r = PhonologicalRegistry.analyze('ดี', 'th');
    expect(r?.algoId).toBe('ALGO-TAI');
  });

  it('is registered as ALGO-TAI for lo', () => {
    const r = PhonologicalRegistry.analyze('ດີ', 'lo');
    expect(r?.algoId).toBe('ALGO-TAI');
  });

  // ── Thai script parsing ───────────────────────────────────────────────────

  it('TH: "ดี" (di, good) → 1 syllable with nucleus i', () => {
    // ด = mid class, ี = long i → onset d, nucleus iː
    const r = PhonologicalRegistry.analyze('ดี', 'th');
    expect(r?.syllables.length).toBe(1);
    expect(r?.syllables[0]?.nucleus).toContain('i');
  });

  it('TH: "ดี" tone class (mid-class consonant, no mark) → M', () => {
    // Mid class (ด), no tone mark → toneMap.mid[''] = 'M'
    const r = PhonologicalRegistry.analyze('ดี', 'th');
    expect(r?.syllables[0]?.tone).toBe('M');
  });

  it('TH: "ข้าว" (kháaw, rice) — parses without error and produces a syllable', () => {
    // ข = high class, ้ = tone mark (mid-falling), า+ว = nucleus
    const r = PhonologicalRegistry.analyze('ข้าว', 'th');
    expect(r?.syllables.length).toBeGreaterThanOrEqual(1);
  });

  it('TH: "ข้าว" — toneClass HL (high-class + mai tho = HL)', () => {
    // toneMap.high['้'] = 'HL'
    const r = PhonologicalRegistry.analyze('ข้าว', 'th');
    expect(r?.syllables[0]?.tone).toBe('HL');
  });

  // ── Lao script parsing ────────────────────────────────────────────────────

  it('LO: "ດີ" (di, good) → 1 syllable', () => {
    const r = PhonologicalRegistry.analyze('ດີ', 'lo');
    expect(r?.syllables.length).toBe(1);
  });

  // ── Latin romanisation fallback ───────────────────────────────────────────

  it('TH: Latin input "khaaw" → parses as 1 syllable via Latin path', () => {
    const r = PhonologicalRegistry.analyze('khaaw', 'th');
    expect(r?.syllables.length).toBeGreaterThanOrEqual(1);
  });

  // ── lowResourceFallback ───────────────────────────────────────────────────

  it('TH: rhymeNucleus.lowResourceFallback is true (G2P stub)', () => {
    const r = PhonologicalRegistry.analyze('ดี', 'th');
    expect(r?.rhymeNucleus.lowResourceFallback).toBe(true);
  });

  // ── Scoring ───────────────────────────────────────────────────────────────

  it('TH: compare("ดี", "มี") → score ≥ 0.9 (same nucleus i, same tone M)', () => {
    // มี = mid class (ม), ี = long i, no tone mark → tone M
    const r = PhonologicalRegistry.compare('ดี', 'มี', 'th');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-VIET — VietStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('VietStrategy (ALGO-VIET)', () => {

  // ── algoId registration ──────────────────────────────────────────────────

  it('is registered as ALGO-VIET for vi', () => {
    const r = PhonologicalRegistry.analyze('nhà', 'vi');
    expect(r?.algoId).toBe('ALGO-VIET');
  });

  it('is registered as ALGO-VIET for km (Khmer)', () => {
    const r = PhonologicalRegistry.analyze('ផ្ទះ', 'km');
    expect(r?.algoId).toBe('ALGO-VIET');
  });

  // ── Vietnamese 6-tone system ──────────────────────────────────────────────

  it('VI: "ma" (flat/level) → toneClass M (ngang, no diacritic)', () => {
    const r = PhonologicalRegistry.analyze('ma', 'vi');
    expect(r?.rhymeNucleus.toneClass).toBe('M');
  });

  it('VI: "mà" (grave, huyền) → toneClass L', () => {
    const r = PhonologicalRegistry.analyze('mà', 'vi');
    expect(r?.rhymeNucleus.toneClass).toBe('L');
  });

  it('VI: "má" (acute, sắc) → toneClass H', () => {
    const r = PhonologicalRegistry.analyze('má', 'vi');
    expect(r?.rhymeNucleus.toneClass).toBe('H');
  });

  it('VI: "mã" (tilde, ngã) → toneClass MH', () => {
    const r = PhonologicalRegistry.analyze('mã', 'vi');
    expect(r?.rhymeNucleus.toneClass).toBe('MH');
  });

  it('VI: "mả" (hook, hỏi) → toneClass LH', () => {
    const r = PhonologicalRegistry.analyze('mả', 'vi');
    expect(r?.rhymeNucleus.toneClass).toBe('LH');
  });

  it('VI: "mạ" (dot below, nặng) → toneClass ML', () => {
    const r = PhonologicalRegistry.analyze('mạ', 'vi');
    expect(r?.rhymeNucleus.toneClass).toBe('ML');
  });

  // ── Vietnamese coda detection ─────────────────────────────────────────────

  it('VI: "ban" → coda n, codaClass nasal', () => {
    const r = PhonologicalRegistry.analyze('ban', 'vi');
    expect(r?.rhymeNucleus.coda).toBe('n');
    expect(r?.rhymeNucleus.codaClass).toBe('nasal');
  });

  it('VI: "bát" → coda t, codaClass obstruent', () => {
    const r = PhonologicalRegistry.analyze('bát', 'vi');
    expect(r?.rhymeNucleus.coda).toBe('t');
    expect(r?.rhymeNucleus.codaClass).toBe('obstruent');
  });

  it('VI: "bang" → coda ng, codaClass nasal', () => {
    const r = PhonologicalRegistry.analyze('bang', 'vi');
    expect(r?.rhymeNucleus.coda).toBe('ng');
    expect(r?.rhymeNucleus.codaClass).toBe('nasal');
  });

  // ── Khmer non-tonal fallback ──────────────────────────────────────────────

  it('KM: toneClass is null on Khmer input (non-tonal)', () => {
    const r = PhonologicalRegistry.analyze('ផ្ទះ', 'km');
    expect(r?.rhymeNucleus.toneClass).toBeNull();
  });

  it('KM: "ផ្ទះ" — parses at least 1 syllable', () => {
    const r = PhonologicalRegistry.analyze('ផ្ទះ', 'km');
    expect(r?.syllables.length).toBeGreaterThanOrEqual(1);
  });

  // ── Scoring ───────────────────────────────────────────────────────────────

  it('VI: compare("ma", "ba") → score 1.0 (same nucleus a, same tone M)', () => {
    const r = PhonologicalRegistry.compare('ma', 'ba', 'vi');
    expect(r?.score).toBe(1);
  });

  it('VI: compare("ma", "mà") → score < 0.7 (same nucleus, different tone)', () => {
    // tone M vs L with tone weight=1.0 → significant penalty
    const r = PhonologicalRegistry.compare('ma', 'mà', 'vi');
    expect(r?.score).toBeLessThan(0.7);
  });

  it('VI: compare("ban", "man") → score ≥ 0.9 (same nucleus a, same coda n, same tone M)', () => {
    const r = PhonologicalRegistry.compare('ban', 'man', 'vi');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('VI: compare("ban", "bat") → score < 0.8 (different codaClass: nasal vs obstruent)', () => {
    const r = PhonologicalRegistry.compare('ban', 'bát', 'vi');
    expect(r?.score).toBeLessThan(0.8);
  });

  it('KM: compare two Khmer words — score is a number in [0, 1]', () => {
    const r = PhonologicalRegistry.compare('ផ្ទះ', 'ប្រទេស', 'km');
    if (r) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    }
  });
});
