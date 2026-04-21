import { describe, expect, it } from 'vitest';
import { redactExcerpt } from '../utils/textHashes';

describe('redactExcerpt', () => {
  it('returns the input compacted when within bounds', () => {
    expect(redactExcerpt('  hello   world  ', 80)).toBe('hello world');
  });

  it('truncates with an ellipsis when exceeding maxChars', () => {
    const out = redactExcerpt('a'.repeat(200), 50);
    expect(out.length).toBe(50);
    expect(out.endsWith('…')).toBe(true);
  });

  it('returns empty string for non-positive maxChars', () => {
    expect(redactExcerpt('abc', 0)).toBe('');
  });
});
