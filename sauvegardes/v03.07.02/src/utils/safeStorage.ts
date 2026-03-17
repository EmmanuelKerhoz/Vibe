/**
 * Unified safe localStorage helpers.
 * Handles QuotaExceededError, NS_ERROR_DOM_QUOTA_REACHED, and private-browsing
 * silently so the app never crashes on storage operations.
 *
 * Replaces both safeStorage.ts and storageUtils.ts — import from here only.
 */

export const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.warn(`[safeStorage] localStorage quota exceeded for key: "${key}"`);
    } else {
      console.warn(`[safeStorage] Could not persist "${key}":`, e);
    }
    return false;
  }
};

export const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // noop
  }
};

export const safeJsonGet = <T>(key: string): T | null => {
  const raw = safeGetItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const safeJsonSet = <T>(key: string, value: T): boolean =>
  safeSetItem(key, JSON.stringify(value));
