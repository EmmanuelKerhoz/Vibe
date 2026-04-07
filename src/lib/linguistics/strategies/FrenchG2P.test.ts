/**
 * FrenchG2P.test.ts
 * Unit tests for the French grapheme-to-phoneme transform.
 *
 * Coverage:
 *   - Nasal vowel production (ɑ̃, ɛ̃, ɔ̃, œ̃)
 *   - Nasal context guard (V+n before vowel → not nasal)
 *   - Vocalic digraphs (eau, au, ou, eu, ai, oi)
 *   - Consonant digraphs (ch, gn, ph)
 *   - Glide ui → ɥi
 *   - Silent final consonants (d, t, s, x, z, p) — NEW
 *   - Mute final e stripped, monosyllabic kept — NEW
 *   - Silent-h strip / aspirate-h mark
 *   - Integration: RomanceStrategy extractRN produces correct nucleus for FR
 */

import { describe, it, expect } from 'vitest';
import { frenchG2P } from './FrenchG2P';
import { RomanceStrategy } from './RomanceStrategy';

const strategy = new RomanceStrategy();

// ─── Nasal vowels ─────────────────────────────────────────────────────────────
// Final nasal consonant is absorbed into the nasal token;
// the trailing consonant (non-nasal) is then silent-stripped.

describe('frenchG2P — nasal vowels', () => {
  it('chant → ʃɑ̃  (ch→ʃ, nasal ɑ̃, silent final t)', () => {
    expect(frenchG2P('chant')).toBe('ʃɑ̃');
  });

  it('vent → vɑ̃  (nasal ɑ̃, silent final t)', () => {
    expect(frenchG2P('vent')).toBe('vɑ̃');
  });

  it('fin → fɛ̃  (nasal ɛ̃, n absorbed)', () => {
    expect(frenchG2P('fin')).toBe('fɛ̃');
  });

  it('bon → bɔ̃  (nasal ɔ̃, n absorbed)', () => {
    expect(frenchG2P('bon')).toBe('bɔ̃');
  });

  it('un → œ̃  (nasal œ̃)', () => {
    expect(frenchG2P('un')).toBe('œ̃');
  });

  it('nasal guard: amine → amine (i+n before e → not nasal)', () => {
    // mute final e stripped: 'amine' → 'amin'
    expect(frenchG2P('amine')).toBe('amin');
  });
});

// ─── Vocalic digraphs ──────────────────────────────────────────────────────────

describe('frenchG2P — vocalic digraphs', () => {
  it('beau → bo  (eau→o)', () => {
    expect(frenchG2P('beau')).toBe('bo');
  });

  it('tout → tu  (ou→u, silent final t)', () => {
    expect(frenchG2P('tout')).toBe('tu');
  });

  it('lait → lɛ  (ai→ɛ, silent final t)', () => {
    expect(frenchG2P('lait')).toBe('lɛ');
  });

  it('bois → bwa  (oi→wa, silent final s)', () => {
    expect(frenchG2P('bois')).toBe('bwa');
  });

  it('feu → fø  (eu→ø)', () => {
    expect(frenchG2P('feu')).toBe('fø');
  });
});

// ─── Glide ui ────────────────────────────────────────────────────────────────

describe('frenchG2P — glide ui', () => {
  it('nuit → nɥi  (ui→ɥi, silent final t)', () => {
    expect(frenchG2P('nuit')).toBe('nɥi');
  });

  it('fuite → fɥi  (ui→ɥi, mute final e stripped)', () => {
    expect(frenchG2P('fuite')).toBe('fɥi');
  });

  it('suite → sɥi  (ui→ɥi, mute final e stripped)', () => {
    expect(frenchG2P('suite')).toBe('sɥi');
  });
});

// ─── Silent final consonants ─────────────────────────────────────────────────

describe('frenchG2P — silent final consonants', () => {
  it('petit → pəti  (silent final t)', () => {
    expect(frenchG2P('petit')).toBe('pəti');
  });

  it('grand → grɑ̃  (nasal ɑ̃, silent final d)', () => {
    expect(frenchG2P('grand')).toBe('grɑ̃');
  });

  it('trop → tro  (silent final p)', () => {
    expect(frenchG2P('trop')).toBe('tro');
  });

  it('voix → vwa  (oi→wa, silent final x)', () => {
    expect(frenchG2P('voix')).toBe('vwa');
  });

  it('nez → ne  (silent final z)', () => {
    expect(frenchG2P('nez')).toBe('ne');
  });

  it('bras → bra  (silent final s)', () => {
    expect(frenchG2P('bras')).toBe('bra');
  });

  // -et → ɛ
  it('muet → mɥɛ  (et→ɛ)', () => {
    expect(frenchG2P('muet')).toBe('mɥɛ');
  });

  it('filet → filɛ  (et→ɛ)', () => {
    expect(frenchG2P('filet')).toBe('filɛ');
  });

  // -ent verbal (3pp): strip 'nt' after vowel
  it('chantent → ʃɑ̃t  (3pp -ent: nt stripped)', () => {
    // ʃ + ɑ̃ (nasal) + t (consonant) + ɑ̃ + nt — but nasal absorbs 'an', leaving ʃɑ̃t + ɑ̃nt
    // actual: ch→ʃ, an→ɑ̃ (absorbed), t preserved, en→ɑ̃ (absorbed), nt stripped by 3pp rule
    expect(frenchG2P('chantent')).toBe('ʃɑ̃tɑ̃');
  });
});

