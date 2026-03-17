// ---------------------------------------------------------------------------
// withRetry.ts
// ---------------------------------------------------------------------------
// Retries a thunk on transient network errors (not abort, not 4xx quota).
// ---------------------------------------------------------------------------

import { isAbortError } from './withAbort';

const isQuotaError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: unknown; message?: string };
  return (
    e.code === 429 ||
    e.code === 'RESOURCE_EXHAUSTED' ||
    (typeof e.message === 'string' && (e.message.includes('429') || e.message.includes('quota')))
  );
};

const isRetryable = (err: unknown): boolean =>
  !isAbortError(err) && !isQuotaError(err);

export interface RetryOptions {
  maxAttempts?: number; // default 2
  delayMs?: number;     // initial delay, doubles each attempt
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 2, delayMs = 800 }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === maxAttempts) throw err;
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastError;
}
