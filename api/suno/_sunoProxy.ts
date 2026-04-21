/**
 * _sunoProxy.ts  (underscore = not a Vercel route)
 * Shared upstream fetch helper for all /api/suno/* functions.
 *
 * Reads server-only env vars (no VITE_ prefix):
 *   SUNO_MODE        'dev' | 'prod'   (default: 'dev')
 *   SUNO_DEV_URL     gcui-art base URL (e.g. https://your-gcui-art.railway.app)
 *   SUNO_COOKIE      full cookie string for gcui-art auth
 *   EVOLINK_API_KEY  EvoLink Bearer token
 */

const MODE = process.env.SUNO_MODE ?? 'dev';
const IS_PROD = MODE === 'prod';

const DEV_BASE = process.env.SUNO_DEV_URL ?? 'http://localhost:3000';
const PROD_BASE = 'https://api.evolink.ai/v1';
const BASE = IS_PROD ? PROD_BASE : DEV_BASE;

/** Map of short endpoint names to upstream paths for each mode */
const PATHS: Record<'dev' | 'prod', Record<string, string>> = {
  dev:  { generate: '/api/generate', get: '/api/get', extend_audio: '/api/extend_audio' },
  prod: { generate: '/suno/generate', get: '/suno/get', extend_audio: '/suno/extend_audio' },
};

export function upstreamPath(name: string): string {
  return PATHS[IS_PROD ? 'prod' : 'dev'][name] ?? `/${name}`;
}

function authHeaders(): Record<string, string> {
  if (IS_PROD) {
    const key = process.env.EVOLINK_API_KEY;
    if (!key) throw new Error('[SunoProxy] EVOLINK_API_KEY is not configured');
    return { Authorization: `Bearer ${key}` };
  }
  const cookie = process.env.SUNO_COOKIE;
  if (!cookie) throw new Error('[SunoProxy] SUNO_COOKIE is not configured');
  return { Cookie: cookie };
}

export async function sunoFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[SunoProxy] ${res.status} ${res.statusText}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<unknown>;
}
