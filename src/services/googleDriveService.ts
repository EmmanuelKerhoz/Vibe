/**
 * googleDriveService.ts — Google Drive REST v3, OAuth2 PKCE (SPA)
 *
 * Auth flow : silent iframe refresh (prompt=none) → fallback popup (select_account)
 * OAuth2    : PKCE flow (Authorization Code with code_verifier/code_challenge)
 * Scopes    : https://www.googleapis.com/auth/drive.file
 *             (read+write files created by this app; cannot read arbitrary Drive files)
 *
 * For read-only pick of any file, scope drive.readonly is used instead.
 *
 * Env vars (Vite):
 *   VITE_GDRIVE_CLIENT_ID  — OAuth2 client ID (Web application, Authorized JS origins)
 *   VITE_GDRIVE_API_KEY    — API key (Picker API, optional)
 *
 * No external SDK dependency. Pure REST + window.open popup.
 *
 * SECURITY: Uses OAuth2 PKCE flow (RFC 7636) instead of deprecated implicit flow.
 * code_verifier is generated client-side; code_challenge (SHA-256) is sent to auth endpoint.
 * Token exchange happens via /token endpoint with the verifier.
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CLIENT_ID = (import.meta.env.VITE_GDRIVE_CLIENT_ID as string | undefined) ?? '';
const API_KEY   = (import.meta.env.VITE_GDRIVE_API_KEY   as string | undefined) ?? '';
void API_KEY;

const SCOPE_READ  = 'https://www.googleapis.com/auth/drive.readonly';
const SCOPE_WRITE = 'https://www.googleapis.com/auth/drive.file';

type GDriveScope = typeof SCOPE_READ | typeof SCOPE_WRITE;

const LYRICS_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'application/json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
];

const LYRICS_EXTENSIONS = ['.txt', '.md', '.json', '.docx', '.odt'];

export const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/flac',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/aac',
  'audio/opus',
  'audio/webm',
  'video/webm',
];

export const GDRIVE_AUDIO_EXTENSIONS = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.opus', '.weba', '.webm'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webContentLink?: string;
  size?: string;
}

// ---------------------------------------------------------------------------
// Token cache (in-memory, SPA session)
// ---------------------------------------------------------------------------

let _cachedToken: string | null = null;
let _tokenExpiry = 0;
let _proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;
let _refreshToken: string | null = null;
let _cachedScope: GDriveScope = SCOPE_READ;

function isTokenValid(): boolean {
  return !!_cachedToken && Date.now() < _tokenExpiry - 60_000;
}

function storeToken(token: string, expiresInSeconds: number, scope: GDriveScope): void {
  _cachedToken = token;
  _tokenExpiry = Date.now() + expiresInSeconds * 1000;
  _cachedScope = scope;

  if (_proactiveRefreshTimer !== null) clearTimeout(_proactiveRefreshTimer);
  _proactiveRefreshTimer = setTimeout(
    () => { void silentRefresh(_cachedScope).catch(() => {}); },
    Math.max(0, expiresInSeconds - 300) * 1000,
  );
}

export function clearToken(): void {
  _cachedToken = null;
  _tokenExpiry = 0;
  _refreshToken = null;
  _cachedScope = SCOPE_READ;
  if (_proactiveRefreshTimer !== null) {
    clearTimeout(_proactiveRefreshTimer);
    _proactiveRefreshTimer = null;
  }
}

export function getStoredToken(): string | null {
  return isTokenValid() ? _cachedToken : null;
}

// ---------------------------------------------------------------------------
// Type guard for postMessage data.
// Validates that the payload is a plain object with a string `type` field.
// - Rejects null, primitives, and arrays (typeof [] === 'object' trap).
// ---------------------------------------------------------------------------

type GDriveMessageData = {
  type?: string;
  code?: string;
  access_token?: string;
  expires_in?: number;
  error?: string;
};

function isGDriveMessage(data: unknown): data is GDriveMessageData {
  return (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    typeof (data as Record<string, unknown>).type === 'string'
  );
}

// ---------------------------------------------------------------------------
// Token response type guard
// ---------------------------------------------------------------------------

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

function isValidTokenResponse(data: unknown): data is TokenResponse {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.access_token === 'string' &&
    obj.access_token.length > 0 &&
    typeof obj.expires_in === 'number' &&
    obj.expires_in > 0 &&
    (obj.refresh_token === undefined || typeof obj.refresh_token === 'string')
  );
}

// ---------------------------------------------------------------------------
// PKCE helpers (RFC 7636)
// ---------------------------------------------------------------------------

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(hash))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    code,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Token exchange failed ${res.status}: ${body.slice(0, 200)}`);
  }

  const data: unknown = await res.json();
  if (!isValidTokenResponse(data)) {
    throw new Error('Token exchange returned malformed response: missing or invalid access_token/expires_in');
  }

  return data;
}

// ---------------------------------------------------------------------------
// Test hook — tree-shaken in production (import.meta.env.TEST is undefined).
// ---------------------------------------------------------------------------

export const _testExchangeCodeForToken =
  import.meta.env.TEST === 'true' ? exchangeCodeForToken : undefined;

// ---------------------------------------------------------------------------
// Silent refresh via hidden iframe (prompt=none)
// ---------------------------------------------------------------------------

async function silentRefresh(scope: GDriveScope): Promise<string> {
  if (!CLIENT_ID) throw new Error('GDRIVE_NOT_CONFIGURED');

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  return new Promise((resolve, reject) => {
    const redirectUri = `${window.location.origin}/gdrive-callback.html`;
    const params = new URLSearchParams({
      client_id:              CLIENT_ID,
      redirect_uri:           redirectUri,
      response_type:          'code',
      scope,
      include_granted_scopes: 'true',
      prompt:                 'none',
      code_challenge:         codeChallenge,
      code_challenge_method:  'S256',
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
    iframe.src = authUrl;
    document.body.appendChild(iframe);

    const TIMEOUT_MS = 8_000;
    let settled = false;

    const cleanup = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      window.removeEventListener('message', messageHandler);
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('GDRIVE_SILENT_TIMEOUT'));
    }, TIMEOUT_MS);

    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isGDriveMessage(event.data)) return;
      const data = event.data;
      if (data.type !== 'GDRIVE_CODE') return;
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      if (data.error || !data.code) {
        reject(new Error(data.error ?? 'GDRIVE_NO_CODE'));
      } else {
        if (typeof data.code !== 'string' || data.code.length === 0) {
          reject(new Error('GDRIVE_INVALID_CODE'));
          return;
        }
        try {
          const tokenData = await exchangeCodeForToken(data.code, codeVerifier, redirectUri);
          storeToken(tokenData.access_token, tokenData.expires_in, scope);
          if (tokenData.refresh_token) _refreshToken = tokenData.refresh_token;
          resolve(tokenData.access_token);
        } catch (err) {
          reject(err);
        }
      }
    };

    window.addEventListener('message', messageHandler);
  });
}

// ---------------------------------------------------------------------------
// OAuth2 popup (full interactive login)
// ---------------------------------------------------------------------------

async function popupSignIn(scope: GDriveScope, preOpenedWindow: Window | null): Promise<string> {
  if (!CLIENT_ID) throw new Error('GDRIVE_NOT_CONFIGURED');
  if (!preOpenedWindow) throw new Error('GDRIVE_POPUP_BLOCKED');

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  return new Promise((resolve, reject) => {
    const redirectUri = `${window.location.origin}/gdrive-callback.html`;
    const params = new URLSearchParams({
      client_id:              CLIENT_ID,
      redirect_uri:           redirectUri,
      response_type:          'code',
      scope,
      include_granted_scopes: 'true',
      prompt:                 'select_account',
      code_challenge:         codeChallenge,
      code_challenge_method:  'S256',
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    preOpenedWindow.location.href = authUrl;
    const popup = preOpenedWindow;

    let settled = false;
    const POPUP_TIMEOUT_MS = 90_000;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanupPopup = () => {
      clearInterval(closedCheck);
      if (timeoutTimer !== null) clearTimeout(timeoutTimer);
      window.removeEventListener('message', messageHandler);
    };

    const closedCheck = setInterval(() => {
      if (!popup.closed) return;
      if (settled) { clearInterval(closedCheck); return; }
      settled = true;
      cleanupPopup();
      reject(new Error('GDRIVE_AUTH_CANCELLED'));
    }, 500);

    timeoutTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanupPopup();
      if (!popup.closed) {
        try { popup.close(); } catch { /* ignore */ }
      }
      reject(new Error('GDRIVE_AUTH_TIMEOUT: Authentication took too long. Please check your popup blocker settings and try again.'));
    }, POPUP_TIMEOUT_MS);

    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== popup) return;
      if (!isGDriveMessage(event.data)) return;
      const data = event.data;
      if (data.type !== 'GDRIVE_CODE') return;
      if (settled) return;
      settled = true;

      cleanupPopup();

      if (data.error || !data.code) {
        reject(new Error(data.error ?? 'GDRIVE_NO_CODE'));
        return;
      }

      if (typeof data.code !== 'string' || data.code.length === 0) {
        reject(new Error('GDRIVE_INVALID_CODE'));
        return;
      }

      try {
        const tokenData = await exchangeCodeForToken(data.code, codeVerifier, redirectUri);
        storeToken(tokenData.access_token, tokenData.expires_in, scope);
        if (tokenData.refresh_token) _refreshToken = tokenData.refresh_token;
        resolve(tokenData.access_token);
      } catch (err) {
        reject(err);
      }
    };

    window.addEventListener('message', messageHandler);
  });
}

