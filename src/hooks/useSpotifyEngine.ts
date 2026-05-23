import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SpotifyPlayerState,
  SpotifySDKPlayer,
  SpotifyPlaybackState,
  WebPlaybackError,
} from '../types/spotify';

// ---------------------------------------------------------------------------
// SDK script loader (idempotent)
// ---------------------------------------------------------------------------

let sdkReady = false;
let sdkReadyCallbacks: Array<() => void> = [];

if (typeof window !== 'undefined') {
  (window as Window & { onSpotifyWebPlaybackSDKReady?: () => void }).onSpotifyWebPlaybackSDKReady = () => {
    sdkReady = true;
    sdkReadyCallbacks.forEach(cb => cb());
    sdkReadyCallbacks = [];
  };
}

function loadSpotifySDK(): Promise<void> {
  return new Promise(resolve => {
    if (sdkReady) { resolve(); return; }
    sdkReadyCallbacks.push(resolve);
    if (!document.querySelector('script[src*="spotify-player"]')) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const DEVICE_NAME = 'Lyricist Player';
const VOLUME_DEFAULT = 0.7;

export interface UseSpotifyEngineOptions {
  /** Spotify access token. Pass null/undefined to skip initialization. */
  accessToken: string | null | undefined;
}

export interface SpotifyEngineControls {
  play: (uris: string[]) => Promise<void>;
  resume: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  setVolume: (fraction: number) => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
}

export interface UseSpotifyEngineResult {
  playerState: SpotifyPlayerState;
  playbackState: SpotifyPlaybackState | null;
  controls: SpotifyEngineControls;
  deviceId: string | null;
}

export function useSpotifyEngine({ accessToken }: UseSpotifyEngineOptions): UseSpotifyEngineResult {
  const [playerState, setPlayerState] = useState<SpotifyPlayerState>('idle');
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const playerRef = useRef<SpotifySDKPlayer | null>(null);
  const tokenRef = useRef<string | null | undefined>(accessToken);

  // Keep token ref fresh for the SDK getOAuthToken callback
  useEffect(() => { tokenRef.current = accessToken; }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    const init = async () => {
      setPlayerState('loading');
      await loadSpotifySDK();
      if (cancelled) return;

      const Spotify = (window as Window & { Spotify: { Player: new (opts: unknown) => SpotifySDKPlayer } }).Spotify;

      const player = new Spotify.Player({
        name: DEVICE_NAME,
        volume: VOLUME_DEFAULT,
        getOAuthToken: (cb: (token: string) => void) => {
          if (tokenRef.current) cb(tokenRef.current);
        },
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        if (cancelled) return;
        setDeviceId(device_id);
        setPlayerState('ready');
      });

      player.addListener('not_ready', () => {
        if (cancelled) return;
        setPlayerState('idle');
        setDeviceId(null);
      });

      player.addListener('player_state_changed', (state: SpotifyPlaybackState | null) => {
        if (cancelled) return;
        setPlaybackState(state);
        if (state) setPlayerState('playing');
      });

      player.addListener('initialization_error', ({ message }: WebPlaybackError) => {
        if (cancelled) return;
        console.error('[SpotifyEngine] init error:', message);
        setPlayerState('error');
      });

      player.addListener('authentication_error', ({ message }: WebPlaybackError) => {
        if (cancelled) return;
        console.error('[SpotifyEngine] auth error:', message);
        setPlayerState('error');
      });

      player.addListener('account_error', ({ message }: WebPlaybackError) => {
        if (cancelled) return;
        console.error('[SpotifyEngine] account error (Premium required):', message);
        setPlayerState('error');
      });

      await player.connect();
      playerRef.current = player;
    };

    void init();

    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
      setPlayerState('idle');
      setDeviceId(null);
      setPlaybackState(null);
    };
  }, [accessToken]);

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------

  const play = useCallback(async (uris: string[]) => {
    if (!deviceId || !tokenRef.current) return;
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenRef.current}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris }),
    });
  }, [deviceId]);

  const resume = useCallback(async () => {
    await playerRef.current?.resume();
  }, []);

  const pause = useCallback(async () => {
    await playerRef.current?.pause();
  }, []);

  const seek = useCallback(async (positionMs: number) => {
    await playerRef.current?.seek(positionMs);
  }, []);

  const setVolume = useCallback(async (fraction: number) => {
    await playerRef.current?.setVolume(Math.max(0, Math.min(1, fraction)));
  }, []);

  const nextTrack = useCallback(async () => {
    await playerRef.current?.nextTrack();
  }, []);

  const previousTrack = useCallback(async () => {
    await playerRef.current?.previousTrack();
  }, []);

  return {
    playerState,
    playbackState,
    deviceId,
    controls: { play, resume, pause, seek, setVolume, nextTrack, previousTrack },
  };
}
