/**
 * Feature: Spotify Player
 * Wraps Spotify Web Playback SDK — dynamic script load, device init,
 * state subscription, and playback commands.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SpotifyPlayer, SpotifyWebPlaybackState } from '../../types/spotify';
import type { UseSpotifyAuthReturn } from './useSpotifyAuth';

const SDK_URL = 'https://sdk.scdn.co/spotify-player.js';

function loadSpotifySDK(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Spotify) { resolve(); return; }
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    window.onSpotifyWebPlaybackSDKReady = resolve;
    document.head.appendChild(script);
  });
}

export interface SpotifyPlayerState {
  isReady: boolean;
  deviceId: string | null;
  playbackState: SpotifyWebPlaybackState | null;
  isPlaying: boolean;
  currentTrack: SpotifyWebPlaybackState['track_window']['current_track'] | null;
  positionMs: number;
  durationMs: number;
  volume: number;
  error: string | null;
}

export interface UseSpotifyPlayerReturn extends SpotifyPlayerState {
  play: (uris?: string[]) => Promise<void>;
  pause: () => Promise<void>;
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
}

export function useSpotifyPlayer(
  auth: Pick<UseSpotifyAuthReturn, 'getValidToken' | 'isAuthenticated'>
): UseSpotifyPlayerReturn {
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const deviceIdRef = useRef<string | null>(null);

  const [state, setState] = useState<SpotifyPlayerState>({
    isReady: false,
    deviceId: null,
    playbackState: null,
    isPlaying: false,
    currentTrack: null,
    positionMs: 0,
    durationMs: 0,
    volume: 0.8,
    error: null,
  });

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    let mounted = true;

    const init = async (): Promise<void> => {
      try {
        await loadSpotifySDK();
        if (!mounted) return;

        const player = new window.Spotify.Player({
          name: 'Lyricist Player',
          volume: 0.8,
          getOAuthToken: async (cb) => {
            const token = await auth.getValidToken();
            if (token) cb(token);
          },
        });

        player.addListener('ready', ({ device_id }) => {
          deviceIdRef.current = device_id;
          if (mounted) setState((s) => ({ ...s, isReady: true, deviceId: device_id, error: null }));
        });

        player.addListener('not_ready', ({ device_id }) => {
          if (mounted) setState((s) => ({ ...s, isReady: false, deviceId: device_id }));
        });

        player.addListener('player_state_changed', (pbState) => {
          if (!mounted || !pbState) return;
          setState((s) => ({
            ...s,
            playbackState: pbState,
            isPlaying: !pbState.paused,
            currentTrack: pbState.track_window.current_track,
            positionMs: pbState.position,
            durationMs: pbState.duration,
          }));
        });

        player.addListener('initialization_error', ({ message }) => {
          if (mounted) setState((s) => ({ ...s, error: `Init error: ${message}` }));
        });
        player.addListener('authentication_error', ({ message }) => {
          if (mounted) setState((s) => ({ ...s, error: `Auth error: ${message}` }));
        });
        player.addListener('account_error', ({ message }) => {
          if (mounted) setState((s) => ({ ...s, error: `Account error: ${message}` }));
        });

        await player.connect();
        playerRef.current = player;
      } catch (err) {
        if (mounted) setState((s) => ({ ...s, error: err instanceof Error ? err.message : 'SDK init failed' }));
      }
    };

    void init();

    return () => {
      mounted = false;
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [auth.isAuthenticated, auth.getValidToken]);

  // Position polling (250ms) when playing
  useEffect(() => {
    if (!state.isPlaying || !playerRef.current) return;
    const id = setInterval(async () => {
      const ps = await playerRef.current?.getCurrentState();
      if (ps) setState((s) => ({ ...s, positionMs: ps.position }));
    }, 250);
    return () => clearInterval(id);
  }, [state.isPlaying]);

  const play = useCallback(async (uris?: string[]): Promise<void> => {
    const token = await auth.getValidToken();
    const deviceId = deviceIdRef.current;
    if (!token || !deviceId) return;

    const body: Record<string, unknown> = {};
    if (uris && uris.length > 0) body['uris'] = uris;

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }, [auth.getValidToken]);

  const pause = useCallback(async (): Promise<void> => {
    await playerRef.current?.pause();
  }, []);

  const togglePlay = useCallback(async (): Promise<void> => {
    await playerRef.current?.togglePlay();
  }, []);

  const nextTrack = useCallback(async (): Promise<void> => {
    await playerRef.current?.nextTrack();
  }, []);

  const previousTrack = useCallback(async (): Promise<void> => {
    await playerRef.current?.previousTrack();
  }, []);

  const seek = useCallback(async (positionMs: number): Promise<void> => {
    await playerRef.current?.seek(positionMs);
  }, []);

  const setVolume = useCallback(async (volume: number): Promise<void> => {
    await playerRef.current?.setVolume(volume);
    setState((s) => ({ ...s, volume }));
  }, []);

  return { ...state, play, pause, togglePlay, nextTrack, previousTrack, seek, setVolume };
}
