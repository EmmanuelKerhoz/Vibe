/**
 * Shared in-memory sliding-window rate limiter for Vercel serverless functions.
 *
 * Limits are per-IP. The Map is module-level: it persists across requests
 * within the same warm function instance, which is the intended behaviour.
 *
 * ⚠️  State is NOT shared across multiple warm instances — rate limiting is
 * per-instance. This is acceptable for the current traffic profile but means
 * the effective limit is MAX × (number of warm instances).
 *
 * Env overrides (optional):
 *   RATE_LIMIT_MAX         — max requests per window   (default: 20)
 *   RATE_LIMIT_WINDOW_MS   — window size in ms         (default: 60_000)
 */

const DEFAULT_MAX = 20;
const DEFAULT_WINDOW_MS = 60_000;

/** Maximum length (chars) accepted for a resolved IP string. Covers IPv6 (45). */
const MAX_IP_LENGTH = 45;

const MAX = (() => {
  const v = parseInt(process.env.RATE_LIMIT_MAX ?? '', 10);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_MAX;
})();

const WINDOW_MS = (() => {
  const v = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '', 10);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_WINDOW_MS;
})();

/** Timestamps of recent requests, keyed by resolved IP. */
const buckets = new Map<string, number[]>();

/**
 * Check whether the given IP is within the rate limit.
 * Mutates the bucket (records this request).
 * Empty buckets are evicted to prevent unbounded Map growth.
 *
 * @returns `{ allowed: true }` or `{ allowed: false, retryAfterSec: number }`
 */
export function checkRateLimit(
  ip: string
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  // Retrieve or create bucket, prune stale entries.
  const timestamps = (buckets.get(ip) ?? []).filter(t => t > cutoff);

  if (timestamps.length === 0) {
    // Evict empty bucket — no stale entry to keep.
    buckets.delete(ip);
  }

  if (timestamps.length >= MAX) {
    // Oldest timestamp in the current window; client may retry once it expires.
    const oldest = timestamps[0]!;
    const retryAfterMs = oldest + WINDOW_MS - now;
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    buckets.set(ip, timestamps);
    return { allowed: false, retryAfterSec };
  }

  timestamps.push(now);
  buckets.set(ip, timestamps);
  return { allowed: true };
}

/**
 * Resolve the client IP from a Vercel/Node request.
 * Priority: x-forwarded-for (set by Vercel edge) > socket.remoteAddress > 'unknown'
 *
 * The resolved value is truncated to MAX_IP_LENGTH chars to prevent
 * oversized strings from being used as Map keys (x-forwarded-for is
 * client-controlled and could contain arbitrary content).
 */
export function resolveIp(
  headers: Record<string, string | string[] | undefined>,
  socketAddress?: string
): string {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    if (first) return first.trim().slice(0, MAX_IP_LENGTH);
  }
  return (socketAddress?.trim() ?? 'unknown').slice(0, MAX_IP_LENGTH);
}
