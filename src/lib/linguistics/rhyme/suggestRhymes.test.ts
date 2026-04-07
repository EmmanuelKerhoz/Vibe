/**
 * suggestRhymes.test.ts
 * Integration tests: full pipeline word → G2P → RN → PhonemeIndex → candidates.
 *
 * NOTE: initLexicons() is called explicitly in beforeAll() to ensure the
 * phonemeIndex is populated in this Vitest module instance.
 * (Vitest isolates modules by default — the side-effect in the barrel
 * index.ts populates a *different* Map instance than the one read here.)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { initLexicons, getLexiconHealth } from '../lexicons/initLexicons';
import { suggestRhymes, getLexiconSize } from './suggestRhymes';
import { PhonologicalRegistry } from '../core/Registry';
import {
  RomanceStrategy, GermanicStrategy, KwaStrategy, CrvStrategy,
  SlavicStrategy, BantuStrategy, SemiticStrategy, SiniticStrategy,
  TaiStrategy, VietStrategy, TurkicStrategy, UralicStrategy,
  DravidianStrategy, IndoIranianStrategy, JapaneseStrategy,
  KoreanStrategy, AustronesianStrategy, CreoleStrategy, FallbackStrategy,
} from '../strategies';

// ─── Bootstrap (once per test file) ──────────────────────────────────────────
// Register strategies + lexicons in this module's singleton instances.

beforeAll(() => {
  // Strategies — idempotent (Registry guards duplicate registration)
  PhonologicalRegistry.register('ALGO-ROM',    new RomanceStrategy());
  PhonologicalRegistry.register('ALGO-GER',    new GermanicStrategy());
  PhonologicalRegistry.register('ALGO-KWA',    new KwaStrategy());
  PhonologicalRegistry.register('ALGO-CRV',    new CrvStrategy());
  PhonologicalRegistry.register('ALGO-SLV',    new SlavicStrategy());
  PhonologicalRegistry.register('ALGO-BNT',    new BantuStrategy());
  PhonologicalRegistry.register('ALGO-SEM',    new SemiticStrategy());
  PhonologicalRegistry.register('ALGO-SIN',    new SiniticStrategy());
  PhonologicalRegistry.register('ALGO-TAI',    new TaiStrategy());
  PhonologicalRegistry.register('ALGO-VIET',   new VietStrategy());
  PhonologicalRegistry.register('ALGO-TRK',    new TurkicStrategy());
  PhonologicalRegistry.register('ALGO-FIN',    new UralicStrategy());
  PhonologicalRegistry.register('ALGO-DRV',    new DravidianStrategy());
  PhonologicalRegistry.register('ALGO-IIR',    new IndoIranianStrategy());
  PhonologicalRegistry.register('ALGO-JAP',    new JapaneseStrategy());
  PhonologicalRegistry.register('ALGO-KOR',    new KoreanStrategy());
  PhonologicalRegistry.register('ALGO-AUS',    new AustronesianStrategy());
  PhonologicalRegistry.register('ALGO-CRE',    new CreoleStrategy());
  PhonologicalRegistry.register('ALGO-ROBUST', new FallbackStrategy());

  // Lexicons — populates THIS module's phonemeIndex Map
  initLexicons();
});

// ─── Sanity: lexicon loaded ───────────────────────────────────────────────────

describe('initLexicons / health', () => {
  it('fr lexicon is non-empty after explicit init', () => {
    expect(getLexiconSize('fr')).toBeGreaterThan(100);
  });

  it('getLexiconHealth returns fr count > 0', () => {
    const health = getLexiconHealth();
    expect(health.fr).toBeGreaterThan(100);
  });
});

// ─── Core: perfect rhymes (/ɔ̃/) ──────────────────────────────────────────────

describe('suggestRhymes — perfect rhymes', () => {
  it('"son" → candidates share /ɔ̃/ nucleus', () => {
    const { suggestions, usedFallback, inputNucleus } = suggestRhymes('son', 'fr');
    expect(usedFallback).toBe(false);
    expect(inputNucleus).toBe('ɔ̃');
    expect(suggestions.length).toBeGreaterThan(0);
    // Every perfect rhyme should have score 1.0
    const perfect = suggestions.filter(s => s.score === 1.0);
    expect(perfect.length).toBeGreaterThan(0);
    // Known lexicon members
    const words = suggestions.map(s => s.word);
    expect(words).toEqual(expect.arrayContaining(['ton', 'bon', 'don']));
  });

  it('"amour" → returns /uʁ/ rhymes', () => {
    const { suggestions, inputNucleus } = suggestRhymes('amour', 'fr');
    expect(inputNucleus).toBe('uʁ');
    const words = suggestions.map(s => s.word);
    expect(words).toEqual(expect.arrayContaining(['jour', 'retour']));
  });

  it('excludes the input word itself', () => {
    const { suggestions } = suggestRhymes('son', 'fr', { excludeInput: true });
    expect(suggestions.map(s => s.word)).not.toContain('son');
  });
});

// ─── Core: /e/ rhymes (participes passés, infinitifs) ────────────────────────

describe('suggestRhymes — /e/ family', () => {
  it('"chanté" returns other /e/ words', () => {
    const { suggestions, inputNucleus } = suggestRhymes('chanté', 'fr');
    expect(inputNucleus).toBe('e');
    expect(suggestions.length).toBeGreaterThan(0);
    const words = suggestions.map(s => s.word);
    expect(words).toEqual(expect.arrayContaining(['aimé', 'parlé']));
  });

  it('"liberté" returns /e/ rhymes', () => {
    const { suggestions } = suggestRhymes('liberté', 'fr');
    const words = suggestions.map(s => s.word);
    expect(words).toEqual(expect.arrayContaining(['beauté', 'vérité']));
  });
});

// ─── Core: /iʁ/ rhymes (infinitifs en -ir) ───────────────────────────────────

describe('suggestRhymes — /iʁ/ family', () => {
  it('"venir" returns other -ir verbs', () => {
    const { suggestions, inputNucleus } = suggestRhymes('venir', 'fr');
    expect(inputNucleus).toBe('iʁ');
    const words = suggestions.map(s => s.word);
    expect(words).toEqual(expect.arrayContaining(['finir', 'choisir', 'mourir']));
  });
});

// ─── Options: n, minScore ─────────────────────────────────────────────────────

describe('suggestRhymes — options', () => {
  it('n=3 limits results', () => {
    const { suggestions } = suggestRhymes('son', 'fr', { n: 3 });
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  it('minScore=1.0 returns only perfect rhymes', () => {
    const { suggestions } = suggestRhymes('son', 'fr', { minScore: 1.0, allowNearRhyme: false });
    suggestions.forEach(s => expect(s.score).toBe(1.0));
  });

  it('allowNearRhyme=false suppresses near-rhyme path', () => {
    const { suggestions } = suggestRhymes('son', 'fr', { allowNearRhyme: false });
    suggestions.forEach(s => expect(s.score).toBe(1.0));
  });
});

// ─── Fallback: unknown language ───────────────────────────────────────────────

describe('suggestRhymes — fallback', () => {
  it('returns usedFallback=true for unregistered lang', () => {
    const { suggestions, usedFallback } = suggestRhymes('hello', 'xx');
    expect(usedFallback).toBe(true);
    expect(suggestions).toHaveLength(0);
  });
});

// ─── Results sorted by score DESC ────────────────────────────────────────────

describe('suggestRhymes — sort order', () => {
  it('suggestions are sorted by score descending', () => {
    const { suggestions } = suggestRhymes('venir', 'fr', { n: 20 });
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i].score).toBeLessThanOrEqual(suggestions[i - 1].score);
    }
  });
});
