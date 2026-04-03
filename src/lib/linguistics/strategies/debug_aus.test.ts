import { describe, it } from 'vitest';
import { PhonologicalRegistry } from '../index';

describe('debug', () => {
  it('debug menulis', () => {
    const r = PhonologicalRegistry.analyze('menulis', 'id');
    console.log('menulis nucleus:', r?.rhymeNucleus.nucleus);
    console.log('menulis coda:', r?.rhymeNucleus.coda);
    console.log('menulis syllables:', JSON.stringify(r?.syllables));

    const r2 = PhonologicalRegistry.analyze('duduk', 'id');
    console.log('duduk nucleus:', r2?.rhymeNucleus.nucleus);
    console.log('duduk syllables:', JSON.stringify(r2?.syllables));
    
    const r3 = PhonologicalRegistry.analyze('밥', 'ko');
    console.log('밥 coda:', r3?.rhymeNucleus.coda);
    console.log('밥 syllables:', JSON.stringify(r3?.syllables));
  });
});
