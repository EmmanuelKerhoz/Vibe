import { describe, it, expect } from 'vitest';
import {
  doLinesRhymeGraphemic,
} from './rhymeDetection';

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
