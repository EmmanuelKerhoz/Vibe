import { useState, useEffect, useCallback } from 'react';

export type StorageTier = 'green' | 'orange' | 'red';

export interface StorageEstimate {
  usage: number;      // bytes used
  quota: number;      // bytes available
  ratio: number;      // 0–1
  tier: StorageTier;
  usageMB: string;
  quotaMB: string;
  supported: boolean;
}

const INITIAL: StorageEstimate = {
  usage: 0, quota: 0, ratio: 0,
  tier: 'green', usageMB: '0', quotaMB: '0', supported: false,
};

function toMB(bytes: number): string {
  if (bytes === 0) return '0';
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function computeTier(ratio: number): StorageTier {
  if (ratio >= 0.8) return 'red';
  if (ratio >= 0.5) return 'orange';
  return 'green';
}

export function useStorageEstimate(intervalMs = 30_000): StorageEstimate & { refresh: () => void } {
  const [estimate, setEstimate] = useState<StorageEstimate>(INITIAL);

  const refresh = useCallback(async () => {
    if (!navigator?.storage?.estimate) {
      setEstimate(prev => ({ ...prev, supported: false }));
      return;
    }
    try {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const ratio = quota > 0 ? usage / quota : 0;
      setEstimate({
        usage, quota, ratio,
        tier: computeTier(ratio),
        usageMB: toMB(usage),
        quotaMB: toMB(quota),
        supported: true,
      });
    } catch {
      // silently degrade
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { ...estimate, refresh };
}
