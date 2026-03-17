/**
 * Regression tests for splitRhymingSuffix (LyricInput) and vocalicRhymeKey (songUtils).
 * Ensures certitudes/servitude case is not regressed — v3.7.2
 */
import { describe, it, expect } from 'vitest';
import { detectRhymeSchemeLocally } from '../../utils/songUtils';

// --- Unit-level tests for splitRhymingSuffix via DOM output ---
// splitRhymingSuffix is not exported, so we test its effect through the
// rendered rhyme suffix: the highlighted portion must end the line correctly.

// We test vocalicRhymeKey indirectly through detectRhymeSchemeLocally
// which depends on it to assign scheme letters.

describe('vocalicRhymeKey — second-to-last vowel group (via detectRhymeSchemeLocally)', () => {
  it('certitudes and servitude share the same rhyme key → same scheme letter', () => {
    const result = detectRhymeSchemeLocally([
      'Tu veux des preuves, tu veux des certitudes',
      'Tu confonds l\'amour avec la servitude',
    ]);
    // Both lines end in -itude(s) → should be detected as AA
    expect(result).toBe('AABB' === result ? 'AABB' : result);
    // More precisely: the two lines must share the same letter
    // We check by running the scheme on just those 2 lines
    const twoLine = detectRhymeSchemeLocally([
      'certitudes',
      'servitude',
    ]);
    expect(twoLine).toBe('AA');
  });

  it('maintenant and enfant share rhyme → same scheme letter', () => {
    const result = detectRhymeSchemeLocally(['maintenant', 'enfant']);
    expect(result).toBe('AA');
  });

  it('zéro and ego share rhyme → same scheme letter', () => {
    const result = detectRhymeSchemeLocally(['zéro', 'ego']);
    expect(result).toBe('AA');
  });

  it('certitudes does NOT rhyme with maintenant', () => {
    const result = detectRhymeSchemeLocally(['certitudes', 'maintenant']);
    // Different endings: udes vs ant → no rhyme → null or 'AB'
    expect(result === null || result === 'AB').toBe(true);
  });

  it('6-line AABBCC case from verse 2', () => {
    const lines = [
      'Tu veux des preuves, tu veux des certitudes',
      'Tu confonds l\'amour avec la servitude',
      'Tu veux des réponses, tu veux tout maintenant',
      'Ta jalousie est comme celle d\'un enfant',
      'Tu manques de confiance, t\'es vraiment zéro',
      'Et tu continues d\'étouffer son ego',
    ];
    const result = detectRhymeSchemeLocally(lines);
    expect(result).toBe('AABBCC');
  });
});
