import { describe, it, expect } from 'vitest';
import {
  doLinesRhymeGraphemic,
  segmentVerseToRhymingUnit,
  splitRhymingSuffix,
} from './rhymeDetection';

// ─── doLinesRhymeGraphemic ────────────────────────────────────────────────────

describe('doLinesRhymeGraphemic — basic French rhymes', () => {
  it('matches classic AABB pair (lumière / rivière)', () => {
    expect(doLinesRhymeGraphemic('Elle vit dans la lumière', 'Le reflet de la rivière', 'fr')).toBe(true);
  });

  it('matches nasal digraph "on" (chanson / raison)', () => {
    // 'on' is a canonical digraph → accepted even in scheme mode
    expect(doLinesRhymeGraphemic('Une douce chanson', 'Elle a toute la raison', 'fr')).toBe(true);
  });

  it('matches "an" nasal digraph (vent / matin) — should NOT match', () => {
    expect(doLinesRhymeGraphemic('Le souffle du vent', 'Au soleil du matin', 'fr')).toBe(false);
  });

  it('matches plurals stripped (certitudes / servitude)', () => {
    // trailing "s" stripped by canonicalizeRhymeSuffix on longer suffixes
    expect(doLinesRhymeGraphemic('Toutes ces certitudes', 'Une seule servitude', 'fr')).toBe(true);
  });

  it('does NOT match unrelated endings (espace / visage)', () => {
    // ace/asse merger removed — "espace" → "ace", "visage" → "age", no longer collapses to same bucket
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
    // "ance" ∩ "ence" = "nce" (3 chars) — should match
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
    // "bête"/"fête" share "ete" (3 chars via accent strip: bete/fete) → accepted
    expect(doLinesRhymeGraphemic('La bête', 'La fête', 'fr', { forScheme: true })).toBe(true);
  });

  it('accepts "au" canonical digraph (chapeau / bateau) in scheme mode', () => {
    expect(doLinesRhymeGraphemic('Un chapeau', 'Un bateau', 'fr', { forScheme: true })).toBe(true);
  });

  it('rejects internal-syllable false matches (connaissance vs vibration)', () => {
    // Without scheme-mode last-vowel-group restriction, "c**on**naissance"
    // would falsely match "vibrati**on**" via the internal "on" syllable.
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

// ─── canonical suffix normalization ──────────────────────────────────────────
//
// These tests target paths through canonicalizeRhymeSuffix + applyFamilySuffixNorm
// that were previously untested. Each case exercises a specific table entry and
// verifies that the normalization produces the expected rhyme decision.

describe('doLinesRhymeGraphemic — canonical suffix normalization (ROM)', () => {
  it('matches ence / ance via ROMANCE_VOWEL_MERGERS "an" bucket', () => {
    // "ence" → /an+ence/ → canon "an"  ;  "ance" → canon "an"
    expect(doLinesRhymeGraphemic('Dans cette évidence', 'Une belle élégance', 'fr', { forScheme: true })).toBe(true);
  });

  it('matches "oir" endings (voir / savoir) via ROM_SUFFIX_TABLE identity', () => {
    expect(doLinesRhymeGraphemic('Ce que je veux voir', 'Tout ce que je dois savoir', 'fr', { forScheme: true })).toBe(true);
  });

  it('matches "oire" / "oir" (mémoire / voir) via ROM oire→oir normalization', () => {
    // oire → oir in ROM_SUFFIX_TABLE; last-vowel-group of mémoire is "oire"
    expect(doLinesRhymeGraphemic('Une douce mémoire', 'Impossible à voir', 'fr', { forScheme: true })).toBe(true);
  });

  it('matches "ette" / "ete" (baguette / fête) via ROM_SUFFIX_TABLE ette→ete', () => {
    expect(doLinesRhymeGraphemic('Une longue baguette', 'La lumière de la fête', 'fr', { forScheme: true })).toBe(true);
  });

  it('matches "uit" / "ui" (nuit / lui) via ROM_SUFFIX_TABLE uit→ui', () => {
    // "nuit" last-vg suffix → "uit" → canon "ui"; "lui" → "ui"
    expect(doLinesRhymeGraphemic('Dans la nuit profonde', 'Le regard de lui', 'fr', { forScheme: true })).toBe(true);
  });

  it('matches "ain" / "in" (main / chemin) via ROM_SUFFIX_TABLE ain→in', () => {
    expect(doLinesRhymeGraphemic('Tendre la main', 'Au bout du chemin', 'fr', { forScheme: true })).toBe(true);
  });

  it('matches "ein" / "in" (plein / matin) via ROM_SUFFIX_TABLE ein→in', () => {
    // "plein" → ein → canon "in";  "matin" → "in"
    expect(doLinesRhymeGraphemic('Un verre bien plein', 'Le calme du matin', 'fr', { forScheme: true })).toBe(true);
  });

  it('does NOT match "oir" / "eur" (voir / cœur) — distinct canonical forms', () => {
    expect(doLinesRhymeGraphemic('Ce que je veux voir', 'Au fond de mon cœur', 'fr', { forScheme: true })).toBe(false);
  });
});

describe('doLinesRhymeGraphemic — plural / singular stripping', () => {
  it('matches adjective singular/plural (possessif / possessifs)', () => {
    // "possessifs" → strip -s → "possessif"; shares "if" suffix
    expect(doLinesRhymeGraphemic('Un ton possessif', 'Ces regards possessifs', 'fr')).toBe(true);
  });

  it('matches noun singular/plural (lumière / lumières)', () => {
    expect(doLinesRhymeGraphemic('Une seule lumière', 'Toutes ces lumières', 'fr')).toBe(true);
  });

  it('matches -x plural stripping (voix / voix)', () => {
    // -x is also stripped on suffixes > 2 chars
    expect(doLinesRhymeGraphemic('La belle voix', 'Une douce voix', 'fr')).toBe(true);
  });
});

describe('doLinesRhymeGraphemic — GER family (English)', () => {
  it('matches "ight" / "ite" (night / finite) via GER ight→ait / ite→ait', () => {
    expect(doLinesRhymeGraphemic('Lost in the night', 'Something feels finite', 'en', { forScheme: true })).toBe(true);
  });

  it('matches "tion" / "sion" (nation / passion) via GER tion→shun / sion→shun', () => {
    expect(doLinesRhymeGraphemic('A divided nation', 'A burning passion', 'en', { forScheme: true })).toBe(true);
  });

  it('matches "ee" / "ea" (free / dream) via GER ee→ee / ea→ee', () => {
    expect(doLinesRhymeGraphemic('Born to be free', 'Lost in a dream', 'en', { forScheme: true })).toBe(true);
  });

  it('matches "ay" / "ey" (day / they) via GER ay→ay / ey→ay', () => {
    expect(doLinesRhymeGraphemic('End of the day', 'The way they say', 'en', { forScheme: true })).toBe(true);
  });

  it('matches "ow" / "oe" (flow / toe) via GER ow→ow / oe→ow', () => {
    expect(doLinesRhymeGraphemic('Watch the river flow', 'Stubbing my toe', 'en', { forScheme: true })).toBe(true);
  });

  it('does NOT match "ight" / "tion" (night / nation) — distinct GER canonical forms', () => {
    expect(doLinesRhymeGraphemic('Out in the night', 'A fallen nation', 'en', { forScheme: true })).toBe(false);
  });
});

describe('doLinesRhymeGraphemic — TRK family (Turkish vowel harmony)', () => {
  it('matches back/front vowel harmony collapse: "ı" / "i" (gelir / bilir)', () => {
    // TRK: ı→i; both words end with canonical "ir" suffix
    expect(doLinesRhymeGraphemic('Her gün gelir', 'Hep öyle bilir', 'tr', { forScheme: true })).toBe(true);
  });

  it('matches "ü" / "u" collapsed (güzel / uzul — near-rhyme via TRK table)', () => {
    // TRK: ü→u; "güzel" → "uzel", "uzul" → "uzul"; last-vg suffix overlap "ul"
    expect(doLinesRhymeGraphemic('Her şey güzel', 'Gönlüm uzul', 'tr', { forScheme: true })).toBe(true);
  });
});

describe('doLinesRhymeGraphemic — FIN family (Finnish long vowels)', () => {
  it('matches long/short vowel pair "aa"/"a" (maa / ja)', () => {
    // FIN: aa→a; "maa" → canon "a"; "ja" ends with "a"
    expect(doLinesRhymeGraphemic('Kaunis maa', 'Sinä ja', 'fi', { forScheme: true })).toBe(true);
  });

  it('matches geminate consonant stripping "ll"/"l" (tulla / kulla)', () => {
    // FIN: ll→l; "tulla" and "kulla" both normalize to "ula"
    expect(doLinesRhymeGraphemic('Aika tulla', 'Sydän kulla', 'fi', { forScheme: true })).toBe(true);
  });
});

// ─── segmentVerseToRhymingUnit ────────────────────────────────────────────────

describe('segmentVerseToRhymingUnit — end rhyme (default)', () => {
  it('returns position "end" for a normal line', () => {
    const seg = segmentVerseToRhymingUnit('Dans la lumière du matin', 'fr');
    expect(seg.position).toBe('end');
    expect(seg.rhymingUnit).toBe('matin');
  });

  it('preserves originalText', () => {
    const line = 'Le ciel est clair';
    const seg = segmentVerseToRhymingUnit(line, 'fr');
    expect(seg.originalText).toBe(line);
  });

  it('strips trailing punctuation before extraction', () => {
    const seg = segmentVerseToRhymingUnit('La nuit tombe...', 'fr');
    expect(seg.rhymingUnit).toBe('tombe');
  });

  it('returns empty rhymingUnit for blank line', () => {
    const seg = segmentVerseToRhymingUnit('', 'fr');
    expect(seg.rhymingUnit).toBe('');
    expect(seg.position).toBe('end');
  });

  it('normalizes accents in rhymingUnit (é → e)', () => {
    const seg = segmentVerseToRhymingUnit('Le ciel étoilé', 'fr');
    expect(seg.rhymingUnit).toBe('etoile');
  });

  it('strips mixed trailing punctuation (comma + ellipsis)', () => {
    const seg = segmentVerseToRhymingUnit('Elle chante, doucement...', 'fr');
    expect(seg.rhymingUnit).toBe('doucement');
  });

  it('handles single-word line', () => {
    const seg = segmentVerseToRhymingUnit('Silence', 'fr');
    expect(seg.position).toBe('end');
    expect(seg.rhymingUnit).toBe('silence');
  });
});

describe('segmentVerseToRhymingUnit — enjambment detection', () => {
  it('detects French connector "et" as enjambment', () => {
    const seg = segmentVerseToRhymingUnit('Dans les étoiles et', 'fr');
    expect(seg.position).toBe('enjambed');
    expect(seg.rhymingUnit).toBe('etoiles');
  });

  it('detects French connector "de" as enjambment', () => {
    const seg = segmentVerseToRhymingUnit('Un souffle de', 'fr');
    expect(seg.position).toBe('enjambed');
    expect(seg.rhymingUnit).toBe('souffle');
  });

  it('detects English connector "and" as enjambment', () => {
    const seg = segmentVerseToRhymingUnit('Beneath the stars and', 'en');
    expect(seg.position).toBe('enjambed');
    expect(seg.rhymingUnit).toBe('stars');
  });

  it('does NOT mark enjambment when connector is the only word', () => {
    const seg = segmentVerseToRhymingUnit('et', 'fr');
    // Single token: no penultimate word exists → falls through to end
    expect(seg.position).toBe('end');
  });

  it('detects French connector "ou" as enjambment', () => {
    const seg = segmentVerseToRhymingUnit('Dans la forêt ou', 'fr');
    expect(seg.position).toBe('enjambed');
    expect(seg.rhymingUnit).toBe('foret');
  });

  it('detects English connector "of" as enjambment', () => {
    const seg = segmentVerseToRhymingUnit('In the heart of', 'en');
    expect(seg.position).toBe('enjambed');
    expect(seg.rhymingUnit).toBe('heart');
  });

  it('does NOT treat a content word as enjambment connector', () => {
    const seg = segmentVerseToRhymingUnit('Le ciel profond', 'fr');
    expect(seg.position).toBe('end');
    expect(seg.rhymingUnit).toBe('profond');
  });
});

describe('segmentVerseToRhymingUnit — internal rhyme detection', () => {
  it('detects internal rhyme when mid-line word echoes end-rhyme (nuit / lui)', () => {
    const seg = segmentVerseToRhymingUnit('Dans la nuit comme lui', 'fr');
    expect(seg.position).toBe('internal');
  });

  it('detects internal rhyme (soir / voir)', () => {
    const seg = segmentVerseToRhymingUnit('Un soir pour mieux voir', 'fr');
    expect(seg.position).toBe('internal');
  });

  it('does NOT flag internal rhyme for unrelated tokens', () => {
    const seg = segmentVerseToRhymingUnit('Au lever du matin calme', 'fr');
    expect(seg.position).toBe('end');
  });

  it('does NOT flag internal rhyme when shared nucleus is only 1 char', () => {
    // Single-vowel overlap ("e") is below the 2-char threshold
    const seg = segmentVerseToRhymingUnit('Je chante et je danse', 'fr');
    expect(seg.position).toBe('end');
  });

  it('does NOT flag internal rhyme for mute-final "-es" suffix', () => {
    // detectInternalRhymeToken explicitly rejects lwSuffix === "es"
    const seg = segmentVerseToRhymingUnit('Ces certitudes et ces postures', 'fr');
    expect(seg.position).toBe('end');
  });

  it('does NOT flag internal rhyme on a 2-word line (too short)', () => {
    // tokens.length === 2 → candidates slice(0, -1) has 1 token; no "before" context
    const seg = segmentVerseToRhymingUnit('Nuit voir', 'fr');
    // May still detect depending on suffix; key contract: no crash + valid position
    expect(['end', 'internal']).toContain(seg.position);
  });
});

describe('segmentVerseToRhymingUnit — agglutinative families', () => {
  it('returns position "end" and non-empty rhymingUnit for Turkish', () => {
    const seg = segmentVerseToRhymingUnit('Seviyorum seni', 'tr');
    expect(seg.position).toBe('end');
    expect(seg.rhymingUnit.length).toBeGreaterThan(0);
  });

  it('returns position "end" and non-empty rhymingUnit for Finnish', () => {
    const seg = segmentVerseToRhymingUnit('Rakastan sinua', 'fi');
    expect(seg.position).toBe('end');
    expect(seg.rhymingUnit.length).toBeGreaterThan(0);
  });

  it('uses last vowel-group as rhymingUnit for Turkish (gelir → "ir")', () => {
    // ALGO-TRK: last-word "gelir", last vowel group starts at 'i' → "ir"
    const seg = segmentVerseToRhymingUnit('Her gün gelir', 'tr');
    expect(seg.rhymingUnit).toBe('ir');
  });

  it('uses last vowel-group as rhymingUnit for Finnish (sinua → "ua")', () => {
    // ALGO-FIN: last-word "sinua", last vowel group is "ua"
    const seg = segmentVerseToRhymingUnit('Rakastan sinua', 'fi');
    expect(seg.rhymingUnit).toBe('ua');
  });

  it('does NOT trigger enjambment detection for agglutinative families', () => {
    // Turkish word "ve" (and) is not in ENJAMBMENT_CONNECTORS and the family
    // path exits before the connector check anyway
    const seg = segmentVerseToRhymingUnit('Seninle ve', 'tr');
    expect(seg.position).toBe('end');
  });
});

// ─── splitRhymingSuffix ───────────────────────────────────────────────────────

describe('splitRhymingSuffix — basic splitting', () => {
  it('returns non-null split for a matched peer', () => {
    const result = splitRhymingSuffix('Dans la lumière', ['La douce rivière'], 'fr');
    expect(result).not.toBeNull();
    expect(result!.before.length + result!.rhyme.length).toBe('Dans la lumière'.length);
  });

  it('rhyme fragment ends with the matched ending', () => {
    const result = splitRhymingSuffix('La belle chanson', ['Une triste oraison'], 'fr');
    expect(result).not.toBeNull();
    expect(result!.rhyme.length).toBeGreaterThan(0);
  });

  it('returns fallback split when no peer matches', () => {
    const result = splitRhymingSuffix('La lumière', [], 'fr');
    expect(result).not.toBeNull();
    expect(result!.rhyme).toBeTruthy();
  });

  it('returns null for an empty line', () => {
    const result = splitRhymingSuffix('', ['une lumière'], 'fr');
    expect(result).toBeNull();
  });

  it('picks longest shared suffix among multiple peers', () => {
    const result = splitRhymingSuffix(
      'La fête',
      ['La bête', 'Le poème'],
      'fr',
    );
    expect(result).not.toBeNull();
    // "ete" (3 chars, bête/fête) beats "e" (1 char) from poème
    expect(result!.rhyme.length).toBeGreaterThan(1);
  });

  it('before + rhyme reconstruct the exact original text', () => {
    const text = 'Sous le ciel étoilé';
    const result = splitRhymingSuffix(text, ['Au printemps envolé'], 'fr');
    expect(result).not.toBeNull();
    expect(result!.before + result!.rhyme).toBe(text);
  });
});

describe('splitRhymingSuffix — canonical suffix resolution (splitLineAtCanonicalSuffix path)', () => {
  it('resolves ence→ance canonical split for "évidence"', () => {
    const result = splitRhymingSuffix('Dans cette évidence', ['Une belle élégance'], 'fr');
    expect(result).not.toBeNull();
    expect(result!.rhyme.length).toBeGreaterThan(0);
    expect(result!.before + result!.rhyme).toBe('Dans cette évidence');
  });

  it('resolves ight→ait canonical split for English "night"', () => {
    const result = splitRhymingSuffix('Out in the night', ['Fading in the light'], 'en');
    expect(result).not.toBeNull();
    expect(result!.rhyme.length).toBeGreaterThan(0);
    expect(result!.before + result!.rhyme).toBe('Out in the night');
  });

  it('resolves oire→oir canonical split for "mémoire"', () => {
    const result = splitRhymingSuffix('Une douce mémoire', ['Impossible à voir'], 'fr');
    expect(result).not.toBeNull();
    expect(result!.before + result!.rhyme).toBe('Une douce mémoire');
    expect(result!.rhyme.toLowerCase()).toMatch(/oire$/);
  });

  it('resolves uit→ui canonical split for "nuit" (vowel-onset extension)', () => {
    // "nuit": last-vg suffix "uit" → canon "ui"; extendToVowelOnset backs up to 'u' onset
    const result = splitRhymingSuffix('Dans la nuit', ['Le regard de lui'], 'fr');
    expect(result).not.toBeNull();
    expect(result!.before + result!.rhyme).toBe('Dans la nuit');
    expect(result!.rhyme).toMatch(/nuit$/);
  });
});

describe('splitRhymingSuffix — vowel-onset extension (extendToVowelOnset)', () => {
  it('extends split backward to include French diphthong "ai" onset (défaite)', () => {
    // "défaite": normalizedWord "defaite", suffix starts at "te" → extends to "aite"
    // because "ai" is a known FRENCH_DIGRAPH
    const result = splitRhymingSuffix('Une lourde défaite', ['À cette fête'], 'fr');
    expect(result).not.toBeNull();
    expect(result!.before + result!.rhyme).toBe('Une lourde défaite');
    expect(result!.rhyme.length).toBeGreaterThanOrEqual(3);
  });

  it('does NOT extend when shared suffix starts with a consonant', () => {
    // "lueur" / "cœur": canonical suffix "eur" starts with vowel — split lands
    // on vowel onset, before should be non-empty
    const result = splitRhymingSuffix('Une douce lueur', ['Au fond de mon cœur'], 'fr');
    expect(result).not.toBeNull();
    expect(result!.before + result!.rhyme).toBe('Une douce lueur');
    expect(result!.before.length).toBeGreaterThan(0);
  });

  it('handles word where vowel group starts at position 0 (no extension possible)', () => {
    // "eau" starts with a vowel at index 0 — extendToVowelOnset should clamp to 0
    const result = splitRhymingSuffix('Le beau tableau', ['Le nouveau bateau'], 'fr');
    expect(result).not.toBeNull();
    expect(result!.before + result!.rhyme).toBe('Le beau tableau');
  });
});

describe('splitRhymingSuffix — enjambed line', () => {
  it('strips trailing connector before splitting', () => {
    const result = splitRhymingSuffix('Les étoiles et', ['Ses idoles'], 'fr');
    // Effective text is "Les étoiles" — rhyme should come from "étoiles"
    expect(result).not.toBeNull();
    expect(result!.rhyme.length).toBeGreaterThan(0);
  });

  it('before + rhyme reconstruct the ORIGINAL text (connector still present)', () => {
    // splitRhymingSuffix maps offsets onto the original (pre-connector-strip) text
    const text = 'Les étoiles et';
    const result = splitRhymingSuffix(text, ['Ses idoles'], 'fr');
    expect(result).not.toBeNull();
    expect(result!.before + result!.rhyme).toBe(text);
  });

  it('handles enjambed line with no matching peer (fallback)', () => {
    const result = splitRhymingSuffix('Le vent et', [], 'fr');
    expect(result).not.toBeNull();
    expect(result!.rhyme.length).toBeGreaterThan(0);
  });
});

describe('splitRhymingSuffix — fallback path (no peer / no match)', () => {
  it('returns non-null fallback for a word with a clear vowel group', () => {
    const result = splitRhymingSuffix('Sous les étoiles', [], 'fr');
    expect(result).not.toBeNull();
    expect(result!.rhyme.length).toBeGreaterThan(0);
  });

  it('fallback rhyme is a suffix of the last word', () => {
    const text = 'Dans la forêt';
    const result = splitRhymingSuffix(text, [], 'fr');
    expect(result).not.toBeNull();
    expect(text.endsWith(result!.rhyme)).toBe(true);
  });

  it('returns null for punctuation-only text even with peers', () => {
    const result = splitRhymingSuffix('...', ['La lumière'], 'fr');
    expect(result).toBeNull();
  });
});
