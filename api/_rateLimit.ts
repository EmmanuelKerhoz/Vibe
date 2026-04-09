/**
 * Shared sliding-window rate limiter for Vercel serverless functions.
 *
 * Strategy (layered, fail-open):
 *   1. If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set,
 *      use @upstash/ratelimit (distributed, shared across all instances).
 *   2. Otherwise fall back to the in-memory Map (original behaviour,
 *      acceptable for low-traffic deployments).
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

// ─── In-memory fallback ───────────────────────────────────────────────────────

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

// ─── Distributed path (Upstash) ──────────────────────────────────────────────

/**
 * Attempt a distributed rate-limit check via Upstash Redis.
 * Returns null when the KV store is not configured or unreachable
 * (fail-open: caller falls back to in-memory).
 */
async function tryDistributedRateLimit(
  ip: string,
): Promise<{ allowed: true } | { allowed: false; retryAfterSec: number } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    // Dynamic import so the package is only resolved when env vars are present.
    // Avoids a hard dependency for deployments that don't use Upstash.
    const [{ Ratelimit }, { Redis }] = await Promise.all([
      import('@upstash/ratelimit') as Promise<typeof import('@upstash/ratelimit')>,
      import('@upstash/redis') as Promise<typeof import('@upstash/redis')>,
    ]);

    const ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(MAX, `${Math.round(WINDOW_MS / 1000)} s`),
      analytics: false,
      prefix: 'vibe_rl',
    });

    const { success, reset } = await ratelimit.limit(ip);
    if (success) return { allowed: true };
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { allowed: false, retryAfterSec };
  } catch (err) {
    // Fail-open: log and fall through to in-memory.
    console.warn('[rateLimit] Upstash unavailable, falling back to in-memory:', err);
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

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
