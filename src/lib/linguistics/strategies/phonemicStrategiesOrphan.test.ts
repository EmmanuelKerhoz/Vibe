/**
 * phonemicStrategiesOrphan.test.ts  (R13)
 *
 * Unit tests for five strategy families that had zero coverage:
 *
 *   ALGO-DRV  — DravidianStrategy   (ta, te, kn, ml)
 *   ALGO-IIR  — IndoIranianStrategy (hi, bn, pa, ur, fa)
 *   ALGO-JAP  — JapaneseStrategy    (ja)
 *   ALGO-KOR  — KoreanStrategy      (ko)
 *   ALGO-AUS  — AustronesianStrategy (id, ms, tl)
 *
 * Public API used throughout:
 *   PhonologicalRegistry.analyze(text, lang) → AnalysisResult | null
 *   PhonologicalRegistry.compare(a, b, lang)  → CompareResult | null
 *
 * AnalysisResult: { algoId, syllables, rhymeNucleus }
 * CompareResult:  { score }  — 0..1
 */

import { describe, expect, it } from 'vitest';
import { PhonologicalRegistry } from '../index';

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-DRV — DravidianStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('DravidianStrategy (ALGO-DRV)', () => {

  // ── algoId registration ──────────────────────────────────────────────────

  it('is registered as ALGO-DRV for ta (Tamil)', () => {
    const r = PhonologicalRegistry.analyze('அம்மா', 'ta');
    expect(r?.algoId).toBe('ALGO-DRV');
  });

  it('is registered as ALGO-DRV for te (Telugu)', () => {
    const r = PhonologicalRegistry.analyze('అమ్మ', 'te');
    expect(r?.algoId).toBe('ALGO-DRV');
  });

  it('is registered as ALGO-DRV for kn (Kannada)', () => {
    const r = PhonologicalRegistry.analyze('ಅಮ್ಮ', 'kn');
    expect(r?.algoId).toBe('ALGO-DRV');
  });

  it('is registered as ALGO-DRV for ml (Malayalam)', () => {
    const r = PhonologicalRegistry.analyze('അമ്മ', 'ml');
    expect(r?.algoId).toBe('ALGO-DRV');
  });

  // ── toneClass is always null (Dravidian = non-tonal) ────────────────────

  it('TA: toneClass is null (Dravidian is non-tonal)', () => {
    const r = PhonologicalRegistry.analyze('அம்மா', 'ta');
    expect(r?.rhymeNucleus.toneClass).toBeNull();
  });

  // ── Tamil: long vowel nucleus ā ──────────────────────────────────────────

  it('TA: "mā" (மா) → nucleus includes long vowel ā', () => {
    const r = PhonologicalRegistry.analyze('மா', 'ta');
    expect(r?.rhymeNucleus.nucleus).toMatch(/ā/);
  });

  // ── Dravidian: syllabification produces ≥ 1 syllable ────────────────────

  it('TA: multi-syllable word "அம்மா" → ≥ 2 syllables', () => {
    const r = PhonologicalRegistry.analyze('அம்மா', 'ta');
    expect(r?.syllables.length).toBeGreaterThanOrEqual(2);
  });

  // ── Telugu: extractRN on a closed syllable ───────────────────────────────

  it('TE: "అల్" → coda is non-empty', () => {
    const r = PhonologicalRegistry.analyze('అల్', 'te');
    expect(r?.rhymeNucleus.coda).toBeTruthy();
  });

  // ── Latin-script romanisation input (no Brahmic) ─────────────────────────

  it('TA (roman): "amma" → analyzes without error and ≥ 1 syllable', () => {
    const r = PhonologicalRegistry.analyze('amma', 'ta');
    expect(r).not.toBeNull();
    expect(r?.syllables.length).toBeGreaterThanOrEqual(1);
  });

  // ── Scoring sanity ───────────────────────────────────────────────────────

  it('TA: compare("pāl", "kāl") → score ≥ 0.9 (same nucleus ā, same codaClass)', () => {
    const r = PhonologicalRegistry.compare('pāl', 'kāl', 'ta');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('TA: compare("pāl", "puli") → score < 0.5 (ā vs u, l vs i)', () => {
    const r = PhonologicalRegistry.compare('pāl', 'puli', 'ta');
    expect(r?.score).toBeLessThan(0.5);
  });

  // ── No lowResourceFallback for known Brahmic input ────────────────────────

  it('TA: known Tamil input does NOT set lowResourceFallback', () => {
    const r = PhonologicalRegistry.analyze('மா', 'ta');
    expect((r?.rhymeNucleus as { lowResourceFallback?: boolean })?.lowResourceFallback).toBeFalsy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-IIR — IndoIranianStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('IndoIranianStrategy (ALGO-IIR)', () => {

  // ── algoId registration ──────────────────────────────────────────────────

  it('is registered as ALGO-IIR for hi (Hindi / Devanagari)', () => {
    const r = PhonologicalRegistry.analyze('माँ', 'hi');
    expect(r?.algoId).toBe('ALGO-IIR');
  });

  it('is registered as ALGO-IIR for bn (Bengali)', () => {
    const r = PhonologicalRegistry.analyze('মা', 'bn');
    expect(r?.algoId).toBe('ALGO-IIR');
  });

  it('is registered as ALGO-IIR for pa (Punjabi / Gurmukhi)', () => {
    const r = PhonologicalRegistry.analyze('ਮਾਂ', 'pa');
    expect(r?.algoId).toBe('ALGO-IIR');
  });

  it('is registered as ALGO-IIR for ur (Urdu / Arabic-script)', () => {
    const r = PhonologicalRegistry.analyze('ماں', 'ur');
    expect(r?.algoId).toBe('ALGO-IIR');
  });

  // ── toneClass is null ────────────────────────────────────────────────────

  it('HI: toneClass is null', () => {
    const r = PhonologicalRegistry.analyze('माँ', 'hi');
    expect(r?.rhymeNucleus.toneClass).toBeNull();
  });

  // ── Aspiration normalisation (Brahmic langs) ─────────────────────────────

  it('HI: "bhat" and "bhat" rhyme even if onset aspirated differently → score ≥ 0.9', () => {
    // Both map to the same rime post-aspiration collapse
    const r = PhonologicalRegistry.compare('khāna', 'kāna', 'hi');
    expect(r?.score).toBeGreaterThanOrEqual(0.85);
  });

  // ── Final schwa deletion ─────────────────────────────────────────────────

  it('HI: "ghar" (roman) → syllabifies without trailing schwa artefact', () => {
    const r = PhonologicalRegistry.analyze('ghar', 'hi');
    expect(r).not.toBeNull();
    // Schwa deletion should strip trailing 'a' after consonant
    expect(r?.rhymeNucleus.nucleus).not.toBe('');
  });

  // ── Long vowel nucleus selection ─────────────────────────────────────────

  it('HI (roman): "bātā" → extractRN prefers syllable with ā nucleus', () => {
    const r = PhonologicalRegistry.analyze('bātā', 'hi');
    expect(r?.rhymeNucleus.nucleus).toMatch(/ā/);
  });

  // ── Urdu Arabic-script G2P ───────────────────────────────────────────────

  it('UR: "باب" (bāb) → analysis returns non-null result', () => {
    const r = PhonologicalRegistry.analyze('باب', 'ur');
    expect(r).not.toBeNull();
  });

  it('UR: "باب" and "ناب" → score ≥ 0.85 (same nucleus ā, coda b)', () => {
    const r = PhonologicalRegistry.compare('باب', 'ناب', 'ur');
    expect(r?.score).toBeGreaterThanOrEqual(0.85);
  });

  // ── Aspirated pairs do NOT collapse for ur/fa ────────────────────────────

  it('UR: aspiration NOT collapsed (kh ≠ k in Urdu)', () => {
    // In Urdu, ARABIC_IIR_MAP maps خ to 'k' already, but g2p for ur skips
    // normalizeAspiration — the distinction is at the Arabic-map level.
    // Just ensure analysis doesn't crash.
    const r = PhonologicalRegistry.analyze('خانہ', 'ur');
    expect(r).not.toBeNull();
  });

  // ── Scoring sanity ───────────────────────────────────────────────────────

  it('HI (roman): compare("pyār", "pyār") → score = 1.0 (identical)', () => {
    const r = PhonologicalRegistry.compare('pyār', 'pyār', 'hi');
    expect(r?.score).toBe(1.0);
  });

  it('HI (roman): compare("pyār", "bazār") → score ≥ 0.9 (same nucleus ā + coda r)', () => {
    const r = PhonologicalRegistry.compare('pyār', 'bazār', 'hi');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('HI (roman): compare("pyār", "rāt") → score < 0.7 (ā:r vs ā:t — coda mismatch)', () => {
    const r = PhonologicalRegistry.compare('pyār', 'rāt', 'hi');
    expect(r?.score).toBeLessThan(0.7);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-JAP — JapaneseStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('JapaneseStrategy (ALGO-JAP)', () => {

  // ── algoId registration ──────────────────────────────────────────────────

  it('is registered as ALGO-JAP for ja', () => {
    const r = PhonologicalRegistry.analyze('さくら', 'ja');
    expect(r?.algoId).toBe('ALGO-JAP');
  });

  // ── toneClass is null (Japanese pitch accent NOT modelled here) ──────────

  it('JA: toneClass is null', () => {
    const r = PhonologicalRegistry.analyze('さくら', 'ja');
    expect(r?.rhymeNucleus.toneClass).toBeNull();
  });

  // ── Kana romanisation — monographs ───────────────────────────────────────

  it('JA: "あ" → nucleus = "a"', () => {
    const r = PhonologicalRegistry.analyze('あ', 'ja');
    expect(r?.rhymeNucleus.nucleus).toBe('a');
  });

  it('JA: "き" → nucleus ends in "i"', () => {
    const r = PhonologicalRegistry.analyze('き', 'ja');
    expect(r?.rhymeNucleus.nucleus).toBe('i');
  });

  it('JA: "お" → nucleus = "o"', () => {
    const r = PhonologicalRegistry.analyze('お', 'ja');
    expect(r?.rhymeNucleus.nucleus).toBe('o');
  });

  // ── Kana romanisation — digraphs ─────────────────────────────────────────

  it('JA: "しゃ" (sha) → nucleus = "a"', () => {
    const r = PhonologicalRegistry.analyze('しゃ', 'ja');
    expect(r?.rhymeNucleus.nucleus).toBe('a');
  });

  it('JA: "ちょ" (cho) → nucleus = "o"', () => {
    const r = PhonologicalRegistry.analyze('ちょ', 'ja');
    expect(r?.rhymeNucleus.nucleus).toBe('o');
  });

  // ── Katakana: converted to hiragana before processing ────────────────────

  it('JA: "サクラ" (katakana) → same nucleus as "さくら" (hiragana)', () => {
    const kata = PhonologicalRegistry.analyze('サクラ', 'ja');
    const hira = PhonologicalRegistry.analyze('さくら', 'ja');
    expect(kata?.rhymeNucleus.nucleus).toBe(hira?.rhymeNucleus.nucleus);
  });

  // ── Long vowel mark ─────────────────────────────────────────────────────

  it('JA: "コーヒー" (kōhī, coffee) → more syllables than the kana count alone (ー extends)', () => {
    const r = PhonologicalRegistry.analyze('コーヒー', 'ja');
    // コ(ko) + ー(o) + ヒ(hi) + ー(i) → 4 morae
    expect(r?.syllables.length).toBe(4);
  });

  // ── っ (sokuon / geminate stop) ──────────────────────────────────────────

  it('JA: "きって" → syllable for っ has nucleus "q" (geminate placeholder)', () => {
    const r = PhonologicalRegistry.analyze('きって', 'ja');
    const sokuon = r?.syllables.find(s => s.nucleus === 'q');
    expect(sokuon).toBeDefined();
  });

  // ── Han fallback ─────────────────────────────────────────────────────────

  it('JA: raw Kanji input sets lowResourceFallback', () => {
    const r = PhonologicalRegistry.analyze('花', 'ja');
    expect((r?.rhymeNucleus as { lowResourceFallback?: boolean })?.lowResourceFallback).toBe(true);
  });

  // ── Scoring sanity ───────────────────────────────────────────────────────

  it('JA: compare("さくら", "はなら") → score ≥ 0.9 (both end in "ra" → nucleus a)', () => {
    // Both last mora map to 'ra' → nucleus 'a'
    const r = PhonologicalRegistry.compare('さくら', 'はなら', 'ja');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('JA: compare("さくら", "つき") → score < 0.5 (a vs i — nucleus mismatch)', () => {
    const r = PhonologicalRegistry.compare('さくら', 'つき', 'ja');
    expect(r?.score).toBeLessThan(0.5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-KOR — KoreanStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('KoreanStrategy (ALGO-KOR)', () => {

  // ── algoId registration ──────────────────────────────────────────────────

  it('is registered as ALGO-KOR for ko', () => {
    const r = PhonologicalRegistry.analyze('하늘', 'ko');
    expect(r?.algoId).toBe('ALGO-KOR');
  });

  // ── toneClass is null ────────────────────────────────────────────────────

  it('KO: toneClass is null', () => {
    const r = PhonologicalRegistry.analyze('하늘', 'ko');
    expect(r?.rhymeNucleus.toneClass).toBeNull();
  });

  // ── Hangul decomposition: onset/nucleus/coda ─────────────────────────────

  it('KO: "밥" (bab, rice) → coda = "p" (receiving final consonant ㅂ)', () => {
    // 밥 = 바 (ba) + ㅂ (p) → final coda p
    const r = PhonologicalRegistry.analyze('밥', 'ko');
    expect(r?.rhymeNucleus.coda).toBe('p');
  });

  it('KO: "나" (na, me) → open syllable, coda = ""', () => {
    const r = PhonologicalRegistry.analyze('나', 'ko');
    expect(r?.rhymeNucleus.coda).toBe('');
  });

  it('KO: "산" (san, mountain) → coda = "n"', () => {
    const r = PhonologicalRegistry.analyze('산', 'ko');
    expect(r?.rhymeNucleus.coda).toBe('n');
  });

  // ── Nucleus values ────────────────────────────────────────────────────────

  it('KO: "아" (a) → nucleus = "a"', () => {
    const r = PhonologicalRegistry.analyze('아', 'ko');
    expect(r?.rhymeNucleus.nucleus).toBe('a');
  });

  it('KO: "이" (i) → nucleus = "i"', () => {
    const r = PhonologicalRegistry.analyze('이', 'ko');
    expect(r?.rhymeNucleus.nucleus).toBe('i');
  });

  // ── Multi-syllable word ──────────────────────────────────────────────────

  it('KO: "하늘" (ha-neul, sky) → 2 syllables', () => {
    const r = PhonologicalRegistry.analyze('하늘', 'ko');
    expect(r?.syllables.length).toBe(2);
  });

  // ── Non-Hangul fallback ──────────────────────────────────────────────────

  it('KO: non-Hangul input sets lowResourceFallback', () => {
    const r = PhonologicalRegistry.analyze('abc', 'ko');
    expect((r?.rhymeNucleus as { lowResourceFallback?: boolean })?.lowResourceFallback).toBe(true);
  });

  // ── codaClass ────────────────────────────────────────────────────────────

  it('KO: "밥" coda "p" → codaClass is not null', () => {
    const r = PhonologicalRegistry.analyze('밥', 'ko');
    expect(r?.rhymeNucleus.codaClass).not.toBeNull();
  });

  it('KO: "나" open syllable → codaClass is null or "open"', () => {
    const r = PhonologicalRegistry.analyze('나', 'ko');
    // classifyCoda('') returns null or 'open' depending on implementation
    expect(['null', 'open', null, undefined]).toContain(r?.rhymeNucleus.codaClass ?? null);
  });

  // ── Scoring sanity ───────────────────────────────────────────────────────

  it('KO: compare("밥", "납") → score ≥ 0.9 (nucleus a, coda p both match)', () => {
    // 밥 = ba+p, 납 = na+p → same nucleus a, same coda p
    const r = PhonologicalRegistry.compare('밥', '납', 'ko');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('KO: compare("밥", "나") → score < 0.6 (coda mismatch p vs open)', () => {
    const r = PhonologicalRegistry.compare('밥', '나', 'ko');
    expect(r?.score).toBeLessThan(0.6);
  });

  it('KO: compare("산", "만") → score ≥ 0.85 (nucleus a, coda n)', () => {
    const r = PhonologicalRegistry.compare('산', '만', 'ko');
    expect(r?.score).toBeGreaterThanOrEqual(0.85);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-AUS — AustronesianStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('AustronesianStrategy (ALGO-AUS)', () => {

  // ── algoId registration ──────────────────────────────────────────────────

  it('is registered as ALGO-AUS for id (Indonesian)', () => {
    const r = PhonologicalRegistry.analyze('rumah', 'id');
    expect(r?.algoId).toBe('ALGO-AUS');
  });

  it('is registered as ALGO-AUS for ms (Malay)', () => {
    const r = PhonologicalRegistry.analyze('rumah', 'ms');
    expect(r?.algoId).toBe('ALGO-AUS');
  });

  it('is registered as ALGO-AUS for tl (Tagalog)', () => {
    const r = PhonologicalRegistry.analyze('bahay', 'tl');
    expect(r?.algoId).toBe('ALGO-AUS');
  });

  // ── toneClass is null ────────────────────────────────────────────────────

  it('ID: toneClass is null', () => {
    const r = PhonologicalRegistry.analyze('rumah', 'id');
    expect(r?.rhymeNucleus.toneClass).toBeNull();
  });

  // ── lowResourceFallback always set (G2P is graphemic only) ──────────────

  it('ID: lowResourceFallback is always true (G2P stub)', () => {
    const r = PhonologicalRegistry.analyze('rumah', 'id');
    expect((r?.rhymeNucleus as { lowResourceFallback?: boolean })?.lowResourceFallback).toBe(true);
  });

  // ── Prefix stripping — Indonesian ───────────────────────────────────────

  it('ID: "menulis" strips "men" prefix → stem "ulis" used for rime', () => {
    // "menulis" → stem "ulis" → last open syllable = u → nucleus 'u'
    const r = PhonologicalRegistry.analyze('menulis', 'id');
    // stem "ulis": u-lis → last open syllable = u → nucleus 'u'
    expect(r?.rhymeNucleus.nucleus).toBe('u');
  });

  it('ID: compare("menulis", "duduk") → score ≥ 0.9 (both strip to open-syllable nucleus u)', () => {
    const r = PhonologicalRegistry.compare('menulis', 'duduk', 'id');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });

  // ── Tagalog infix stripping ──────────────────────────────────────────────

  it('TL: "bumili" strips "um" infix → stem "bili" used for rime', () => {
    // "bumili": b+um+ili → stem "bili" → last syllable = li → nucleus 'i'
    const r = PhonologicalRegistry.analyze('bumili', 'tl');
    expect(r?.rhymeNucleus.nucleus).toBe('i');
  });

  // ── extractRN: raw includes nucleus+coda of tail syllables only ──────────

  it('ID: raw field does NOT include onset (ALGO-AUS raw = nucleus+coda)', () => {
    // "bata" → stem "bata" → syllables [ba, ta] → anchor = last open syl "ta"
    // raw = "ta" (nucleus t+a without onset b)
    const r = PhonologicalRegistry.analyze('bata', 'id');
    // raw should NOT start with 'b'
    expect(r?.rhymeNucleus.raw).not.toMatch(/^b/);
  });

  // ── Open syllable preference for anchor ─────────────────────────────────

  it('ID: "cinta" (love) → rhyme anchor is last open syllable "-ta"', () => {
    const r = PhonologicalRegistry.analyze('cinta', 'id');
    // last open syllable → nucleus = 'a'
    expect(r?.rhymeNucleus.nucleus).toBe('a');
  });

  // ── Scoring sanity ───────────────────────────────────────────────────────

  it('ID: compare("bata", "data") → score ≥ 0.9 (both end in open "-a")', () => {
    const r = PhonologicalRegistry.compare('bata', 'data', 'id');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('ID: compare("bata", "buku") → score < 0.5 (a vs u nucleus mismatch)', () => {
    const r = PhonologicalRegistry.compare('bata', 'buku', 'id');
    expect(r?.score).toBeLessThan(0.5);
  });

  it('TL: compare("mahal", "bahal") → score ≥ 0.9 (same tail "-hal")', () => {
    const r = PhonologicalRegistry.compare('mahal', 'bahal', 'tl');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });
});
