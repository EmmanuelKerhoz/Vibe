import { describe, it, expect } from 'vitest';
import {
  splitIntoRhymingLines,
  extractLineTail,
  extractLineEndingUnit,
} from './lyricSegmenter';

describe('splitIntoRhymingLines', () => {
  it('splits a basic 4-line verse', () => {
    const text = `Je marche dans la nuit
Sous un ciel pur et beau
Le vent qui fait du bruit
Se perd dans les roseaux`;
    expect(splitIntoRhymingLines(text)).toHaveLength(4);
  });

  it('strips section markers', () => {
    const text = `[Chorus]
Fire in my heart
[Verse 2]
Never fall apart`;
    const lines = splitIntoRhymingLines(text);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('Fire in my heart');
  });

  it('strips empty lines', () => {
    const text = `Line one\n\n\nLine two\n`;
    expect(splitIntoRhymingLines(text)).toHaveLength(2);
  });

  it('handles Nouchi mixed text', () => {
    const text = `On fait quoi c\u00e9 soir
Tout le monde doit savoir
Apr\u00e8s police on va voir
Abidjan c\u00e9 notre histoire`;
    expect(splitIntoRhymingLines(text)).toHaveLength(4);
  });
});

// ─── Legacy extractLineTail (backward compat) ─────────────────────────────

describe('extractLineTail (legacy compat)', () => {
  it('extracts last word, strips punctuation', () => {
    expect(extractLineTail('Je marche dans la nuit!')).toBe('nuit');
  });

  it('strips trailing comma', () => {
    expect(extractLineTail('Le vent qui fait du bruit,')).toBe('bruit');
  });

  it('handles single word', () => {
    expect(extractLineTail('amour')).toBe('amour');
  });

  it('lowercases output for non-tonal', () => {
    expect(extractLineTail('la Nuit')).toBe('nuit');
  });
});

// ─── extractLineEndingUnit ───────────────────────────────────────────

describe('extractLineEndingUnit — Latin / FR', () => {
  it('basic French line', () => {
    const r = extractLineEndingUnit('Je marche dans la nuit!', 'fr');
    expect(r.normalized).toBe('nuit');
    expect(r.segmentationMode).toBe('space');
    expect(r.script).toBe('latin');
    expect(r.warnings).toHaveLength(0);
  });

  it('returns surface before normalization', () => {
    const r = extractLineEndingUnit('La Nuit!', 'fr');
    expect(r.surface).toBe('Nuit!');
    expect(r.normalized).toBe('nuit');
  });

  it('typographic quotes stripped', () => {
    const r = extractLineEndingUnit('Elle dit \u201camour\u201d', 'fr');
    expect(r.normalized).toBe('amour');
  });
});

describe('extractLineEndingUnit — Tonal Latin / VI', () => {
  it('preserves Vietnamese tonal diacritics — no destructive lowercase', () => {
    // “kh\u00f4ng\u201d has a tone mark — must survive extraction intact
    const r = extractLineEndingUnit('Anh \u0111i m\u00e3i m\u00e3i kh\u00f4ng', 'vi');
    expect(r.normalized).toContain('kh\u00f4ng');
    expect(r.segmentationMode).toBe('space');
    expect(r.script).toBe('latin');
  });

  it('still strips trailing punctuation', () => {
    const r = extractLineEndingUnit('Anh y\u00eau em m\u00e3i!', 'vi');
    expect(r.normalized.endsWith('!')).toBe(false);
  });
});

describe('extractLineEndingUnit — Yoruba (tonal, Latin)', () => {
  it('preserves Yor\u00f9b\u00e1 tone dots and acute accents', () => {
    // ọ̀r\u00f9n = song — combining diacritics must be preserved
    const r = extractLineEndingUnit('Mo f\u00e9 k\u00e1n \u1ecd\u0300r\u00f9n', 'yo');
    expect(r.normalized).toContain('\u1ecd');
    expect(r.segmentationMode).toBe('space');
  });
});

describe('extractLineEndingUnit — Arabic (RTL)', () => {
  it('extracts last logical word, strips Arabic punctuation', () => {
    // Arabic phrase: last logical token is \u0642\u0644\u0628\u064a
    const r = extractLineEndingUnit('\u0623\u0646\u0627 \u0623\u062d\u0628\u0643 \u064a\u0627 \u0642\u0644\u0628\u064a', 'ar');
    expect(r.normalized).toBe('\u0642\u0644\u0628\u064a');
    expect(r.segmentationMode).toBe('rtl-space');
    expect(r.script).toBe('arabic');
  });

  it('strips Arabic question mark', () => {
    const r = extractLineEndingUnit('\u0647\u0644 \u062a\u0639\u0631\u0641 \u0643\u064a\u0641\u061f', 'ar');
    expect(r.normalized.endsWith('\u061f')).toBe(false);
  });
});

describe('extractLineEndingUnit — CJK / ZH', () => {
  it('returns last 3 grapheme clusters for Chinese', () => {
    // 5-character line: last 3 clusters are \u4e16\u754c\u597d
    const r = extractLineEndingUnit('\u4f60\u597d\u4e16\u754c\u597d', 'zh');
    expect(r.segmentationMode).toBe('grapheme-cluster');
    expect(r.script).toBe('cjk');
    // normalized should be exactly the last 3 chars (no CJK punct here)
    expect(r.normalized).toBe('\u4e16\u754c\u597d');
  });

  it('strips fullwidth period from CJK tail', () => {
    const r = extractLineEndingUnit('\u6211\u7231\u4f60\u3002', 'zh');
    expect(r.normalized.endsWith('\u3002')).toBe(false);
  });
});

describe('extractLineEndingUnit — Korean / KO', () => {
  it('extracts last space-delimited Hangul word', () => {
    const r = extractLineEndingUnit('\ub098\ub294 \ub108\ub97c \uc0ac\ub791\ud574', 'ko');
    expect(r.normalized).toBe('\uc0ac\ub791\ud574');
    expect(r.segmentationMode).toBe('space');
    expect(r.script).toBe('hangul');
  });
});

describe('extractLineEndingUnit — empty / edge cases', () => {
  it('returns empty normalized for empty line', () => {
    const r = extractLineEndingUnit('', 'fr');
    expect(r.normalized).toBe('');
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('handles single-word line', () => {
    const r = extractLineEndingUnit('amour', 'fr');
    expect(r.normalized).toBe('amour');
    expect(r.warnings).toHaveLength(0);
  });
});