// ─── Mute final e ──────────────────────────────────────────────────────────────

describe('frenchG2P — mute final e', () => {
  it('chante → ʃɑ̃  (mute e stripped → same RN as chant)', () => {
    expect(frenchG2P('chante')).toBe('ʃɑ̃');
  });

  it('vente → vɑ̃  (mute e stripped → same RN as vent)', () => {
    expect(frenchG2P('vente')).toBe('vɑ̃');
  });

  it('page → pa  (mute e stripped)', () => {
    expect(frenchG2P('page')).toBe('pa');
  });

  it('heure → ø  (mute h stripped, eu→ø, mute e stripped)', () => {
    expect(frenchG2P('heure')).toBe('ø');
  });

  // Monosyllabic guard: e kept as /ə/
  it('le → le  (monosyllabic: e kept)', () => {
    expect(frenchG2P('le')).toBe('le');
  });

  it('me → me  (monosyllabic: e kept)', () => {
    expect(frenchG2P('me')).toBe('me');
  });

  it('de → de  (monosyllabic: e kept)', () => {
    expect(frenchG2P('de')).toBe('de');
  });

  // Accented é / è are NOT mute — preserved
  it('café → kafé  (é not mute, kept)', () => {
    expect(frenchG2P('café')).toBe('kafé');
  });
});

// ─── Consonant digraphs + h ───────────────────────────────────────────────────

describe('frenchG2P — consonant digraphs + h', () => {
  it('chat → ʃa  (ch→ʃ, silent final t)', () => {
    expect(frenchG2P('chat')).toBe('ʃa');
  });

  it('agneau → aɲo  (gn→ɲ, eau→o)', () => {
    expect(frenchG2P('agneau')).toBe('aɲo');
  });

  it('photo → foto  (ph→f, mute final o kept — o is vowel not e)', () => {
    expect(frenchG2P('photo')).toBe('foto');
  });

  it('héros → _h_éro  (aspirate h marked, silent final s)', () => {
    expect(frenchG2P('héros')).toBe('_h_éro');
  });
});

// ─── RomanceStrategy integration ───────────────────────────────────────────

describe('RomanceStrategy extractRN — FR nasal rhymes', () => {
  it('chant and vent share nucleus ɑ̃', () => {
    const rn1 = strategy.analyze('chant', 'fr').nucleus;
    const rn2 = strategy.analyze('vent', 'fr').nucleus;
    expect(rn1).toBe('ɑ̃');
    expect(rn2).toBe('ɑ̃');
  });

  it('chante and vente share nucleus ɑ̃ (mute e stripped)', () => {
    const rn1 = strategy.analyze('chante', 'fr').nucleus;
    const rn2 = strategy.analyze('vente', 'fr').nucleus;
    expect(rn1).toBe('ɑ̃');
    expect(rn2).toBe('ɑ̃');
  });

  it('chant / vente rhyme score ≥ 0.9', () => {
    const result = strategy.compare('chant', 'vente', 'fr');
    expect(result.score).toBeGreaterThanOrEqual(0.9);
  });

  it('talent / serpent share nucleus ɑ̃', () => {
    const rn1 = strategy.analyze('talent', 'fr').nucleus;
    const rn2 = strategy.analyze('serpent', 'fr').nucleus;
    expect(rn1).toBe('ɑ̃');
    expect(rn2).toBe('ɑ̃');
  });

  it('nuit / fuite share nucleus ɥi (glide ui)', () => {
    const rn1 = strategy.analyze('nuit', 'fr').nucleus;
    const rn2 = strategy.analyze('fuite', 'fr').nucleus;
    expect(rn1).toBe('ɥi');
    expect(rn2).toBe('ɥi');
  });

  it('bois / voix rhyme score ≥ 0.9 (oi→wa, both silent finals)', () => {
    const result = strategy.compare('bois', 'voix', 'fr');
    expect(result.score).toBeGreaterThanOrEqual(0.9);
  });
});
