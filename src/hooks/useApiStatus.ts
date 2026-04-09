/**
 * useApiStatus
 *
 * Owns: hasApiKey resolution via /api/status with retry + AbortController cleanup.
 * Extracted from useSessionState (Phase-2 domain-hook split).
 */
import { useState, useEffect } from 'react';

const API_STATUS_RETRY_DELAYS_MS = [500, 1500];
const API_STATUS_TIMEOUT_MS = 5000;

const createAbortError = () => new DOMException('Aborted', 'AbortError');

const waitWithAbort = (delayMs: number, signal: AbortSignal): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(createAbortError());
      return;
    }
    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort);
      resolve();
    }, delayMs);
    const handleAbort = () => {
      window.clearTimeout(timeoutId);
      signal.removeEventListener('abort', handleAbort);
      reject(createAbortError());
    };
    signal.addEventListener('abort', handleAbort, { once: true });
  });

/**
 * Type-guard for the /api/status response shape.
 * Guards against malformed 200 responses (e.g. Nginx HTML error pages or
 * unexpected JSON shapes) that would cause r.json() to resolve to a non-object
 * or an object without the expected `available` boolean field.
 */
const parseApiStatusResponse = (raw: unknown): { available: boolean } => {
  if (
    raw !== null &&
    typeof raw === 'object' &&
    'available' in (raw as Record<string, unknown>)
  ) {
    return { available: (raw as Record<string, unknown>).available === true };
  }
  return { available: false };
};

const fetchApiStatusWithTimeout = async (
  signal: AbortSignal,
): Promise<{ available: boolean }> => {
  const attemptController = new AbortController();
  const abortAttempt = () => attemptController.abort();
  let timeoutId: number | undefined;

  if (signal.aborted) {
    attemptController.abort();
    throw createAbortError();
  }

  signal.addEventListener('abort', abortAttempt, { once: true });

  try {
    return await Promise.race([
      fetch('/api/status', { signal: attemptController.signal })
        .then(async (r) => {
          // Defensive: parse JSON safely, fall back to { available: false } on
          // parse error (e.g. HTML error page returned with 200 status).
          const raw: unknown = await r.json().catch(() => null);
          return parseApiStatusResponse(raw);
        })
        .finally(() => {
          if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        }),
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          signal.removeEventListener('abort', abortAttempt);
          attemptController.abort();
          reject(new Error('API status request timed out'));
        }, API_STATUS_TIMEOUT_MS);
        attemptController.signal.addEventListener('abort', () => {
          window.clearTimeout(timeoutId);
        }, { once: true });
      }),
    ]);
  } finally {
    signal.removeEventListener('abort', abortAttempt);
  }
};

export function useApiStatus() {
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadApiStatus = async () => {
      for (let attempt = 0; attempt <= API_STATUS_RETRY_DELAYS_MS.length; attempt += 1) {
        try {
          const data = await fetchApiStatusWithTimeout(controller.signal);
          setHasApiKey(data.available);
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          if (attempt === API_STATUS_RETRY_DELAYS_MS.length) {
            setHasApiKey(false);
            return;
          }
          const retryDelayMs = API_STATUS_RETRY_DELAYS_MS[attempt];
          if (retryDelayMs === undefined) {
            setHasApiKey(false);
            return;
          }
          try {
            await waitWithAbort(retryDelayMs, controller.signal);
          } catch (waitError) {
            if (waitError instanceof DOMException && waitError.name === 'AbortError') return;
            throw waitError;
          }
        }
      }
    };

    void loadApiStatus();
    return () => controller.abort();
  }, []);

  return { hasApiKey };
}
