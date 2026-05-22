/**
 * OneDrive Graph API Service — MSAL SPA + Microsoft Graph v1.0
 *
 * Scopes: Files.Read (minimum — read user's own files)
 * Auth flow: popup (SPA, no backend)
 * Streaming: @microsoft.graph.downloadUrl — pre-authenticated, supports Range requests
 */
import {
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';

// ---------------------------------------------------------------------------
// App registration — replace CLIENT_ID with your Azure AD app registration.
// Redirect URI: https://lyricist.valor.cloud (or http://localhost:5173 for dev)
// Required API permission: Microsoft Graph → Files.Read (delegated)
// ---------------------------------------------------------------------------
const CLIENT_ID = import.meta.env.VITE_ONEDRIVE_CLIENT_ID ?? 'YOUR_AZURE_APP_CLIENT_ID';
const TENANT   = 'common'; // multi-tenant; use your tenantId for single-tenant

const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
  },
  cache: { cacheLocation: 'sessionStorage' as const, storeAuthStateInCookie: false },
};

const SCOPES = ['Files.Read', 'User.Read'];

// Singleton — one MSAL instance per SPA session
let _msalInstance: PublicClientApplication | null = null;

function getMsal(): PublicClientApplication {
  if (!_msalInstance) {
    _msalInstance = new PublicClientApplication(msalConfig);
  }
  return _msalInstance;
}

/** Initialize MSAL (must be called once before any auth op) */
export async function initMsal(): Promise<void> {
  const msal = getMsal();
  await msal.initialize();
  // Handle redirect response if we're coming back from a redirect flow
  await msal.handleRedirectPromise();
}

/** Returns the currently signed-in account, or null */
export function getAccount(): AccountInfo | null {
  const msal = getMsal();
  const accounts = msal.getAllAccounts();
  return accounts[0] ?? null;
}

/** Sign in via popup — returns the account on success */
export async function signIn(): Promise<AccountInfo> {
  const msal = getMsal();
  const result: AuthenticationResult = await msal.loginPopup({ scopes: SCOPES });
  return result.account;
}

/** Sign out the current account */
export async function signOut(): Promise<void> {
  const msal = getMsal();
  const account = getAccount();
  if (account) await msal.logoutPopup({ account });
}

/** Silently acquire an access token (falls back to popup on interaction required) */
async function getAccessToken(): Promise<string> {
  const msal = getMsal();
  const account = getAccount();
  if (!account) throw new Error('ONEDRIVE_NOT_SIGNED_IN');
  try {
    const result = await msal.acquireTokenSilent({ scopes: SCOPES, account });
    return result.accessToken;
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      const result = await msal.acquireTokenPopup({ scopes: SCOPES, account });
      return result.accessToken;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Graph types
// ---------------------------------------------------------------------------
export interface OneDriveItem {
  id: string;
  name: string;
  /** Signed temporary URL — valid ~1 hour, supports Range */
  downloadUrl: string;
  driveId: string;
  size: number;
  mimeType: string;
  isVideo: boolean;
  /** ISO timestamp — for display / sort */
  lastModified: string;
}

const AUDIO_MIME = /^audio\//;
const VIDEO_MIME = /^video\//;
const AUDIO_EXT  = /\.(mp3|wav|m4a|flac|ogg|aac|opus|wma)$/i;
const VIDEO_EXT  = /\.(mp4|webm|mov|mkv|avi)$/i;

function isMediaItem(item: { name: string; file?: { mimeType?: string } }): boolean {
  const mime = item.file?.mimeType ?? '';
  return AUDIO_MIME.test(mime) || VIDEO_MIME.test(mime) ||
         AUDIO_EXT.test(item.name) || VIDEO_EXT.test(item.name);
}

// ---------------------------------------------------------------------------
// Graph API calls
// ---------------------------------------------------------------------------
async function graphGet<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Graph ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

interface GraphDriveItem {
  id: string;
  name: string;
  '@microsoft.graph.downloadUrl'?: string;
  parentReference?: { driveId?: string };
  size?: number;
  file?: { mimeType?: string };
  folder?: unknown;
  lastModifiedDateTime?: string;
}

interface GraphDriveItemList {
  value: GraphDriveItem[];
  '@odata.nextLink'?: string;
}

/**
 * List audio/video items in a OneDrive folder (recursive up to 3 levels).
 * folderId = 'root' for the user's root drive.
 */
export async function listMediaItems(
  folderId = 'root',
  driveId?: string,
  depth = 0,
): Promise<OneDriveItem[]> {
  if (depth > 3) return [];
  const basePath = driveId
    ? `/drives/${driveId}/items/${folderId}/children`
    : folderId === 'root'
      ? '/me/drive/root/children'
      : `/me/drive/items/${folderId}/children`;

  const select = 'id,name,file,folder,size,lastModifiedDateTime,parentReference,@microsoft.graph.downloadUrl';
  let url: string | undefined = `${basePath}?$select=${select}&$top=200`;
  const results: OneDriveItem[] = [];
  const subFolderFetches: Promise<OneDriveItem[]>[] = [];

  while (url) {
    const page: GraphDriveItemList = await graphGet<GraphDriveItemList>(
      url.startsWith('/') ? url : url.replace('https://graph.microsoft.com/v1.0', '')
    );
    for (const item of page.value) {
      if (item.folder) {
        subFolderFetches.push(
          listMediaItems(item.id, item.parentReference?.driveId, depth + 1)
        );
      } else if (isMediaItem(item) && item['@microsoft.graph.downloadUrl']) {
        const mime = item.file?.mimeType ?? '';
        results.push({
          id: item.id,
          name: item.name,
          downloadUrl: item['@microsoft.graph.downloadUrl'],
          driveId: item.parentReference?.driveId ?? '',
          size: item.size ?? 0,
          mimeType: mime,
          isVideo: VIDEO_MIME.test(mime) || VIDEO_EXT.test(item.name),
          lastModified: item.lastModifiedDateTime ?? '',
        });
      }
    }
    // Handle pagination — explicit type annotation avoids TS7022
    const nextLink: string | undefined = page['@odata.nextLink'];
    url = nextLink ? nextLink.replace('https://graph.microsoft.com/v1.0', '') : undefined;
  }

  const subResults = await Promise.all(subFolderFetches);
  return [...results, ...subResults.flat()];
}

/**
 * Refresh the downloadUrl for a single item (they expire ~1 hour).
 * Returns the fresh downloadUrl.
 */
export async function refreshDownloadUrl(itemId: string, driveId?: string): Promise<string> {
  const path = driveId
    ? `/drives/${driveId}/items/${itemId}?$select=id,@microsoft.graph.downloadUrl`
    : `/me/drive/items/${itemId}?$select=id,@microsoft.graph.downloadUrl`;
  const item = await graphGet<GraphDriveItem>(path);
  const fresh = item['@microsoft.graph.downloadUrl'];
  if (!fresh) throw new Error(`No downloadUrl for item ${itemId}`);
  return fresh;
}
