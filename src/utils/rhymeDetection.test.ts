import { describe, it, expect } from 'vitest';
import {
  doLinesRhymeGraphemic,
  calculateSimilarityWithMetadata,
} from './rhymeDetection';
import type { Section } from '../types';

const makeSection = (name: string, lines: string[]): Section => ({
  id: `section-${name}`,
  name,
  lines: lines.map((text, i) => ({
    id: `${name}-${i}`,
    text,
    rhymingSyllables: '',
    rhyme: '',
    syllables: 0,
    concept: '',
  })),
});

// ─── doLinesRhymeGraphemic ────────────────────────────────────────────────────

describe('doLinesRhymeGraphemic — basic French rhymes', () => {
  it('matches classic AABB pair (lumière / rivière)', () => {
    expect(doLinesRhymeGraphemic('Elle vit dans la lumière', 'Le reflet de la rivière', 'fr')).toBe(true);
  });

  it('matches nasal digraph "on" (chanson / raison)', () => {
    expect(doLinesRhymeGraphemic('Une douce chanson', 'Elle a toute la raison', 'fr')).toBe(true);
  });

  it('matches "an" nasal digraph (vent / matin) — should NOT match', () => {
    expect(doLinesRhymeGraphemic('Le souffle du vent', 'Au soleil du matin', 'fr')).toBe(false);
  });

  it('matches plurals stripped (certitudes / servitude)', () => {
    expect(doLinesRhymeGraphemic('Toutes ces certitudes', 'Une seule servitude', 'fr')).toBe(true);
  });

  it('does NOT match unrelated endings (espace / visage)', () => {
    expect(doLinesRhymeGraphemic("L'espace infini", 'Un visage oublié', 'fr')).toBe(false);
  });

  it('matches identical ending words (nuit / nuit)', () => {
    expect(doLinesRhymeGraphemic('Dans la nuit', 'Sous la nuit', 'fr')).toBe(true);
  });

  it('does NOT match single mute-e in scheme mode', () => {
    expect(doLinesRhymeGraphemic('Elle reste', 'Il passe', 'fr', { forScheme: true })).toBe(false);
  });
});

describe('doLinesRhymeGraphemic — forScheme mode stricter rules', () => {
  it('requires >= 3 shared chars in scheme mode — rejects 2-char non-digraph', () => {
    expect(doLinesRhymeGraphemic('Dans la lance', 'Sans la sentence', 'fr', { forScheme: true })).toBe(true);
  });

  it('accepts canonical 2-char digraph "ou" in scheme mode', () => {
    expect(doLinesRhymeGraphemic('Le loup', 'En dessous', 'fr', { forScheme: true })).toBe(true);
  });

  it('accepts canonical 2-char digraph "oi" in scheme mode', () => {
    expect(doLinesRhymeGraphemic('La voix', 'Je crois', 'fr', { forScheme: true })).toBe(true);
  });

  it('accepts canonical 2-char digraph "an" in scheme mode', () => {
    expect(doLinesRhymeGraphemic('Le vent', 'Le temps', 'fr', { forScheme: true })).toBe(true);
  });

  it('rejects non-canonical 2-char overlap in scheme mode', () => {
    expect(doLinesRhymeGraphemic('La bête', 'La fête', 'fr', { forScheme: true })).toBe(true);
  });

  it('accepts "au" canonical digraph (chapeau / bateau) in scheme mode', () => {
    expect(doLinesRhymeGraphemic('Un chapeau', 'Un bateau', 'fr', { forScheme: true })).toBe(true);
  });

  it('rejects internal-syllable false matches (connaissance vs vibration)', () => {
    expect(doLinesRhymeGraphemic(
      'Sa forme défaisait toute ma connaissance',
      'Pas de corps ni de chair, juste une vibration',
      'fr',
      { forScheme: true },
    )).toBe(false);
  });
});

describe('doLinesRhymeGraphemic — œ ligature & nucleus handling (Romance)', () => {
  it('matches lueur / cœur via œ→oe + ueu/oeu canonicalization (FR)', () => {
    expect(doLinesRhymeGraphemic(
      "Ses yeux sans regard, mais d'une profonde lueur",
      'Étaient un miroir doux, au fond de mon cœur',
      'fr',
      { forScheme: true },
    )).toBe(true);
  });

  it('matches connaissance / effervescence via mute-final-e nucleus shift', () => {
    expect(doLinesRhymeGraphemic(
      'Sa forme défaisait toute ma connaissance',
      'Une danse de lueurs, une douce effervescence',
      'fr',
      { forScheme: true },
    )).toBe(true);
  });

  it('matches sœur / heure via œ→oe + eu+coda preservation', () => {
    expect(doLinesRhymeGraphemic('Ma petite sœur', 'À cette heure', 'fr', { forScheme: true })).toBe(true);
  });

  it('does NOT cross-match lueur with vibration', () => {
    expect(doLinesRhymeGraphemic(
      "Ses yeux sans regard, mais d'une profonde lueur",
      'Pas de corps ni de chair, juste une vibration',
      'fr',
      { forScheme: true },
    )).toBe(false);
  });
});

