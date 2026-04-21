import { describe, expect, it } from 'vitest';
import { buildSemanticChunks, normalizeLyrics } from '../utils/normalizeLyrics';

describe('normalizeLyrics', () => {
  it('preserves line boundaries', () => {
    const out = normalizeLyrics('First line\nSecond line\nThird line');
    expect(out.lines).toEqual(['First line', 'Second line', 'Third line']);
    expect(out.lineTokens).toHaveLength(3);
  });

  it('strips diacritics and lowercases by default', () => {
    const out = normalizeLyrics('Café Au Lait');
    expect(out.lineTokens[0]).toEqual(['cafe', 'au', 'lait']);
  });

  it('removes stopwords for known languages', () => {
    const out = normalizeLyrics('the rain falls on the city', { language: 'en' });
    expect(out.tokens).toEqual(['rain', 'falls', 'city']);
  });

  it('keeps unknown-language tokens intact (no stopword filtering)', () => {
    const out = normalizeLyrics('the rain falls', { language: 'xx' });
    expect(out.tokens).toEqual(['the', 'rain', 'falls']);
  });

  it('trims leading/trailing empty lines but keeps interior empties', () => {
    const out = normalizeLyrics('\n\nfirst\n\nsecond\n\n');
    expect(out.lines).toEqual(['first', '', 'second']);
  });

  it('does not collapse repeated lyrical structure (chorus stays repeated)', () => {
    const text = 'shine on me\nshine on me\nshine on me';
    const out = normalizeLyrics(text, { language: 'en' });
    expect(out.lines).toHaveLength(3);
    expect(out.lines[0]).toBe(out.lines[1]);
  });

  it('builds semantic chunks of the requested size', () => {
    const lines = ['a', 'b', 'c', 'd', 'e'];
    const chunks = buildSemanticChunks(lines, 2);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toMatchObject({ startLine: 0, endLine: 1 });
    expect(chunks[2]).toMatchObject({ startLine: 4, endLine: 4 });
  });
});
