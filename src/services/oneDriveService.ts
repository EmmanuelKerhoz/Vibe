/**
 * OneDrive Graph API Service
 * Auth: MSAL PopupLogin (no redirect — single-page PWA)
 * Scope: Files.Read (read-only, personal + business)
 * Streaming: @microsoft.graph.downloadUrl → direct range-request CDN URL (no download)
 */

import type { PublicClientApplication, AccountInfo } from '@azure/msal-browser';

// ── Types ──────────────────────────────────────────────────────────────────

export interface OneDriveItem {
  id: string;
  name: string;
  size: number;
  /** Direct streaming URL (pre-signed, ~1 h validity) */
  downloadUrl: string;
  mimeType: string;
  parentPath: string;
}

export type OneDriveAuthState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'connected'; account: AccountInfo }
  | { status: 'error'; message: string };

// ── Constants ───────────────────────────────────────────────────────────────

/** Azure App Registration — redirect: single-page, public client */
const CLIENT_ID = import.meta.env.VITE_MSAL_CLIENT_ID as string | undefined;

const SCOPES = ['Files.Read', 'User.Read'];

const AUDIO_MIME_RE = /^audio\//;
const VIDEO_MIME_RE = /^video\//;
const AUDIO_EXT_RE = /\.(mp3|wav|m4a|flac|ogg|aac|opus|wma)$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|mkv)$/i;

function isMedia(item: { name: string; file?: { mimeType?: string } }): boolean {
  const mime = item.file?.mimeType ?? '';
  return AUDIO_MIME_RE.test(mime) || VIDEO_MIME_RE.test(mime) ||
    AUDIO_EXT_RE.test(item.name) || VIDEO_EXT_RE.test(item.name);
}

// ── MSAL lazy-loader ────────────────────────────────────────────────────────

let _msalInstance: PublicClientApplication | null = null;

async function getMsalInstance(): Promise<PublicClientApplication> {
  if (_msalInstance) return _msalInstance;

  const clientId = CLIENT_ID;
  if (!clientId) throw new Error('VITE_MSAL_CLIENT_ID is not set. Add it to your .env file.');

  // Dynamic import — keeps MSAL out of the initial bundle
  const { PublicClientApplication: PCAM, LogLevel } = await import('@azure/msal-browser');

  const instance = new PCAM({
    auth: {
      clientId,
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: window.location.origin,
    },
    cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
    system: {
      loggerOptions: {
        loggerCallback: () => {},
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false,
      },
    },
  });

  await instance.initialize();
  _msalInstance = instance;
  return instance;
}

// ── Auth ────────────────────────────────────────────────────────────────────

/** Opens the MSAL popup login. Returns the active account on success. */
export async function signInWithMsal(): Promise<AccountInfo> {
  const msal = await getMsalInstance();

  // Try silent first (already logged in)
  const accounts = msal.getAllAccounts();
  if (accounts.length > 0) {
    try {
      const silent = await msal.acquireTokenSilent({ scopes: SCOPES, account: accounts[0] });
      return silent.account;
    } catch {
      // fall through to popup
    }
  }

  const result = await msal.loginPopup({ scopes: SCOPES });
  return result.account;
}

export async function signOutMsal(): Promise<void> {
  if (!_msalInstance) return;
  const accounts = _msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    await _msalInstance.logoutPopup({ account: accounts[0] });
  }
}

async function getAccessToken(): Promise<string> {
  const msal = await getMsalInstance();
  const accounts = msal.getAllAccounts();
  if (!accounts.length) throw new Error('Not authenticated');
  const result = await msal.acquireTokenSilent({ scopes: SCOPES, account: accounts[0] });
  return result.accessToken;
}

// ── Graph API helpers ────────────────────────────────────────────────────────

const GRAPH = 'https://graph.microsoft.com/v1.0';

async function graphGet<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Graph ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

interface GraphItem {
  id: string;
  name: string;
  size: number;
  file?: { mimeType?: string };
  folder?: object;
  parentReference?: { path?: string };
  '@microsoft.graph.downloadUrl'?: string;
}

interface GraphListResponse {
  value: GraphItem[];
  '@odata.nextLink'?: string;
}

/** Recursively enumerate all media files under a given folder item-id (or 'root'). */
async function collectMedia(
  folderId: string,
  parentPath: string,
  accumulator: OneDriveItem[],
  depth = 0,
): Promise<void> {
  if (depth > 6) return; // guard against deeply nested structures

  const endpoint = folderId === 'root'
    ? `/me/drive/root/children?$select=id,name,size,file,folder,parentReference,@microsoft.graph.downloadUrl&$top=200`
    : `/me/drive/items/${folderId}/children?$select=id,name,size,file,folder,parentReference,@microsoft.graph.downloadUrl&$top=200`;

  let url: string | undefined = endpoint;

  while (url) {
    const data = await graphGet<GraphListResponse>(url.startsWith('http') ? url.replace(GRAPH, '') : url);
    for (const item of data.value) {
      if (item.folder) {
        // Recurse into sub-folder
        await collectMedia(item.id, `${parentPath}/${item.name}`, accumulator, depth + 1);
      } else if (isMedia(item) && item['@microsoft.graph.downloadUrl']) {
        accumulator.push({
          id: item.id,
          name: item.name,
          size: item.size,
          downloadUrl: item['@microsoft.graph.downloadUrl'],
          mimeType: item.file?.mimeType ?? '',
          parentPath,
        });
      }
    }
    url = data['@odata.nextLink'];
  }
}

/**
 * Browse the user's OneDrive root and return all audio/video items.
 * Each item carries a `downloadUrl` suitable for direct `<audio src>` streaming.
 */
export async function fetchOneDriveMediaItems(): Promise<OneDriveItem[]> {
  const items: OneDriveItem[] = [];
  await collectMedia('root', '/OneDrive', items);
  return items;
}

/**
 * Refresh the streaming URL for a single item.
 * Use this when the cached downloadUrl has expired (~1 h).
 */
export async function refreshDownloadUrl(itemId: string): Promise<string> {
  const data = await graphGet<{ '@microsoft.graph.downloadUrl'?: string }>(
    `/me/drive/items/${itemId}?$select=id,@microsoft.graph.downloadUrl`,
  );
  const url = data['@microsoft.graph.downloadUrl'];
  if (!url) throw new Error(`No downloadUrl for item ${itemId}`);
  return url;
}
