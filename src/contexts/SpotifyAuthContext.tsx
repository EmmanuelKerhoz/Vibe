import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { SpotifyAuthState } from '../types/spotify';
import {
  handleSpotifyCallback,
  redirectToSpotifyAuth,
  refreshSpotifyToken,
} from '../services/spotifyAuth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpotifyAuthContextValue extends SpotifyAuthState {
  login: () => Promise<void>;
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Storage keys (in-memory only — sessionStorage blocked in sandboxed iframes)
// For Vercel/production browser context, sessionStorage is available.
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'spotify_access_token';
const REFRESH_KEY = 'spotify_refresh_token';
const EXPIRES_KEY = 'spotify_expires_at';

function readSession() {
  try {
    return {
      accessToken: sessionStorage.getItem(TOKEN_KEY),
      refreshToken: sessionStorage.getItem(REFRESH_KEY),
      expiresAt: Number(sessionStorage.getItem(EXPIRES_KEY)) || null,
    };
  } catch {
    return { accessToken: null, refreshToken: null, expiresAt: null };
  }
}

function writeSession(accessToken: string, refreshToken: string | undefined, expiresAt: number) {
  try {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) sessionStorage.setItem(REFRESH_KEY, refreshToken);
    sessionStorage.setItem(EXPIRES_KEY, String(expiresAt));
  } catch { /* sandboxed — silent */ }
}

function clearSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(EXPIRES_KEY);
  } catch { /* sandboxed — silent */ }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SpotifyAuthContext = createContext<SpotifyAuthContextValue | null>(null);

export function SpotifyAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SpotifyAuthState>(() => {
    const { accessToken, expiresAt } = readSession();
    const isValid = accessToken && expiresAt && Date.now() < expiresAt;
    return {
      status: isValid ? 'authenticated' : 'idle',
      accessToken: isValid ? accessToken : null,
      expiresAt: isValid ? expiresAt : null,
      error: null,
    };
  });

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    // Refresh 60s before expiry
    const delay = Math.max(0, expiresAt - Date.now() - 60_000);
    refreshTimerRef.current = setTimeout(async () => {
      const { refreshToken } = readSession();
      if (!refreshToken) return;
      try {
        const tokens = await refreshSpotifyToken(refreshToken);
        const newExpiresAt = Date.now() + tokens.expires_in * 1000;
        writeSession(tokens.access_token, tokens.refresh_token, newExpiresAt);
        setState({
          status: 'authenticated',
          accessToken: tokens.access_token,
          expiresAt: newExpiresAt,
          error: null,
        });
        scheduleRefresh(newExpiresAt);
      } catch {
        setState(prev => ({ ...prev, status: 'error', error: 'Token refresh failed. Please log in again.' }));
        clearSession();
      }
    }, delay);
  }, []);

  // Handle OAuth callback on mount
  useEffect(() => {
    const run = async () => {
      try {
        const tokens = await handleSpotifyCallback();
        if (!tokens) return; // Not a callback URL
        const expiresAt = Date.now() + tokens.expires_in * 1000;
        writeSession(tokens.access_token, tokens.refresh_token, expiresAt);
        setState({
          status: 'authenticated',
          accessToken: tokens.access_token,
          expiresAt,
          error: null,
        });
        scheduleRefresh(expiresAt);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        setState({ status: 'error', accessToken: null, expiresAt: null, error: message });
      }
    };
    void run();
  }, [scheduleRefresh]);

  // Schedule refresh on mount if already authenticated
  useEffect(() => {
    if (state.status === 'authenticated' && state.expiresAt) {
      scheduleRefresh(state.expiresAt);
    }
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'authenticating', error: null }));
    await redirectToSpotifyAuth();
  }, []);

  const logout = useCallback(() => {
    clearSession();
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setState({ status: 'idle', accessToken: null, expiresAt: null, error: null });
  }, []);

  return (
    <SpotifyAuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </SpotifyAuthContext.Provider>
  );
}

export function useSpotifyAuth(): SpotifyAuthContextValue {
  const ctx = useContext(SpotifyAuthContext);
  if (!ctx) throw new Error('useSpotifyAuth must be used within SpotifyAuthProvider');
  return ctx;
}
