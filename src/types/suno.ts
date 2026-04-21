/**
 * Suno domain types — service, hook, and KPI surface.
 */

export type SunoModel =
  | 'chirp-v3-5'
  | 'chirp-v4'
  | 'chirp-v4-5'
  | 'chirp-v5';

export type SunoSongStatus =
  | 'submitted'
  | 'queued'
  | 'streaming'
  | 'complete'
  | 'error';

export interface SunoSong {
  id: string;
  title: string;
  status: SunoSongStatus;
  /** Public CDN URL — available once status === 'complete' */
  audio_url: string | null;
  image_url: string | null;
  lyric: string | null;
  video_url: string | null;
  created_at: string;
  model_name: SunoModel | string;
  prompt: string;
  style: string | null;
  duration: number | null;
}

export interface SunoGenerateParams {
  /** Natural-language or structured lyrics/description */
  prompt: string;
  /** Genre/style tags (e.g. "afrobeats, highlife, male vocal") */
  style?: string;
  title?: string;
  customMode?: boolean;
  instrumental?: boolean;
  model?: SunoModel;
}

export type SunoTaskStatus =
  | { phase: 'idle' }
  | { phase: 'generating'; ids: string[] }
  | { phase: 'polling'; ids: string[]; elapsed: number }
  | { phase: 'done'; songs: SunoSong[] }
  | { phase: 'error'; message: string };

/** KPI snapshot exposed in the UI */
export interface SunoKPISnapshot {
  /** DEV = gcui-art cookie | PROD = EvoLink */
  mode: 'dev' | 'prod';
  totalRequests: number;
  successCount: number;
  errorCount: number;
  /** Currently in-flight requests */
  pendingCount: number;
  /** Round-trip of the last successful call in ms */
  lastGenerationMs: number | null;
  /** Last error message, null if last call succeeded */
  lastError: string | null;
}
