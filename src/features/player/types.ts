/** VoxNova Player — domain types */

export type TrackSource = 'cloud' | 'local' | 'lyria';

export interface TrackEntry {
  id: string;
  title: string;
  source: TrackSource;
  /** Blob URL (local/lyria) or remote URL (cloud). Undefined = not yet linked. */
  url?: string;
  /** Duration in seconds, populated after load */
  duration?: number;
  memo: string;
  /** Blob URL still valid this session */
  linked: boolean;
}

export interface ScanConfig {
  accept: 'wav' | 'mp3' | 'all';
}
