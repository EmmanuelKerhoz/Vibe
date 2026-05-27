/**
 * PickStrategy.ts — Strategy interface for cloud storage providers.
 * Each provider implements this interface.
 */

import type { CloudFile, PickMode } from '../cloudStorage';

export interface PickStrategy {
  pick(mode: PickMode, signal?: AbortSignal): Promise<CloudFile | null>;
}

export type { CloudFile, PickMode };
