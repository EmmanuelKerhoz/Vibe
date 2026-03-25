/**
 * @status active — intégré dans StorageGauge (StatusBar) et SaveToLibraryModal.
 */
import { useState, useEffect, useCallback } from 'react';
import { safeGetItem } from '../utils/safeStorage';

export type StorageTier = 'green' | 'orange' | 'red';
const LIBRARY_STORAGE_KEY = 'lyricist_library';

export interface StorageEstimate {
  usage: number;      // total browser storage bytes used
  quota: number;      // total browser storage bytes available
  ratio: number;      // 0–1 browser storage saturation
  tier: StorageTier;
  usageMB: string;
  quotaMB: string;
  libraryUsage: number;
  libraryUsageMB: string;
  supported: boolean;
}

const INITIAL: StorageEstimate = {
  usage: 0, quota: 0, ratio: 0,
  tier: 'green', usageMB: '0 B', quotaMB: '0 B', libraryUsage: 0, libraryUsageMB: '0 B', supported: false,
};

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = 1024 * 1024;
const BYTES_PER_GB = 1024 * 1024 * 1024;

export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < BYTES_PER_KB) return bytes + ' B';
  if (bytes < BYTES_PER_MB) return (bytes / BYTES_PER_KB).toFixed(1) + ' KB';
  if (bytes >= BYTES_PER_GB) return (bytes / BYTES_PER_GB).toFixed(1) + ' GB';
  return (bytes / BYTES_PER_MB).toFixed(1) + ' MB';
}

function computeTier(ratio: number): StorageTier {
  if (ratio >= 0.8) return 'red';
  if (ratio >= 0.5) return 'orange';
  return 'green';
}

function getLibraryStorageUsage(): Pick<StorageEstimate, 'libraryUsage' | 'libraryUsageMB'> {
  const raw = safeGetItem(LIBRARY_STORAGE_KEY);
  const libraryUsage = raw ? new Blob([raw]).size : 0;
  return {
    libraryUsage,
    libraryUsageMB: formatStorageSize(libraryUsage),
  };
}

export function useStorageEstimate(intervalMs = 30_000): StorageEstimate & { refresh: () => void } {
  const [estimate, setEstimate] = useState<StorageEstimate>(INITIAL);

  const refresh = useCallback(async () => {
    const libraryEstimate = getLibraryStorageUsage();
    if (!navigator?.storage?.estimate) {
      setEstimate(prev => ({
        ...prev,
        ...libraryEstimate,
        supported: false,
      }));
      return;
    }
    try {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const ratio = quota > 0 ? usage / quota : 0;
      setEstimate({
        usage, quota, ratio,
        tier: computeTier(ratio),
        usageMB: formatStorageSize(usage),
        quotaMB: formatStorageSize(quota),
        ...libraryEstimate,
        supported: true,
      });
    } catch {
      setEstimate(prev => ({
        ...prev,
        ...libraryEstimate,
        supported: false,
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  // Re-refresh library size whenever lyricist_library is written
  // (same tab via storage event polyfill, or cross-tab via native storage event)
  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === null || e.key === LIBRARY_STORAGE_KEY) {
        refresh();
      }
    };
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, [refresh]);

  return { ...estimate, refresh };
}
