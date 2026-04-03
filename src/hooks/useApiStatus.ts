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

const fetchApiStatusWithTimeout = async (
  signal: AbortSignal,
): Promise<{ available?: boolean }> => {
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
        .then(r => r.json() as Promise<{ available?: boolean }>)
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
          setHasApiKey(data.available === true);
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
