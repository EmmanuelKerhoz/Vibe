/**
 * Safe localStorage wrapper — never throws.
 * Returns true on success, false on QuotaExceededError or any other failure.
 */
export const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.warn(`[storage] localStorage quota exceeded for key: ${key}`);
    } else {
      console.error(`[storage] localStorage.setItem failed for key: ${key}`, e);
    }
    return false;
  }
};

export const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // silent
  }
};
