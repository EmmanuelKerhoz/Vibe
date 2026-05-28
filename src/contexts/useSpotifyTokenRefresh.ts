/**
 * useSpotifyTokenRefresh — Isolated refresh loop for the Spotify PKCE flow.
 *
 * Owns the single-flight refresh mutex (refreshPromiseRef) so that a scheduled
 * proactive refresh and a manual getValidToken()/forceRefreshToken() never run
 * two concurrent refreshes, plus the setTimeout-based scheduling that fires
 * TOKEN_EXPIRY_BUFFER_MS before the access token expires.
 */
import { useCallback, useEffect, useRef } from 'react';
import type { SpotifyAuthState } from '../types/spotify';
import {
  doRefresh,
  storeGet,
  storeRemove,
  storeSet,
  EXPIRY_KEY,
  REFRESH_KEY,
  TOKEN_KEY,
  TOKEN_EXPIRY_BUFFER_MS,
} from './spotifyPkce';

interface UseSpotifyTokenRefreshOptions {
  status: SpotifyAuthState['status'];
  expiresAt: SpotifyAuthState['expiresAt'];
  setState: (state: SpotifyAuthState) => void;
}

interface UseSpotifyTokenRefreshResult {
  /** Refresh the access token, sharing a single in-flight request. */
  refreshWithMutex: (refreshToken: string) => Promise<string | null>;
  /** Remove persisted token/refresh/expiry values from storage. */
  clearStorage: () => void;
  /** Cancel any pending scheduled refresh and clear the in-flight mutex. */
  resetRefresh: () => void;
}

export function useSpotifyTokenRefresh({
  status,
  expiresAt,
  setState,
}: UseSpotifyTokenRefreshOptions): UseSpotifyTokenRefreshResult {
  const refreshTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const clearStorage = useCallback(() => {
    storeRemove(TOKEN_KEY);
    storeRemove(REFRESH_KEY);
    storeRemove(EXPIRY_KEY);
  }, []);

  const refreshWithMutex = useCallback(async (refreshToken: string): Promise<string | null> => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = doRefresh(refreshToken)
        .then((data) => {
          const newExpiry = Date.now() + data.expires_in * 1000;
          storeSet(TOKEN_KEY, data.access_token);
          if (data.refresh_token) storeSet(REFRESH_KEY, data.refresh_token);
          storeSet(EXPIRY_KEY, String(newExpiry));
          setState({
            status: 'authenticated',
            accessToken: data.access_token,
            expiresAt: newExpiry,
            error: null,
          });
          return data.access_token;
        })
        .catch(() => {
          clearStorage();
          setState({ status: 'error', accessToken: null, expiresAt: null, error: 'Token refresh failed. Please log in again.' });
          return null;
        })
        .finally(() => { refreshPromiseRef.current = null; });
    }

    return refreshPromiseRef.current;
  }, [clearStorage, setState]);

  const resetRefresh = useCallback(() => {
    refreshPromiseRef.current = null;
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Schedule refresh in one place whenever the authenticated expiry changes.
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (status !== 'authenticated' || !expiresAt) return undefined;

    const delay = Math.max(0, expiresAt - Date.now() - TOKEN_EXPIRY_BUFFER_MS);
    const timer = setTimeout(() => {
      const refreshToken = storeGet(REFRESH_KEY);
      if (refreshToken) void refreshWithMutex(refreshToken);
    }, delay);
    refreshTimerRef.current = timer;

    return () => {
      clearTimeout(timer);
      if (refreshTimerRef.current === timer) refreshTimerRef.current = null;
    };
  }, [status, expiresAt, refreshWithMutex]);

  return { refreshWithMutex, clearStorage, resetRefresh };
}
