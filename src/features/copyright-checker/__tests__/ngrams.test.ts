import { describe, expect, it } from 'vitest';
import {
  documentNGramSet, lineNGrams, longestCommonContiguous, tokenNGrams,
} from '../utils/ngrams';

describe('ngrams', () => {
  it('returns [] for n larger than tokens', () => {
    expect(tokenNGrams(['a', 'b'], 3)).toEqual([]);
  });

  it('builds correct trigrams', () => {
    const ngs = tokenNGrams(['a', 'b', 'c', 'd'], 3);
    expect(ngs).toHaveLength(2);
  });

  it('lineNGrams keeps line + token coordinates', () => {
    const ng = lineNGrams([['a', 'b', 'c'], ['d', 'e', 'f']], 2);
    expect(ng).toHaveLength(4);
    expect(ng[0]).toMatchObject({ lineIndex: 0, tokenStart: 0 });
    expect(ng[3]).toMatchObject({ lineIndex: 1, tokenStart: 1 });
  });

  it('documentNGramSet merges sizes with size prefix', () => {
    const set = documentNGramSet(['a', 'b', 'c'], [2, 3]);
    expect(set.size).toBeGreaterThan(0);
    for (const k of set) expect(k).toMatch(/^[23]\|/);
  });

  it('longestCommonContiguous finds longest exact run', () => {
    const a = ['x', 'a', 'b', 'c', 'd', 'y'];
    const b = ['p', 'a', 'b', 'c', 'q'];
    const lcs = longestCommonContiguous(a, b);
    expect(lcs.length).toBe(3);
    expect(a.slice(lcs.aStart, lcs.aStart + lcs.length)).toEqual(['a', 'b', 'c']);
    expect(b.slice(lcs.bStart, lcs.bStart + lcs.length)).toEqual(['a', 'b', 'c']);
  });

  it('longestCommonContiguous returns 0 when disjoint', () => {
    expect(longestCommonContiguous(['a'], ['b']).length).toBe(0);
  });
});
