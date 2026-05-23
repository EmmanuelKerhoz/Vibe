import type { SpotifyTokenResponse } from '../types/spotify';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string;

const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-library-read',
  'user-library-modify',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ');

const PKCE_STATE_KEY = 'spotify_pkce_state';
const CODE_VERIFIER_KEY = 'spotify_code_verifier';

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => charset[v % charset.length]).join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(plain));
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await sha256(verifier);
  return base64UrlEncode(digest);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initiates the Spotify OAuth PKCE flow.
 * Stores code_verifier and state in sessionStorage, then redirects to Spotify.
 */
export async function redirectToSpotifyAuth(): Promise<void> {
  const state = generateRandomString(16);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  sessionStorage.setItem(PKCE_STATE_KEY, state);
  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/**
 * Handles the OAuth callback.
 * Validates state, exchanges code for tokens via the serverless endpoint.
 * Returns null if the URL does not contain a Spotify callback.
 */
export async function handleSpotifyCallback(): Promise<SpotifyTokenResponse | null> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (!code && !error) return null;

  if (error) throw new Error(`Spotify auth error: ${error}`);

  const storedState = sessionStorage.getItem(PKCE_STATE_KEY);
  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);

  if (state !== storedState) throw new Error('OAuth state mismatch — possible CSRF.');
  if (!codeVerifier) throw new Error('Missing PKCE code verifier.');

  sessionStorage.removeItem(PKCE_STATE_KEY);
  sessionStorage.removeItem(CODE_VERIFIER_KEY);

  // Clean URL
  window.history.replaceState({}, '', window.location.pathname);

  const res = await fetch('/api/spotify/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: REDIRECT_URI, code_verifier: codeVerifier }),
  });

  if (!res.ok) {
    const { error: msg } = await res.json() as { error: string };
    throw new Error(msg);
  }

  return res.json() as Promise<SpotifyTokenResponse>;
}

/**
 * Exchanges a refresh_token for a fresh access token via the serverless endpoint.
 */
export async function refreshSpotifyToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const res = await fetch('/api/spotify/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    const { error: msg } = await res.json() as { error: string };
    throw new Error(msg);
  }

  return res.json() as Promise<SpotifyTokenResponse>;
}
