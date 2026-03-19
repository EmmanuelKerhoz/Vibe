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
  tier: 'green', usageMB: '0', quotaMB: '0', libraryUsage: 0, libraryUsageMB: '0', supported: false,
};

function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0';
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
      setEstimate({
        ...INITIAL,
        ...libraryEstimate,
        supported: false,
      });
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
      setEstimate({
        ...INITIAL,
        ...libraryEstimate,
        supported: false,
      });
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { ...estimate, refresh };
}
