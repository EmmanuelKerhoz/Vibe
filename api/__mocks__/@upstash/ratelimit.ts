/**
 * Manual stub for @upstash/ratelimit.
 * Vitest resolves manual mocks relative to the file under test.
 * Place: api/__mocks__/@upstash/ratelimit.ts
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
