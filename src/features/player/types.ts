export type TrackSource = 'cloud' | 'local' | 'lyria';

export interface TrackEntry {
  id: string;
  title: string;
  source: TrackSource;
  url: string;
  memo?: string;
  linked?: boolean;
}

export interface ScanConfig {
  accept: 'wav' | 'mp3' | 'm4a' | 'mp4' | 'all';
  pattern: string;
}
