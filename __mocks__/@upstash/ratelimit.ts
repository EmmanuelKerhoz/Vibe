/**
 * Manual stub for @upstash/ratelimit.
 * Used by Vitest when resolving vi.mock('@upstash/ratelimit').
 * Exposes the minimal API surface exercised by _rateLimit.test.ts.
 */
export class Ratelimit {
  constructor(_opts: unknown) {}

  static slidingWindow(_max: number, _window: string) {
    return { type: 'slidingWindow' };
  }

  async limit(_identifier: string): Promise<{ success: boolean; reset: number }> {
    return { success: true, reset: Date.now() + 60_000 };
  }
}
