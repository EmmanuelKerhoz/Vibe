/**
 * Safe localStorage wrapper — silently handles QuotaExceededError
 * and SecurityError (private browsing, iframe sandboxing).
 */
export const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`[storageUtils] Failed to write key "${key}" to localStorage:`, e);
    return false;
  }
};

export const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`[storageUtils] Failed to read key "${key}" from localStorage:`, e);
    return null;
  }
};

export const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`[storageUtils] Failed to remove key "${key}" from localStorage:`, e);
  }
};