// ---------------------------------------------------------------------------
// Public sign-in: silent first, popup fallback
// ---------------------------------------------------------------------------

export async function signIn(write = false): Promise<string> {
  if (isTokenValid()) return _cachedToken as string;
  if (!CLIENT_ID) throw new Error('[googleDriveService] VITE_GDRIVE_CLIENT_ID is not set.');

  const scope: GDriveScope = write ? SCOPE_WRITE : SCOPE_READ;

  const preOpenedWindow = window.open('about:blank', 'GDriveAuth', 'width=520,height=640,toolbar=0,scrollbars=1');

  if (preOpenedWindow === null) {
    throw new Error('GDRIVE_POPUP_BLOCKED: Popup was blocked by the browser. Please allow popups for this site and try again.');
  }

  try {
    const token = await silentRefresh(scope);
    if (!preOpenedWindow.closed) preOpenedWindow.close();
    return token;
  } catch (err) {
    if (import.meta.env.DEV) console.debug('[gdrive] silent refresh failed:', err);
  }

  return popupSignIn(scope, preOpenedWindow);
}

// ---------------------------------------------------------------------------
// Drive REST helpers
// ---------------------------------------------------------------------------

async function driveGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Drive GET ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

interface DriveFileListResponse {
  files: Array<{ id: string; name: string; mimeType: string; webContentLink?: string; size?: string }>;
  nextPageToken?: string;
}