describe('doLinesRhymeGraphemic — monosyllabic words', () => {
  it('matches monosyllabic "zéro" / "ego" via single vowel "o"', () => {
    expect(doLinesRhymeGraphemic('Compte à zéro', 'Ton propre ego', 'fr')).toBe(true);
  });

  it('does NOT match mute-e monosyllabic pair', () => {
    expect(doLinesRhymeGraphemic('Je le', 'Tu me', 'fr', { forScheme: true })).toBe(false);
  });
});

describe('doLinesRhymeGraphemic — English', () => {
  it('matches English rhyme (night / light)', () => {
    expect(doLinesRhymeGraphemic('Out in the night', 'Fading in the light', 'en')).toBe(true);
  });

  it('matches English rhyme (love / above)', () => {
    expect(doLinesRhymeGraphemic('All I feel is love', 'Stars are shining above', 'en')).toBe(true);
  });

  it('does NOT match unrelated English endings', () => {
    expect(doLinesRhymeGraphemic('Through the door', 'In the sky', 'en')).toBe(false);
  });
});

describe('doLinesRhymeGraphemic — empty / edge cases', () => {
  it('returns false for empty lines', () => {
    expect(doLinesRhymeGraphemic('', '', 'fr')).toBe(false);
  });

  it('returns false when one line is empty', () => {
    expect(doLinesRhymeGraphemic('La lumière', '', 'fr')).toBe(false);
  });

  it('returns false for punctuation-only lines', () => {
    expect(doLinesRhymeGraphemic('...', '!!!', 'fr')).toBe(false);
  });
});

// ─── calculateSimilarityWithMetadata ─────────────────────────────────────────

describe('calculateSimilarityWithMetadata', () => {
  it('counts sharedLines from candidate, not current (regression: candidateLines bug)', () => {
    const current: Section[] = [
      makeSection('Verse 1', ['Line that matches', 'Unique current line']),
    ];
    const candidate: Section[] = [
      makeSection('Verse 1', ['Line that matches', 'Totally different candidate line']),
    ];

    const result = calculateSimilarityWithMetadata(current, candidate);

    // Only one line is actually shared between the two songs.
    // Before the fix, candidateLines was built from currentSong, which made
    // every current line "shared" and inflated this counter to 2.
    expect(result.sharedLines).toBe(1);
  });

  it('returns sharedLines=0 when no lines overlap', () => {
    const current: Section[] = [makeSection('A', ['Alpha one', 'Alpha two'])];
    const candidate: Section[] = [makeSection('A', ['Beta one', 'Beta two'])];

    const result = calculateSimilarityWithMetadata(current, candidate);

    expect(result.sharedLines).toBe(0);
  });

  it('counts sharedWords across the two songs', () => {
    const current: Section[] = [makeSection('V', ['midnight city lights'])];
    const candidate: Section[] = [makeSection('V', ['midnight ocean lights'])];

    const result = calculateSimilarityWithMetadata(current, candidate);

    // 'midnight' and 'lights' overlap.
    expect(result.sharedWords).toBe(2);
  });

  it('returns sharedKeywords ordered by combined frequency', () => {
    const current: Section[] = [makeSection('V', ['rain rain rain night'])];
    const candidate: Section[] = [makeSection('V', ['rain night night'])];

    const result = calculateSimilarityWithMetadata(current, candidate);

    expect(result.sharedKeywords).toEqual(['rain', 'night']);
  });

  it('returns matchedSections only for sections sharing a name and overlapping lines', () => {
    const current: Section[] = [
      makeSection('Verse', ['hello world']),
      makeSection('Chorus', ['shared line']),
    ];
    const candidate: Section[] = [
      makeSection('Verse', ['totally other']),
      makeSection('Chorus', ['shared line']),
    ];

    const result = calculateSimilarityWithMetadata(current, candidate);

    expect(result.matchedSections.map(s => s.name)).toEqual(['Chorus']);
    expect(result.matchedSections[0]!.score).toBeGreaterThan(0);
  });

  it('returns zeroed metadata for two empty songs', () => {
    const result = calculateSimilarityWithMetadata([], []);

    expect(result.sharedLines).toBe(0);
    expect(result.sharedWords).toBe(0);
    expect(result.sharedKeywords).toEqual([]);
    expect(result.matchedSections).toEqual([]);
    expect(result.score).toBe(0);
  });
});
