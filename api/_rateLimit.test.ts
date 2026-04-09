import { describe, it, expect, beforeEach, vi } from 'vitest';

// We test the module in isolation by resetting module state between tests.
// The buckets Map is module-level, so we re-import after vi.resetModules().

describe('resolveIp', () => {
  it('returns first x-forwarded-for entry', async () => {
    const { resolveIp } = await import('./_rateLimit');
    expect(resolveIp({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })).toBe('1.2.3.4');
  });

  it('returns first of array x-forwarded-for', async () => {
    const { resolveIp } = await import('./_rateLimit');
    expect(resolveIp({ 'x-forwarded-for': ['9.9.9.9', '8.8.8.8'] })).toBe('9.9.9.9');
  });

  it('falls back to socketAddress', async () => {
    const { resolveIp } = await import('./_rateLimit');
    expect(resolveIp({}, '127.0.0.1')).toBe('127.0.0.1');
  });

  it('returns unknown when no IP available', async () => {
    const { resolveIp } = await import('./_rateLimit');
    expect(resolveIp({})).toBe('unknown');
  });
});

describe('checkRateLimit — sliding window', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  it('allows requests up to MAX within window', async () => {
    const { checkRateLimit } = await import('./_rateLimit');
    for (let i = 0; i < 20; i++) {
      expect(checkRateLimit('ip-a').allowed).toBe(true);
    }
  });

  it('blocks the 21st request', async () => {
    const { checkRateLimit } = await import('./_rateLimit');
    for (let i = 0; i < 20; i++) checkRateLimit('ip-b');
    const result = checkRateLimit('ip-b');
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it('allows again after window expires', async () => {
    const { checkRateLimit } = await import('./_rateLimit');
    for (let i = 0; i < 20; i++) checkRateLimit('ip-c');
    vi.advanceTimersByTime(61_000);
    expect(checkRateLimit('ip-c').allowed).toBe(true);
  });

  it('isolates buckets per IP', async () => {
    const { checkRateLimit } = await import('./_rateLimit');
    for (let i = 0; i < 20; i++) checkRateLimit('ip-x');
    expect(checkRateLimit('ip-y').allowed).toBe(true);
  });
});
