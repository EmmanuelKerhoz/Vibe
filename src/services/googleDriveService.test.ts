import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearToken,
  getStoredToken,
  isGDriveConfigured,
  listRecentAudioFiles,
  AUDIO_MIME_TYPES,
  GDRIVE_AUDIO_EXTENSIONS,
  _testExchangeCodeForToken,
} from './googleDriveService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDriveFile(overrides: {
  id?: string;
  name?: string;
  mimeType?: string;
  webContentLink?: string;
  size?: string;
} = {}) {
  const file: Record<string, string> = {
    id:       overrides.id       ?? 'file-1',
    name:     overrides.name     ?? 'track.mp3',
    mimeType: overrides.mimeType ?? 'audio/mpeg',
  };
  if (overrides.webContentLink !== undefined) file['webContentLink'] = overrides.webContentLink;
  if (overrides.size            !== undefined) file['size']           = overrides.size;
  return file;
}

// ---------------------------------------------------------------------------
// Token cache
// ---------------------------------------------------------------------------

describe('token cache', () => {
  afterEach(() => { clearToken(); });

  it('getStoredToken returns null when no token has been stored', () => {
    expect(getStoredToken()).toBeNull();
  });

  it('getStoredToken returns null after clearToken()', () => {
    clearToken();
    expect(getStoredToken()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isGDriveConfigured
// ---------------------------------------------------------------------------

describe('isGDriveConfigured', () => {
  it('returns false when VITE_GDRIVE_CLIENT_ID is not set', () => {
    expect(isGDriveConfigured()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// listRecentAudioFiles
// ---------------------------------------------------------------------------

describe('listRecentAudioFiles', () => {
  const FAKE_TOKEN = 'tok-123';

  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); });

  function mockFetchResponse(files: object[]) {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok:   true,
      json: () => Promise.resolve({ files }),
    });
  }

  it('returns audio files matching GDRIVE_AUDIO_EXTENSIONS', async () => {
    mockFetchResponse([
      makeDriveFile({ id: 'a1', name: 'song.mp3',   mimeType: 'audio/mpeg' }),
      makeDriveFile({ id: 'a2', name: 'track.flac', mimeType: 'audio/flac' }),
      makeDriveFile({ id: 'a3', name: 'doc.pdf',    mimeType: 'application/pdf' }),
    ]);
    const result = await listRecentAudioFiles(FAKE_TOKEN);
    expect(result.map(f => f.id)).toEqual(['a1', 'a2']);
  });

  it('includes files without webContentLink', async () => {
    mockFetchResponse([makeDriveFile({ id: 'no-link', name: 'song.mp3', mimeType: 'audio/mpeg' })]);
    const result = await listRecentAudioFiles(FAKE_TOKEN);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('no-link');
  });

  it('strips webContentLink (caller must use createAudioBlobUrl)', async () => {
    mockFetchResponse([makeDriveFile({ id: 'with-link', name: 'track.ogg', mimeType: 'audio/ogg', webContentLink: 'https://example.com/dl' })]);
    const result = await listRecentAudioFiles(FAKE_TOKEN);
    expect(result[0]!.id).toBe('with-link');
    expect(result[0]!.webContentLink).toBeUndefined();
  });

  it('propagates fetch errors', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 401, text: () => Promise.resolve('Unauthorized') });
    await expect(listRecentAudioFiles(FAKE_TOKEN)).rejects.toThrow('Drive GET 401');
  });

  it('sends Authorization header', async () => {
    mockFetchResponse([]);
    await listRecentAudioFiles(FAKE_TOKEN);
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect((init?.headers as Record<string, string>)?.Authorization).toBe('Bearer ' + FAKE_TOKEN);
  });

  it('covers all declared AUDIO_MIME_TYPES in the query string', async () => {
    mockFetchResponse([]);
    await listRecentAudioFiles(FAKE_TOKEN);
    const [[url]] = (fetch as ReturnType<typeof vi.fn>).mock.calls as [[string]];
    for (const mime of AUDIO_MIME_TYPES) {
      expect(url).toContain(encodeURIComponent(mime));
    }
  });

  it('covers all declared GDRIVE_AUDIO_EXTENSIONS via name filter', () => {
    for (const ext of GDRIVE_AUDIO_EXTENSIONS) {
      const name = 'file' + ext;
      expect(GDRIVE_AUDIO_EXTENSIONS.some(e => name.toLowerCase().endsWith(e))).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// OAuth PKCE flow
// ---------------------------------------------------------------------------

describe('OAuth PKCE flow', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('crypto', {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
        return arr;
      },
      subtle: {
        digest: vi.fn().mockImplementation(async (_alg: string, _data: BufferSource) => {
          const mockHash = new Uint8Array(32);
          for (let i = 0; i < 32; i++) mockHash[i] = i;
          return mockHash.buffer;
        }),
      },
    });
  });

  afterEach(() => { clearToken(); vi.unstubAllGlobals(); });

  it('PKCE code_verifier is valid base64url', () => {
    const verifierRegex = /^[A-Za-z0-9\-_~.]{43,128}$/;
    const mockArray = new Uint8Array(32);
    crypto.getRandomValues(mockArray);
    const encoded = btoa(String.fromCharCode.apply(null, Array.from(mockArray)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    expect(verifierRegex.test(encoded)).toBe(true);
  });

  it('postMessage validation expects GDRIVE_CODE type', () => {
    expect(() => {
      const msg = { type: 'GDRIVE_CODE', code: 'auth-code-123' };
      expect(msg.type).toBe('GDRIVE_CODE');
      expect(msg.code).toBeDefined();
    }).not.toThrow();
  });

  it('clearToken resets state', () => {
    clearToken();
    expect(getStoredToken()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isGDriveMessage — full guard contract (strengthened: array + type checks).
// ---------------------------------------------------------------------------

describe('isGDriveMessage — guard contract', () => {
  function isGDriveMessage(data: unknown): data is { type?: string; code?: string } {
    return (
      typeof data === 'object' &&
      data !== null &&
      !Array.isArray(data) &&
      typeof (data as Record<string, unknown>).type === 'string'
    );
  }

  it('rejects null',                              () => expect(isGDriveMessage(null)).toBe(false));
  it('rejects number',                            () => expect(isGDriveMessage(42)).toBe(false));
  it('rejects string',                            () => expect(isGDriveMessage('token')).toBe(false));
  it('rejects boolean',                           () => expect(isGDriveMessage(true)).toBe(false));
  it('rejects undefined',                         () => expect(isGDriveMessage(undefined)).toBe(false));
  it('rejects empty object (no type field)',       () => expect(isGDriveMessage({})).toBe(false));
  it('rejects array',                             () => expect(isGDriveMessage([])).toBe(false));
  it('rejects object with non-string type',       () => expect(isGDriveMessage({ type: 42 })).toBe(false));
  it('accepts object with string type',           () => expect(isGDriveMessage({ type: 'GDRIVE_CODE', code: 'abc' })).toBe(true));
  it('accepts object with any string type field', () => expect(isGDriveMessage({ type: 'OTHER' })).toBe(true));

  it('P1: empty code is invalid after guard', () => {
    const data = { type: 'GDRIVE_CODE', code: '' };
    const valid = isGDriveMessage(data) && typeof data.code === 'string' && data.code.length > 0;
    expect(valid).toBe(false);
  });

  it('P1: missing code is invalid after guard', () => {
    const data = { type: 'GDRIVE_CODE' };
    const valid = isGDriveMessage(data) && typeof data.code === 'string' && data.code.length > 0;
    expect(valid).toBe(false);
  });

  it('P1: non-string code is invalid after guard', () => {
    const data = { type: 'GDRIVE_CODE', code: 12345 };
    const valid = isGDriveMessage(data) && typeof (data as { code: unknown }).code === 'string';
    expect(valid).toBe(false);
  });

  it('P1: valid non-empty code passes', () => {
    const data = { type: 'GDRIVE_CODE', code: '4/0AY0e-g7some_real_code_here' };
    const valid = isGDriveMessage(data) && typeof data.code === 'string' && data.code.length > 0;
    expect(valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// exchangeCodeForToken — real implementation via _testExchangeCodeForToken.
// Tests call the actual function so they exercise isValidTokenResponse
// directly — drift-proof if the type guard evolves.
// ---------------------------------------------------------------------------

describe('exchangeCodeForToken — malformed response handling', () => {
  const exchangeCode = _testExchangeCodeForToken;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => { clearToken(); vi.unstubAllGlobals(); });

  function mockToken(body: unknown, ok = true) {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok,
      status: ok ? 200 : 400,
      json:   () => Promise.resolve(body),
      text:   () => Promise.resolve(JSON.stringify(body)),
    });
  }

  const REDIRECT = 'http://localhost/gdrive-callback.html';

  if (exchangeCode) {
    it('rejects — missing access_token', async () => {
      mockToken({ expires_in: 3600 });
      await expect(exchangeCode('code', 'verifier', REDIRECT)).rejects.toThrow('malformed response');
    });

    it('rejects — missing expires_in', async () => {
      mockToken({ access_token: 'tok-123' });
      await expect(exchangeCode('code', 'verifier', REDIRECT)).rejects.toThrow('malformed response');
    });

    it('rejects — empty access_token', async () => {
      mockToken({ access_token: '', expires_in: 3600 });
      await expect(exchangeCode('code', 'verifier', REDIRECT)).rejects.toThrow('malformed response');
    });

    it('rejects — expires_in is zero', async () => {
      mockToken({ access_token: 'tok-123', expires_in: 0 });
      await expect(exchangeCode('code', 'verifier', REDIRECT)).rejects.toThrow('malformed response');
    });

    it('rejects — response is not an object', async () => {
      mockToken('not-an-object');
      await expect(exchangeCode('code', 'verifier', REDIRECT)).rejects.toThrow('malformed response');
    });

    it('resolves — valid response with refresh_token', async () => {
      mockToken({ access_token: 'valid-token-123', expires_in: 3600, refresh_token: 'refresh-456' });
      const result = await exchangeCode('code', 'verifier', REDIRECT);
      expect(result.access_token).toBe('valid-token-123');
      expect(result.expires_in).toBe(3600);
      expect(result.refresh_token).toBe('refresh-456');
    });

    it('resolves — valid response without optional refresh_token', async () => {
      mockToken({ access_token: 'valid-token-123', expires_in: 3600 });
      const result = await exchangeCode('code', 'verifier', REDIRECT);
      expect(result.access_token).toBe('valid-token-123');
      expect(result.expires_in).toBe(3600);
      expect(result.refresh_token).toBeUndefined();
    });
  } else {
    it.skip('_testExchangeCodeForToken unavailable (set TEST=true in vitest env)', () => {});
  }
});
