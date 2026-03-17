// ---------------------------------------------------------------------------
// withAbort.ts
// ---------------------------------------------------------------------------
// Wraps an async operation with a shared AbortController ref.
// Aborts the previous call before starting a new one.
// Passes the signal to the operation so the underlying fetch can honour it.
// ---------------------------------------------------------------------------

import type { MutableRefObject } from 'react';

export type AbortableOperation<T> = (signal: AbortSignal) => Promise<T>;

/**
 * Abort previous call, create a fresh controller, run operation.
 * Returns the result or throws — caller decides final/cleanup.
 */
export async function withAbort<T>(
  ref: MutableRefObject<AbortController | null>,
  operation: AbortableOperation<T>,
): Promise<T> {
  ref.current?.abort();
  const controller = new AbortController();
  ref.current = controller;
  return operation(controller.signal);
}

/** True if the error is an intentional abort */
export const isAbortError = (err: unknown): boolean =>
  err instanceof DOMException && err.name === 'AbortError';
