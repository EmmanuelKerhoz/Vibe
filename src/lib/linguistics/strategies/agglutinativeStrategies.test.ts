import { describe, expect, it } from 'vitest';
import { PhonologicalRegistry } from '../index';

describe('agglutinative strategies', () => {
  it('registers Turkic strategy with harmony-aware rhyme nuclei', () => {
    const result = PhonologicalRegistry.analyze('kitaplarda', 'tr');

    expect(result?.algoId).toBe('ALGO-TRK');
    expect(result?.rhymeNucleus.nucleus).toBe('back:a');
    expect(result?.rhymeNucleus.coda).toBe('p');
  });

  it('registers Uralic strategy with front/back/neutral harmony classes', () => {
    const result = PhonologicalRegistry.analyze('kylässä', 'fi');

    expect(result?.algoId).toBe('ALGO-FIN');
    expect(result?.rhymeNucleus.nucleus).toBe('front:ä');
  });

  it('normalizes Dravidian retroflexes while preserving long vowels', () => {
    const result = PhonologicalRegistry.compare('pāṭu', 'pātu', 'ta');

    expect(result?.familyId).toBe('ALGO-DRV');
    expect(result?.score).toBe(1);
  });

  it('transliterates Hindi and Urdu endings to the same long-vowel rhyme nucleus', () => {
    const hindi = PhonologicalRegistry.analyze('किताबों', 'hi');
    const urdu = PhonologicalRegistry.analyze('کتابوں', 'ur');

    expect(hindi?.algoId).toBe('ALGO-IIR');
    expect(hindi?.rhymeNucleus.nucleus).toBe('ā');
    expect(hindi?.rhymeNucleus.coda).toBe('b');
    expect(urdu?.rhymeNucleus.nucleus).toBe('ā');
    expect(urdu?.rhymeNucleus.coda).toBe('b');
  });
});
