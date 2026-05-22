export type TrackSource = 'cloud' | 'local' | 'lyria';

export interface TrackEntry {
  id: string;
  title: string;
  source: TrackSource;
  url: string;
  memo?: string;
  linked?: boolean;
  /** True when the file is a video container (mp4/webm/mov/mkv) */
  isVideo?: boolean;
}

export interface ScanConfig {
  accept: 'wav' | 'mp3' | 'm4a' | 'mp4' | 'all';
  pattern: string;
}
