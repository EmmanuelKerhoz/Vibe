import { describe, it, expect, beforeEach, vi } from 'vitest';

// Re-import after resetModules to get a fresh in-memory Map.

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

describe('checkRateLimit — in-memory sliding window (no Upstash)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    // Ensure Upstash env vars are absent so the in-memory path is exercised.
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('allows requests up to MAX within window', async () => {
    const { checkRateLimit } = await import('./_rateLimit');
    for (let i = 0; i < 20; i++) {
      expect((await checkRateLimit('ip-a')).allowed).toBe(true);
    }
  });

  it('blocks the 21st request', async () => {
    const { checkRateLimit } = await import('./_rateLimit');
    for (let i = 0; i < 20; i++) await checkRateLimit('ip-b');
    const result = await checkRateLimit('ip-b');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.retryAfterSec).toBeGreaterThan(0);
  });

  it('allows again after window expires', async () => {
    const { checkRateLimit } = await import('./_rateLimit');
    for (let i = 0; i < 20; i++) await checkRateLimit('ip-c');
    vi.advanceTimersByTime(61_000);
    expect((await checkRateLimit('ip-c')).allowed).toBe(true);
  });

  it('isolates buckets per IP', async () => {
    const { checkRateLimit } = await import('./_rateLimit');
    for (let i = 0; i < 20; i++) await checkRateLimit('ip-x');
    expect((await checkRateLimit('ip-y')).allowed).toBe(true);
  });
});

describe('checkRateLimit — fail-open when Upstash throws', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.restoreAllMocks();
  });

  it('falls back to in-memory when Upstash import fails', async () => {
    // Simulate broken Upstash package by mocking the dynamic import to reject.
    vi.mock('@upstash/ratelimit', () => { throw new Error('package unavailable'); });
    const { checkRateLimit } = await import('./_rateLimit');
    // Should still allow (in-memory, fresh bucket).
    expect((await checkRateLimit('ip-fallback')).allowed).toBe(true);
  });
});
