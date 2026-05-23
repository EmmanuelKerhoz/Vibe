/**
 * Spotify Web Playback SDK — global type declarations.
 * SDK loaded dynamically via <script> injection (no npm package needed).
 */

export interface SpotifyTrack {
  uri: string;
  id: string | null;
  type: 'track' | 'episode' | 'ad';
  media_type: 'audio' | 'video';
  name: string;
  is_playable: boolean;
  album: {
    uri: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  artists: Array<{ uri: string; name: string }>;
  duration_ms: number;
}

export interface SpotifyWebPlaybackState {
  context: {
    uri: string | null;
    metadata: Record<string, unknown> | null;
  };
  disallows: {
    pausing?: boolean;
    peeking_next?: boolean;
    peeking_prev?: boolean;
    resuming?: boolean;
    seeking?: boolean;
    skipping_next?: boolean;
    skipping_prev?: boolean;
  };
  track_window: {
    current_track: SpotifyTrack;
    previous_tracks: SpotifyTrack[];
    next_tracks: SpotifyTrack[];
  };
  position: number;
  duration: number;
  paused: boolean;
  shuffle: boolean;
  repeat_mode: 0 | 1 | 2;
  timestamp: number;
  playback_id: string;
  playback_quality: string;
  playback_features: { hifi_status: string };
}

export interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: 'ready', cb: (data: { device_id: string }) => void): boolean;
  addListener(event: 'not_ready', cb: (data: { device_id: string }) => void): boolean;
  addListener(event: 'player_state_changed', cb: (state: SpotifyWebPlaybackState | null) => void): boolean;
  addListener(event: 'initialization_error', cb: (data: { message: string }) => void): boolean;
  addListener(event: 'authentication_error', cb: (data: { message: string }) => void): boolean;
  addListener(event: 'account_error', cb: (data: { message: string }) => void): boolean;
  removeListener(event: string): boolean;
  getCurrentState(): Promise<SpotifyWebPlaybackState | null>;
  setName(name: string): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(position_ms: number): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}
