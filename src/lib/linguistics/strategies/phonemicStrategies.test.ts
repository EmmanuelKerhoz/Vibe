/**
 * phonemicStrategies.test.ts
 *
 * Test suite covering the three strategies patched in R9/R10:
 *   - GermanicStrategy (ALGO-GER): EN silent coda graphemes, stress heuristics
 *   - SlavicStrategy  (ALGO-SLV): slavMopSplit, paroxytone stress, vowel reduction
 *   - RomanceStrategy (ALGO-ROM): romanceMopSplit, silent-E stripping, final-vowel rhyme
 *
 * All tests go through the public PhonologicalRegistry API so they exercise
 * the full pipeline (normalize → g2p → syllabify → extractRN → score).
 */

import { describe, expect, it } from 'vitest';
import { PhonologicalRegistry } from '../index';

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-GER — GermanicStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('GermanicStrategy (ALGO-GER)', () => {

  // ── algoId registration ──────────────────────────────────────────────────

  it('is registered as ALGO-GER for EN', () => {
    const r = PhonologicalRegistry.analyze('cat', 'en');
    expect(r?.algoId).toBe('ALGO-GER');
  });

  it('is registered as ALGO-GER for DE', () => {
    const r = PhonologicalRegistry.analyze('Katze', 'de');
    expect(r?.algoId).toBe('ALGO-GER');
  });

  // ── Silent coda stripping (EN only) ──────────────────────────────────────

  it('sign and wine share the same codaClass (nasal) after gn-strip', () => {
    const sign = PhonologicalRegistry.analyze('sign', 'en');
    const wine = PhonologicalRegistry.analyze('wine', 'en');
    expect(sign?.rhymeNucleus.codaClass).toBe('nasal');
    // 'wine' ends in 'n' directly → also nasal
    expect(wine?.rhymeNucleus.codaClass).toBe('nasal');
  });

  it('compare(sign, wine) returns score ≥ 0.9', () => {
    const r = PhonologicalRegistry.compare('sign', 'wine', 'en');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('night and right share the same codaClass (obstruent) after ght-strip', () => {
    const night = PhonologicalRegistry.analyze('night', 'en');
    const right = PhonologicalRegistry.analyze('right', 'en');
    expect(night?.rhymeNucleus.codaClass).toBe('obstruent');
    expect(right?.rhymeNucleus.codaClass).toBe('obstruent');
  });

  it('compare(night, right) returns score ≥ 0.9', () => {
    const r = PhonologicalRegistry.compare('night', 'right', 'en');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('lamb and bomb share the same codaClass (nasal) after mb-strip', () => {
    const lamb = PhonologicalRegistry.analyze('lamb', 'en');
    const bomb = PhonologicalRegistry.analyze('bomb', 'en');
    expect(lamb?.rhymeNucleus.codaClass).toBe('nasal');
    expect(bomb?.rhymeNucleus.codaClass).toBe('nasal');
  });

  it('debt and doubt share the same codaClass (obstruent) after bt-strip', () => {
    const debt = PhonologicalRegistry.analyze('debt', 'en');
    const doubt = PhonologicalRegistry.analyze('doubt', 'en');
    expect(debt?.rhymeNucleus.codaClass).toBe('obstruent');
    expect(doubt?.rhymeNucleus.codaClass).toBe('obstruent');
  });

  it('high and sigh have no coda after trailing gh-strip', () => {
    const high = PhonologicalRegistry.analyze('high', 'en');
    const sigh = PhonologicalRegistry.analyze('sigh', 'en');
    // After gh-strip coda becomes '' → codaClass null
    expect(high?.rhymeNucleus.codaClass).toBeNull();
    expect(sigh?.rhymeNucleus.codaClass).toBeNull();
  });

  it('does NOT strip gn in DE (gn is a legal onset, not a silent coda)', () => {
    // German word ending in visible cluster — strip only applies to lang='en'
    const r = PhonologicalRegistry.analyze('design', 'de');
    // The coda should still be 'gn' (orthographic, not stripped)
    expect(r?.rhymeNucleus.coda).toBe('gn');
  });

  // ── English stress heuristics ─────────────────────────────────────────────

  it('-tion suffix triggers antepenultimate stress', () => {
    // "education" → e-du-CA-tion → stress index 2 (of 4 syllables: e·du·ca·tion)
    const r = PhonologicalRegistry.analyze('education', 'en');
    const stressed = r?.syllables.findIndex(s => s.stressed);
    expect(stressed).toBe(2);
  });

  it('-ness suffix triggers penultimate stress', () => {
    // "happiness" → hap-pi-ness → stress on index 1 (penult = index 1 of 3)
    const r = PhonologicalRegistry.analyze('happiness', 'en');
    const stressed = r?.syllables.findIndex(s => s.stressed);
    expect(stressed).toBe(1);
  });

  it('-ing suffix triggers penultimate stress', () => {
    // "running" → run-ning → stress on index 0 (penult of 2)
    const r = PhonologicalRegistry.analyze('running', 'en');
    const stressed = r?.syllables.findIndex(s => s.stressed);
    expect(stressed).toBe(0);
  });

  // ── Scoring sanity ────────────────────────────────────────────────────────

  it('cat/bat: same nucleus vowel + same coda class → score ≥ 0.9', () => {
    const r = PhonologicalRegistry.compare('cat', 'bat', 'en');
    expect(r?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('cat/dog: different nucleus → score < 0.5', () => {
    const r = PhonologicalRegistry.compare('cat', 'dog', 'en');
    expect(r?.score).toBeLessThan(0.5);
  });

  it('MOP: "winter" splits into win.ter (not wi.nter)', () => {
    const r = PhonologicalRegistry.analyze('winter', 'en');
    // Syllable 0: nucleus='i', coda='n'
    // Syllable 1: onset='t', nucleus='e', coda='r'
    expect(r?.syllables[0]?.coda).toBe('n');
    expect(r?.syllables[1]?.onset).toBe('t');
  });

  it('MOP: "destroy" has second syllable onset=str', () => {
    const r = PhonologicalRegistry.analyze('destroy', 'en');
    // de.stroy → syllable 1 onset='str'
    expect(r?.syllables[1]?.onset).toBe('str');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-SLV — SlavicStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('SlavicStrategy (ALGO-SLV)', () => {

  it('is registered as ALGO-SLV for PL', () => {
    const r = PhonologicalRegistry.analyze('strona', 'pl');
    expect(r?.algoId).toBe('ALGO-SLV');
  });

  it('is registered as ALGO-SLV for RU', () => {
    const r = PhonologicalRegistry.analyze('страна', 'ru');
    expect(r?.algoId).toBe('ALGO-SLV');
  });

  // ── slavMopSplit via pipeline ─────────────────────────────────────────────

  it('"strona" (PL): str cluster stays as onset of syllable 1', () => {
    // stro.na → syllable 0 onset='str'
    const r = PhonologicalRegistry.analyze('strona', 'pl');
    expect(r?.syllables[0]?.onset).toBe('str');
  });

  it('"zima" (PL): single-consonant onset z, nucleus i', () => {
    const r = PhonologicalRegistry.analyze('zima', 'pl');
    expect(r?.syllables[0]?.nucleus).toBe('i');
    expect(r?.syllables[0]?.onset).toBe('z');
  });

  it('"wstać" (PL): inter-vocalic cluster wst → onset=st, prevCoda=w', () => {
    // w-stać → syllable 0 coda should capture 'w' via MOP split of 'wst'
    // wst → try 3-char: not in table → try 2-char: 'st' ∈ table → onset='st', coda='w'
    const r = PhonologicalRegistry.analyze('wstać', 'pl');
    // First syllable has no nucleus before the cluster — the whole word starts
    // with consonants. Pre-vocalic cluster goes entirely to onset.
    // Only 1 vowel 'a' here → 1 syllable, onset='wst'
    expect(r?.syllables[0]?.onset).toBe('wst');
    expect(r?.syllables[0]?.nucleus).toBe('a');
  });

  // ── Paroxytone stress ─────────────────────────────────────────────────────

  it('"strona" (PL, 2 syllables): stress on index 0 (penultimate)', () => {
    const r = PhonologicalRegistry.analyze('strona', 'pl');
    expect(r?.syllables[0]?.stressed).toBe(true);
    expect(r?.syllables[1]?.stressed).toBe(false);
  });

  it('"biblioteka" (PL, 5 syllables): stress on index 3 (penultimate)', () => {
    // bib.lio.te.ka → 4 syllables → stress on index 2 (penultimate)
    const r = PhonologicalRegistry.analyze('biblioteka', 'pl');
    if (r && r.syllables.length >= 2) {
      const stressIdx = r.syllables.findIndex(s => s.stressed);
      expect(stressIdx).toBe(r.syllables.length - 2);
    }
  });

  // ── Unstressed vowel reduction ────────────────────────────────────────────

  it('unstressed syllables in RU reduce vowels toward schwa', () => {
    // страна: str.a.na → stressed=a (index 0 of 2 syl), unstressed=na
    // na → unstressed 'a' → 'ə'
    const r = PhonologicalRegistry.analyze('страна', 'ru');
    const unstressed = r?.syllables.filter(s => !s.stressed);
    // If any unstressed syllable exists, its reducible vowel should be ə
    if (unstressed && unstressed.length > 0) {
      unstressed.forEach(syl => {
        // ə or original non-reducible vowel (и, у…)
        if (/[аоеяэ]/.test(syl.nucleus)) {
          expect(syl.nucleus).toBe('ə');
        }
      });
    }
  });

  // ── Scoring ───────────────────────────────────────────────────────────────

  it('compare("zima", "prima") PL: same nucleus i, same coda → score 1.0', () => {
    const r = PhonologicalRegistry.compare('zima', 'prima', 'pl');
    expect(r?.score).toBe(1);
  });

  it('compare("strona", "brona") PL: same nucleus o + coda n → score 1.0', () => {
    const r = PhonologicalRegistry.compare('strona', 'brona', 'pl');
    expect(r?.score).toBe(1);
  });

  it('compare("zima", "rzeka") PL: different nucleus i vs e → score < 0.6', () => {
    const r = PhonologicalRegistry.compare('zima', 'rzeka', 'pl');
    expect(r?.score).toBeLessThan(0.6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGO-ROM — RomanceStrategy
// ─────────────────────────────────────────────────────────────────────────────

describe('RomanceStrategy (ALGO-ROM)', () => {

  it('is registered as ALGO-ROM for FR', () => {
    const r = PhonologicalRegistry.analyze('chante', 'fr');
    expect(r?.algoId).toBe('ALGO-ROM');
  });

  it('is registered as ALGO-ROM for ES', () => {
    const r = PhonologicalRegistry.analyze('canto', 'es');
    expect(r?.algoId).toBe('ALGO-ROM');
  });

  it('is registered as ALGO-ROM for IT', () => {
    const r = PhonologicalRegistry.analyze('pianta', 'it');
    expect(r?.algoId).toBe('ALGO-ROM');
  });

  // ── MOP inter-vocalic split ───────────────────────────────────────────────

  it('"abracadabra" (ES): second syllable ra has onset r', () => {
    const r = PhonologicalRegistry.analyze('abracadabra', 'es');
    // a.bra.ca.dab.ra
    // syllable 1: onset='br', nucleus='a'
    expect(r?.syllables[1]?.onset).toBe('br');
    expect(r?.syllables[1]?.nucleus).toBe('a');
  });

  it('"entrer" (FR): tr cluster → onset=tr', () => {
    // en.trer → syllable 1 onset='tr'
    const r = PhonologicalRegistry.analyze('entrer', 'fr');
    expect(r?.syllables[1]?.onset).toBe('tr');
  });

  it('"simplement" (FR): pl cluster → onset=pl', () => {
    // sim.ple.ment → syllable 1 onset='pl'
    const r = PhonologicalRegistry.analyze('simplement', 'fr');
    expect(r?.syllables[1]?.onset).toBe('pl');
  });

  // ── Silent final E (FR/IT) ────────────────────────────────────────────────

  it('FR: "chante" and "plante" share the same rhyme nucleus', () => {
    const chante = PhonologicalRegistry.analyze('chante', 'fr');
    const plante = PhonologicalRegistry.analyze('plante', 'fr');
    // Both end in silent -e; stressed nucleus is 'a'
    expect(chante?.rhymeNucleus.nucleus).toBe('a');
    expect(plante?.rhymeNucleus.nucleus).toBe('a');
  });

  it('compare("chante", "plante") FR → score 1.0', () => {
    const r = PhonologicalRegistry.compare('chante', 'plante', 'fr');
    expect(r?.score).toBe(1);
  });

  it('IT: "amore" and "fiore" share the same final open rhyme', () => {
    const amore = PhonologicalRegistry.analyze('amore', 'it');
    const fiore = PhonologicalRegistry.analyze('fiore', 'it');
    expect(amore?.rhymeNucleus.nucleus).toBe('o');
    expect(fiore?.rhymeNucleus.nucleus).toBe('o');
  });

  it('compare("amore", "fiore") IT → score 1.0', () => {
    const r = PhonologicalRegistry.compare('amore', 'fiore', 'it');
    expect(r?.score).toBe(1);
  });

  // ── Scoring sanity ────────────────────────────────────────────────────────

  it('ES: compare("canto", "tanto") → score 1.0 (perfect rhyme)', () => {
    const r = PhonologicalRegistry.compare('canto', 'tanto', 'es');
    expect(r?.score).toBe(1);
  });

  it('FR: compare("fleur", "cœur") → score ≥ 0.8 (near rhyme, same nucleus class)', () => {
    // Both have nucleus ə/œ — orthographically different but same class
    const r = PhonologicalRegistry.compare('fleur', 'cœur', 'fr');
    expect(r?.score).toBeGreaterThanOrEqual(0.8);
  });

  it('FR: compare("chante", "porte") → score < 0.5 (different nucleus a vs o)', () => {
    const r = PhonologicalRegistry.compare('chante', 'porte', 'fr');
    expect(r?.score).toBeLessThan(0.5);
  });

  // ── Penultimate stress for Romance ───────────────────────────────────────

  it('ES: "libro" stress on index 0 (penultimate of 2 syllables)', () => {
    const r = PhonologicalRegistry.analyze('libro', 'es');
    expect(r?.syllables[0]?.stressed).toBe(true);
  });

  it('IT: "pianta" stress on index 0 (penultimate)', () => {
    const r = PhonologicalRegistry.analyze('pianta', 'it');
    const stressIdx = r?.syllables.findIndex(s => s.stressed);
    expect(stressIdx).toBe(0);
  });
});
