/**
 * Feature: Spotify Auth
 * PKCE OAuth 2.0 flow for Spotify Web Playback SDK.
 * Handles: login redirect, callback token exchange, token refresh.
 * No external library — pure fetch + crypto.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
].join(' ');

const REDIRECT_URI = (() => {
  if (typeof window === 'undefined') return '';
  const { protocol, host } = window.location;
  // Dev: 127.0.0.1:5173 | Prod: lyricist-emmanuelkerhozs-projects.vercel.app
  return `${protocol}//${host}`;
})();

const TOKEN_KEY = 'spotify_access_token';
const REFRESH_KEY = 'spotify_refresh_token';
const EXPIRY_KEY = 'spotify_token_expiry';
const VERIFIER_KEY = 'spotify_pkce_verifier';

// -- PKCE helpers --
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values).map((x) => possible[x % possible.length]).join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64urlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  return base64urlEncode(await sha256(verifier));
}

// -- Storage helpers (in-memory fallback for sandboxed contexts) --
const memStore = new Map<string, string>();
function storeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { memStore.set(key, value); }
}
function storeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return memStore.get(key) ?? null; }
}
function storeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { memStore.delete(key); }
}

// -- Token exchange --
async function exchangeCodeForToken(code: string, verifier: string): Promise<void> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Spotify token exchange failed: ${res.status}`);
  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  storeSet(TOKEN_KEY, data.access_token);
  storeSet(REFRESH_KEY, data.refresh_token);
  storeSet(EXPIRY_KEY, String(Date.now() + data.expires_in * 1000));
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Spotify token refresh failed: ${res.status}`);
  const data = await res.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  storeSet(TOKEN_KEY, data.access_token);
  if (data.refresh_token) storeSet(REFRESH_KEY, data.refresh_token);
  storeSet(EXPIRY_KEY, String(Date.now() + data.expires_in * 1000));
  return data.access_token;
}

export interface UseSpotifyAuthReturn {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
  getValidToken: () => Promise<string | null>;
}

export function useSpotifyAuth(): UseSpotifyAuthReturn {
  const [accessToken, setAccessToken] = useState<string | null>(storeGet(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mutex: serialises concurrent getValidToken() calls during the refresh window.
  // All callers share the same in-flight promise; the ref is cleared on settlement.
  const refreshPromiseRef = useRef<Promise<string> | null>(null);

  // Handle OAuth callback on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');
    const verifier = storeGet(VERIFIER_KEY);

    if (errorParam) {
      setError(`Spotify auth denied: ${errorParam}`);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (code && verifier) {
      setIsLoading(true);
      storeRemove(VERIFIER_KEY);
      exchangeCodeForToken(code, verifier)
        .then(() => {
          setAccessToken(storeGet(TOKEN_KEY));
          window.history.replaceState({}, '', window.location.pathname);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Token exchange failed');
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const login = useCallback(async (): Promise<void> => {
    const verifier = generateRandomString(64);
    const challenge = await generateCodeChallenge(verifier);
    storeSet(VERIFIER_KEY, verifier);

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('code_challenge', challenge);

    window.location.href = authUrl.toString();
  }, []);

  const logout = useCallback((): void => {
    storeRemove(TOKEN_KEY);
    storeRemove(REFRESH_KEY);
    storeRemove(EXPIRY_KEY);
    refreshPromiseRef.current = null;
    setAccessToken(null);
  }, []);

  const getValidToken = useCallback(async (): Promise<string | null> => {
    const token = storeGet(TOKEN_KEY);
    const expiry = Number(storeGet(EXPIRY_KEY) ?? 0);
    const refreshToken = storeGet(REFRESH_KEY);

    if (!token) return null;

    // Token still valid — return immediately
    if (Date.now() <= expiry - 60_000) return token;

    // No refresh token — can't renew, bail out
    if (!refreshToken) {
      logout();
      return null;
    }

    // Mutex: if a refresh is already in flight, wait for it instead of firing a second one
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = refreshAccessToken(refreshToken)
      .then((fresh) => {
        setAccessToken(fresh);
        return fresh;
      })
      .catch(() => {
        logout();
        // Rethrow so callers can handle or swallow gracefully
        return Promise.reject(new Error('Spotify token refresh failed — user logged out'));
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });

    return refreshPromiseRef.current;
  }, [logout]);

  return {
    accessToken,
    isAuthenticated: Boolean(accessToken),
    isLoading,
    error,
    login,
    logout,
    getValidToken,
  };
}