export async function listRecentLyricsFiles(token: string): Promise<GDriveFile[]> {
  const mimeQuery = LYRICS_MIME_TYPES.map(m => `mimeType='${m}'`).join(' or ');
  const q = encodeURIComponent(`(${mimeQuery}) and trashed=false`);
  const fields = encodeURIComponent('files(id,name,mimeType)');
  const data = await driveGet<DriveFileListResponse>(
    `/files?q=${q}&fields=${fields}&pageSize=30&orderBy=modifiedTime desc`,
    token,
  );
  return (data.files ?? []).filter(f =>
    LYRICS_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext))
  );
}

export async function listRecentAudioFiles(token: string): Promise<GDriveFile[]> {
  const mimeQuery = AUDIO_MIME_TYPES.map(m => `mimeType='${m}'`).join(' or ');
  const q = encodeURIComponent(`(${mimeQuery}) and trashed=false`);
  const fields = encodeURIComponent('files(id,name,mimeType,size)');
  const data = await driveGet<DriveFileListResponse>(
    `/files?q=${q}&fields=${fields}&pageSize=50&orderBy=modifiedTime desc`,
    token,
  );
  return (data.files ?? [])
    .filter(f =>
      GDRIVE_AUDIO_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext))
    )
    .map(f => {
      const file: GDriveFile = { id: f.id, name: f.name, mimeType: f.mimeType };
      if (f.size !== undefined) file.size = f.size;
      return file;
    });
}

export async function createAudioBlobUrl(fileId: string, token: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Drive audio download ${res.status}: ${body.slice(0, 200)}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function downloadFile(fileId: string, token: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Drive download ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.blob().then(blob => blob.text());
}

export async function saveFile(
  content: string,
  fileName: string,
  mimeType = 'text/plain',
  fileId?: string,
): Promise<GDriveFile> {
  const token = await signIn(true);

  const metadata = JSON.stringify({
    name:     fileName,
    mimeType,
    ...(fileId ? {} : { parents: ['root'] }),
  });

  const boundary = '-------314159265358979323846';
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n');

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id,name,mimeType`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType';

  const method = fileId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`,
    },
    body,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Drive ${method} ${res.status}: ${errBody.slice(0, 200)}`);
  }

  return (await res.json()) as GDriveFile;
}

export function isGDriveConfigured(): boolean {
  return !!CLIENT_ID;
}
