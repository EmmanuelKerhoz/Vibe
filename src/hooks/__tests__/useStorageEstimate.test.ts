import { describe, expect, it } from 'vitest';
import { formatStorageSize } from '../useStorageEstimate';

describe('formatStorageSize', () => {
  it('returns "0 B" for zero bytes', () => {
    expect(formatStorageSize(0)).toBe('0 B');
  });

  it('returns bytes for values under 1 KB', () => {
    expect(formatStorageSize(1)).toBe('1 B');
    expect(formatStorageSize(512)).toBe('512 B');
    expect(formatStorageSize(1023)).toBe('1023 B');
  });

  it('returns KB for values under 1 MB', () => {
    expect(formatStorageSize(1024)).toBe('1.0 KB');
    expect(formatStorageSize(5 * 1024)).toBe('5.0 KB');
    expect(formatStorageSize(512 * 1024)).toBe('512.0 KB');
  });

  it('returns MB for values under 1 GB', () => {
    expect(formatStorageSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatStorageSize(2 * 1024 * 1024)).toBe('2.0 MB');
    expect(formatStorageSize(10 * 1024 * 1024)).toBe('10.0 MB');
    expect(formatStorageSize(500 * 1024 * 1024)).toBe('500.0 MB');
  });

  it('returns GB for values >= 1 GB', () => {
    expect(formatStorageSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    expect(formatStorageSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
  });
});
