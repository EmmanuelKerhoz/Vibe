/**
 * Safe localStorage helpers — handle QuotaExceededError and private browsing
 * silently so the app never crashes on storage operations.
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
    console.warn(`[safeStorage] Could not persist "${key}":`, e);
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
