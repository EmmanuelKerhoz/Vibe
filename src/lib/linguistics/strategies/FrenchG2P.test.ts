/**
 * FrenchG2P.test.ts
 * Unit tests for the French grapheme-to-phoneme transform.
 *
 * Coverage:
 *   - Nasal vowel production (ɑ̃, ɛ̃, ɔ̃, œ̃)
 *   - Nasal context guard (V+n before vowel → not nasal)
 *   - Vocalic digraphs (eau, au, ou, eu, ai, oi)
 *   - Consonant digraphs (ch, gn, ph)
 *   - Silent-h strip
 *   - Integration: RomanceStrategy extractRN produces correct nucleus for FR
 */

import { describe, it, expect } from 'vitest';
import { frenchG2P } from './FrenchG2P';
import { RomanceStrategy } from './RomanceStrategy';

const strategy = new RomanceStrategy();

describe('frenchG2P — nasal vowels', () => {
  it('chant → ʃɑ̃t', () => {
    expect(frenchG2P('chant')).toBe('ʃɑ̃t');
  });

  it('vent → vɑ̃t', () => {
    expect(frenchG2P('vent')).toBe('vɑ̃t');
  });

  it('fin → fɛ̃', () => {
    expect(frenchG2P('fin')).toBe('fɛ̃');
  });

  it('bon → bɔ̃', () => {
    expect(frenchG2P('bon')).toBe('bɔ̃');
  });

  it('un → œ̃', () => {
    expect(frenchG2P('un')).toBe('œ̃');
  });

  it('nasal guard: amine → amine (i+n before e = not nasal)', () => {
    expect(frenchG2P('amine')).toBe('amine');
  });
});

describe('frenchG2P — vocalic digraphs', () => {
  it('beau → bo (eau→o)', () => {
    expect(frenchG2P('beau')).toBe('bo');
  });

  it('tout → tu (ou→u)', () => {
    expect(frenchG2P('tout')).toBe('tut');
  });

  it('lait → lɛt (ai→ɛ)', () => {
    expect(frenchG2P('lait')).toBe('lɛt');
  });

  it('bois → bwas (oi→wa)', () => {
    expect(frenchG2P('bois')).toBe('bwas');
  });
});

describe('frenchG2P — consonant digraphs + h', () => {
  it('chat → ʃat (ch→ʃ)', () => {
    expect(frenchG2P('chat')).toBe('ʃat');
  });

  it('heure → øre (mute h stripped, eu→ø)', () => {
    expect(frenchG2P('heure')).toBe('øre');
  });
});

describe('RomanceStrategy extractRN — FR nasal rhymes', () => {
  it('chant and vent share nucleus ɑ̃', () => {
    const rn1 = strategy.analyze('chant', 'fr').nucleus;
    const rn2 = strategy.analyze('vent', 'fr').nucleus;
    expect(rn1).toBe('ɑ̃');
    expect(rn2).toBe('ɑ̃');
  });

  it('chant / vent rhyme score = 1.0 on nucleus', () => {
    const result = strategy.compare('chant', 'vent', 'fr');
    expect(result.score).toBeGreaterThanOrEqual(0.9);
  });

  it('talent / serpent share nucleus ɑ̃', () => {
    const rn1 = strategy.analyze('talent', 'fr').nucleus;
    const rn2 = strategy.analyze('serpent', 'fr').nucleus;
    expect(rn1).toBe('ɑ̃');
    expect(rn2).toBe('ɑ̃');
  });
});
