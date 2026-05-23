/**
 * Shared sliding-window rate limiter for Vercel serverless functions.
 *
 * Strategy (layered, fail-open):
 *   1. If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set,
 *      use the Upstash Redis REST API directly (no package dependency).
 *   2. Otherwise fall back to the in-memory Map.
 *
 * checkRateLimit() and resolveIp() public interfaces are unchanged.
 *
 * Env:
 *   RATE_LIMIT_MAX             — max requests per window (default: 20)
 *   RATE_LIMIT_WINDOW_MS       — window in ms           (default: 60_000)
 *   UPSTASH_REDIS_REST_URL     — Upstash Redis REST URL  (optional)
 *   UPSTASH_REDIS_REST_TOKEN   — Upstash Redis REST token (optional)
 */

const DEFAULT_MAX = 20;
const DEFAULT_WINDOW_MS = 60_000;
const MAX_IP_LENGTH = 45;

const MAX = (() => {
  const v = parseInt(process.env.RATE_LIMIT_MAX ?? '', 10);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_MAX;
})();

const WINDOW_MS = (() => {
  const v = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '', 10);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_WINDOW_MS;
})();

// ─── In-memory fallback ────────────────────────────────────────────────────────────────────

const buckets = new Map<string, number[]>();

function inMemoryCheck(
  ip: string,
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const timestamps = (buckets.get(ip) ?? []).filter(t => t > cutoff);

  if (timestamps.length === 0) buckets.delete(ip);

  if (timestamps.length >= MAX) {
    const oldest = timestamps[0]!;
    const retryAfterSec = Math.ceil((oldest + WINDOW_MS - now) / 1000);
    buckets.set(ip, timestamps);
    return { allowed: false, retryAfterSec };
  }

  timestamps.push(now);
  buckets.set(ip, timestamps);
  return { allowed: true };
}

// ─── Distributed path (Upstash REST — no package dependency) ─────────────────

/**
 * Sliding-window rate limit via Upstash Redis REST API.
 * Uses MULTI/EXEC pipeline: ZADD + ZREMRANGEBYSCORE + ZCARD + EXPIRE.
 * Returns null when env vars are absent or the request fails (fail-open).
 */
async function tryDistributedRateLimit(
  ip: string,
): Promise<{ allowed: true } | { allowed: false; retryAfterSec: number } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    const key = `vibe_rl:${ip}`;
    const expireSec = Math.ceil(WINDOW_MS / 1000);

    // Pipeline: [ZADD key now now] [ZREMRANGEBYSCORE key 0 windowStart] [ZCARD key] [EXPIRE key expireSec]
    const pipeline = [
      ['ZADD', key, String(now), String(now)],
      ['ZREMRANGEBYSCORE', key, '0', String(windowStart)],
      ['ZCARD', key],
      ['EXPIRE', key, String(expireSec)],
    ];

    const resp = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipeline),
      signal: AbortSignal.timeout(3_000),
    });

    if (!resp.ok) {
      console.warn('[rateLimit] Upstash REST error', resp.status, '— falling back to in-memory');
      return null;
    }

    // Response shape: [{result:…}, {result:…}, {result: <count>}, {result:…}]
    const results = await resp.json() as Array<{ result: unknown }>;
    const count = results[2]?.result;

    if (typeof count !== 'number') {
      console.warn('[rateLimit] Unexpected Upstash response shape — falling back to in-memory');
      return null;
    }

    if (count > MAX) {
      // Conservative retry: suggest one full window
      const retryAfterSec = Math.ceil(WINDOW_MS / 1000);
      return { allowed: false, retryAfterSec };
    }

    return { allowed: true };
  } catch (err) {
    console.warn('[rateLimit] Upstash fetch failed, falling back to in-memory:', err);
    return null;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────────────

export async function checkRateLimit(
  ip: string,
): Promise<{ allowed: true } | { allowed: false; retryAfterSec: number }> {
  const distributed = await tryDistributedRateLimit(ip);
  if (distributed !== null) return distributed;
  return inMemoryCheck(ip);
}

export function resolveIp(
  headers: Record<string, string | string[] | undefined>,
  socketAddress?: string,
): string {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    if (first) return first.trim().slice(0, MAX_IP_LENGTH);
  }
  return (socketAddress?.trim() ?? 'unknown').slice(0, MAX_IP_LENGTH);
}
