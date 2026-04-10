/**
 * detectLanguage.test.ts
 * Unit tests for the two-stage LID pipeline.
 *
 * Coverage:
 *   - Stage 1: script detection (Cyrillic, Arabic, CJK, Devanagari, Thai, Hangul)
 *   - Stage 2: word-pilot detection (fr, en, es, de, it, pt, sw)
 *   - KWA languages: ba, ew, mi, di — collision-safe pilot sentences
 *   - Edge cases: empty string, single word, short text, fallback
 *   - resolveLang() helper
 */

import { describe, it, expect } from 'vitest';
import { detectLanguage, resolveLang, DEFAULT_LANG } from './detectLanguage';

// ─── Stage 1: Script detection ───────────────────────────────────────────────

describe('detectLanguage — Stage 1: script', () => {
  it('detects Cyrillic as Russian', () => {
    expect(detectLanguage('Привет мир')).toBe('ru');
  });

  it('detects Arabic script', () => {
    expect(detectLanguage('مرحبا بالعالم')).toBe('ar');
  });

  it('detects Devanagari as Hindi', () => {
    expect(detectLanguage('नमस्ते दुनिया')).toBe('hi');
  });

  it('detects Hangul as Korean', () => {
    expect(detectLanguage('안녕하세요 세계')).toBe('ko');
  });

  it('detects Hiragana as Japanese', () => {
    expect(detectLanguage('こんにちは世界')).toBe('ja');
  });

  it('detects CJK ideographs as Chinese', () => {
    expect(detectLanguage('你好世界')).toBe('zh');
  });

  it('detects Thai script', () => {
    expect(detectLanguage('สวัสดีชาวโลก')).toBe('th');
  });
});

// ─── Stage 2: Word-pilot detection ───────────────────────────────────────────

describe('detectLanguage — Stage 2: word pilots', () => {
  it('detects French', () => {
    const result = detectLanguage('je suis dans la nuit avec toi pour toujours');
    expect(result).toBe('fr');
  });

  it('detects English', () => {
    const result = detectLanguage('the night and the stars will guide you home');
    expect(result).toBe('en');
  });

  it('detects Spanish', () => {
    const result = detectLanguage('todo lo que tengo para ti es amor también');
    expect(result).toBe('es');
  });

  it('detects German', () => {
    const result = detectLanguage('ich liebe dich und die Nacht ist schön');
    expect(result).toBe('de');
  });

  it('detects Italian', () => {
    const result = detectLanguage('questo è il mio cuore che batte per te');
    expect(result).toBe('it');
  });

  it('detects Portuguese', () => {
    const result = detectLanguage('tudo que eu tenho para você também é amor');
    expect(result).toBe('pt');
  });

  it('detects Swahili', () => {
    const result = detectLanguage('na wewe ni mwenzangu kwa sana pia');
    expect(result).toBe('sw');
  });

  it('detects Indonesian', () => {
    const result = detectLanguage('yang dan ini itu dari dengan untuk tidak');
    expect(result).toBe('id');
  });
});

// ─── Stage 2: KWA languages ───────────────────────────────────────────────────
//
// Pilot sentences are built around tokens that carry diacritics or are
// structurally exclusive to the target language, avoiding short ambiguous
// tokens ('a', 'wa', 'ka') that collide with sw/di/ha pilots.
//
// Scoring floor: ≥ +8 for the target, ≤ +2 for the nearest competitor.

describe('detectLanguage — KWA languages', () => {
  it('detects Baoulé (ba) — collision-safe via diacritic-exclusive pilots', () => {
    // blɔ +2, nguɛ +2, yapi +2, klo +2, kun +2 = ba:+10 — sw:'wa' +2 at most
    const result = detectLanguage('blɔ nguɛ yapi klo kun man tra be');
    expect(result).toBe('ba');
  });

  it('detects Ewe (ew) — exclusive diacritic pilots', () => {
    // nuɖoviwo +2, eye +2, hafi +2, megbe +2, kple +2 = ew:+10
    const result = detectLanguage('nuɖoviwo eye hafi megbe kple ne loo');
    expect(result).toBe('ew');
  });

  it('detects Mina/Gengèbé (mi) — exclusive pilots', () => {
    // nyi +2, amaa +2, bɔ +2, kɔ +2, lɔ +2 = mi:+10
    const result = detectLanguage('nyi amaa bɔ kɔ lɔ mo ye mi');
    expect(result).toBe('mi');
  });

  it('detects Dioula (di) — exclusive pilots avoiding ha collision', () => {
    // bɛ +2, tun +2, mogo +2, kama +2, folo +2, minnu +2 = di:+12
    // 'don' intentionally excluded to avoid ha:+2 collision
    const result = detectLanguage('bɛ tun mogo kama folo minnu bi ko');
    expect(result).toBe('di');
  });

  it('does not confuse Dioula with Hausa on shared token "don"', () => {
    // Even with 'don' present, di-exclusive tokens must dominate
    const result = detectLanguage('bɛ tun mogo kama folo don bi');
    expect(result).toBe('di');
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('detectLanguage — edge cases', () => {
  it('returns DEFAULT_LANG for empty string', () => {
    expect(detectLanguage('')).toBe(DEFAULT_LANG);
  });

  it('returns DEFAULT_LANG for whitespace-only string', () => {
    expect(detectLanguage('   ')).toBe(DEFAULT_LANG);
  });

  it('returns DEFAULT_LANG for single token below MIN_TOKENS', () => {
    expect(detectLanguage('bonjour')).toBe(DEFAULT_LANG);
  });

  it('returns DEFAULT_LANG for ambiguous short Latin text', () => {
    // Only punctuation / numbers — no pilots fire
    expect(detectLanguage('... 123 ???')).toBe(DEFAULT_LANG);
  });

  it('prefers French on tie with DEFAULT_LANG advantage', () => {
    // Text with mixed fr/en pilots — fr should win via tie-break
    const result = detectLanguage('je avec sur dans the and that');
    expect(result).toBe('fr');
  });
});

// ─── resolveLang() ────────────────────────────────────────────────────────────

describe('resolveLang', () => {
  it('passes through explicit lang code unchanged', () => {
    expect(resolveLang('bonjour le monde avec toi', 'en')).toBe('en');
  });

  it('detects language when lang is "auto"', () => {
    const result = resolveLang('je suis dans la nuit avec toi pour toujours', 'auto');
    expect(result).toBe('fr');
  });

  it('detects Arabic when lang is "auto" and text is Arabic script', () => {
    const result = resolveLang('مرحبا بالعالم', 'auto');
    expect(result).toBe('ar');
  });
});
