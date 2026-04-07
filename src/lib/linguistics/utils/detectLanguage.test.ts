/**
 * detectLanguage.test.ts
 * Unit tests covering all three detection phases.
 */

import { describe, it, expect } from 'vitest';
import { detectLanguage } from './detectLanguage';

// ─── Phase 1: script ─────────────────────────────────────────────────────────

describe('detectLanguage — script', () => {
  it('detects Chinese (Han)', () => {
    const r = detectLanguage('我想唱歌在雨中');
    expect(r.lang).toBe('zh');
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('detects Japanese (Kana)', () => {
    const r = detectLanguage('愛してるよって言って');
    expect(r.lang).toBe('ja');
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('detects Korean (Hangul)', () => {
    const r = detectLanguage('사랑해요 저는 당신이 좋아요');
    expect(r.lang).toBe('ko');
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('detects Arabic', () => {
    const r = detectLanguage('أريد أن أغني تحت المطر');
    expect(r.lang).toBe('ar');
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('detects Russian (Cyrillic)', () => {
    const r = detectLanguage('я хочу петь под дождём');
    expect(r.lang).toBe('ru');
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
  });
});

// ─── Phase 2+3: Latin scripts ────────────────────────────────────────────────

describe('detectLanguage — French', () => {
  it('detects French lyrics with diacritics', () => {
    const r = detectLanguage('Je veux danser sous la pluie et chanter avec toi ce soir');
    expect(r.lang).toBe('fr');
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  it('detects French with accented chars', () => {
    const r = detectLanguage('L’été est beau, j’aime les nuits où le vent souffle doucement');
    expect(r.lang).toBe('fr');
  });

  it('detects French oe ligature', () => {
    const r = detectLanguage('Le cœur qui bat à tout rompre, l’âme brisée');
    expect(r.lang).toBe('fr');
  });
});

describe('detectLanguage — Spanish', () => {
  it('detects Spanish via ñ and stopwords', () => {
    const r = detectLanguage('Yo quiero bailar contigo esta noche bajo las estrellas');
    expect(r.lang).toBe('es');
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  it('detects Spanish inverted punctuation', () => {
    const r = detectLanguage('¿Cómo te llamas? ¿Dónde estás?');
    expect(r.lang).toBe('es');
  });
});

describe('detectLanguage — English', () => {
  it('detects English stopwords', () => {
    const r = detectLanguage('I want to dance in the rain and sing with you tonight');
    expect(r.lang).toBe('en');
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  it('detects English rap snippet', () => {
    const r = detectLanguage('I got the flow and you know that I will never stop the grind');
    expect(r.lang).toBe('en');
  });
});

describe('detectLanguage — Portuguese', () => {
  it('detects Portuguese via ão/õ', () => {
    const r = detectLanguage('Quero dançar contigo esta noite sobão as estrelas');
    expect(r.lang).toBe('pt');
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('detectLanguage — edge cases', () => {
  it('returns und for empty string', () => {
    expect(detectLanguage('').lang).toBe('und');
  });

  it('returns und for very short input', () => {
    expect(detectLanguage('ok').lang).toBe('und');
  });

  it('returns und for pure numbers/punctuation', () => {
    expect(detectLanguage('123 ??? !!!').lang).toBe('und');
  });

  it('returns candidates array with at least 1 entry when detected', () => {
    const r = detectLanguage('Je chante pour toi ce soir');
    expect(r.candidates.length).toBeGreaterThan(0);
    expect(r.candidates[0].lang).toBe('fr');
  });

  it('confidence is between 0 and 1', () => {
    const r = detectLanguage('Hello world this is a test sentence');
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });
});
