/**
 * detectLanguage.test.ts
 * Unit tests for the two-stage LID pipeline.
 *
 * Coverage:
 *   - Stage 1: script detection (Cyrillic, Arabic, CJK, Devanagari, Thai, Hangul)
 *   - Stage 2: word-pilot detection (fr, en, es, de, it, pt, sw)
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
