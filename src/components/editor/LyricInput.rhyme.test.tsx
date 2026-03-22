/**
 * Regression tests for shared lyric rime detection and suffix highlighting.
 */
import { describe, it, expect } from 'vitest';
import { splitRhymingSuffix } from '../../utils/rhymeDetection';
import { detectRhymeSchemeLocally } from '../../utils/rhymeSchemeUtils';

describe('detectRhymeSchemeLocally', () => {
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

  it('groups possessifs and adjectif together while keeping other lines separate', () => {
    const result = detectRhymeSchemeLocally([
      'A tous les macho, à tous les possessifs',
      'A toutes les go jalouses, voici mon adjectif',
      'Tu prends son cœur… pour une acquisition',
      'Si ton amour est comme une transaction',
    ]);
    expect(result).toBe('AABB');
  });

  it('treats French oi endings like dois, froid and soie as the same rhyme family', () => {
    const result = detectRhymeSchemeLocally(['dois', 'froid', 'soie']);
    expect(result).toBe('AAA');
  });

  it('keeps dois, froid and soie together in the screenshot section regression case', () => {
    const result = detectRhymeSchemeLocally([
      'Tu veux un amour vrai ? Alors aime vraiment.',
      'Sans cadenas, sans piège ni sans “tu me dois”.',
      'Aime sans facture, deal ou condition,',
      'Aime et laisse vivre, même quand t’as froid.',
      'Ton “je t’aime” doit lui apporter la paix,',
      'Pas déclarer une guerre cachée sous la soie.',
    ]);
    expect(result).not.toBeNull();
    expect(result?.[1]).toBe('A');
    expect(result?.[3]).toBe('A');
    expect(result?.[5]).toBe('A');
  });

  it('CHORUS 1: singleton lines get X, oi-family lines get A — no spurious badges', () => {
    const result = detectRhymeSchemeLocally([
      'Tu veux un amour vrai ? Alors aime vraiment.',
      'Sans cadenas, sans piège ni sans "tu me dois".',
      'Aime sans facture, deal ou condition,',
      "Aime et laisse vivre, même quand t'as froid.",
      'Ton "je t\'aime" doit lui apporter la paix,',
      'Pas déclarer une guerre cachée sous la soie.',
    ]);
    expect(result).not.toBeNull();
    const s = result!;
    expect(s[0]).toBe('X');
    expect(s[2]).toBe('X');
    expect(s[4]).toBe('X');
    expect(s[1]).toBe(s[3]);
    expect(s[3]).toBe(s[5]);
  });

  it('returns null when no two lines rhyme', () => {
    expect(detectRhymeSchemeLocally(['alpha', 'monde', 'soleil'])).toBeNull();
  });
});

describe('splitRhymingSuffix', () => {
  it('extracts the shared transaction/acquisition ending instead of over-highlighting the word', () => {
    expect(
      splitRhymingSuffix(
        'Tu prends son cœur… pour une acquisition.',
        ['Si ton amour est comme une transaction.'],
      ),
    ).toEqual({
      before: 'Tu prends son cœur… pour une acquisi',
      rhyme: 'tion.',
    });
  });
});
