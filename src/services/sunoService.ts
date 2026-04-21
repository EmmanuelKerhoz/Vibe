/**
 * sunoService.ts
 * Suno music generation service.
 * DEV  → gcui-art self-hosted wrapper (cookie-based, uses your Suno subscription)
 * PROD → EvoLink.ai REST API (Bearer token, pay-per-use)
 *
 * Switch is driven by VITE_SUNO_MODE env var:
 *   VITE_SUNO_MODE=dev   → gcui-art  (default if unset)
 *   VITE_SUNO_MODE=prod  → EvoLink
 *
 * Required env vars:
 *   DEV:  VITE_SUNO_COOKIE      — Suno __clerk_db_jwt session cookie
 *         VITE_SUNO_DEV_URL     — gcui-art base URL (e.g. http://localhost:3000)
 *   PROD: VITE_EVOLINK_API_KEY  — EvoLink Bearer token
 */

import type {
  SunoGenerateParams,
  SunoSong,
  SunoTaskStatus,
  SunoKPISnapshot,
} from '../types/suno';

const MODE = (import.meta.env.VITE_SUNO_MODE as string | undefined) ?? 'dev';
const IS_PROD = MODE === 'prod';

// ─── Endpoints ───────────────────────────────────────────────────────────────
const DEV_BASE =
  (import.meta.env.VITE_SUNO_DEV_URL as string | undefined) ??
  'http://localhost:3000';
const PROD_BASE = 'https://api.evolink.ai/v1';

const BASE = IS_PROD ? PROD_BASE : DEV_BASE;

// ─── KPI store (in-memory, exposed via useSuno hook) ─────────────────────────
let _kpi: SunoKPISnapshot = {
  totalRequests: 0,
  successCount: 0,
  errorCount: 0,
  pendingCount: 0,
  lastGenerationMs: null,
  lastError: null,
  mode: MODE as 'dev' | 'prod',
};

export function getKPISnapshot(): SunoKPISnapshot {
  return { ..._kpi };
}

function resetPending(delta: number) {
  _kpi = { ..._kpi, pendingCount: Math.max(0, _kpi.pendingCount + delta) };
}

// ─── Auth headers ─────────────────────────────────────────────────────────────
function headers(): HeadersInit {
  if (IS_PROD) {
    const key = import.meta.env.VITE_EVOLINK_API_KEY as string | undefined;
    if (!key) throw new Error('[SunoService] VITE_EVOLINK_API_KEY is not set');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
  }
  const cookie = import.meta.env.VITE_SUNO_COOKIE as string | undefined;
  if (!cookie) throw new Error('[SunoService] VITE_SUNO_COOKIE is not set');
  return { 'Content-Type': 'application/json', Cookie: cookie };
}

// ─── Internal fetch wrapper ───────────────────────────────────────────────────
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  _kpi = { ..._kpi, totalRequests: _kpi.totalRequests + 1 };
  const t0 = performance.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { ...headers(), ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`[SunoService] ${res.status} ${res.statusText}: ${text}`);
    }
    const json = (await res.json()) as T;
    _kpi = {
      ..._kpi,
      successCount: _kpi.successCount + 1,
      lastGenerationMs: Math.round(performance.now() - t0),
      lastError: null,
    };
    return json;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    _kpi = { ..._kpi, errorCount: _kpi.errorCount + 1, lastError: msg };
    throw err;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate one or two songs from a prompt.
 * DEV  → POST /api/generate
 * PROD → POST /suno/generate
 */
export async function generateSong(params: SunoGenerateParams): Promise<SunoSong[]> {
  resetPending(+1);
  try {
    const path = IS_PROD ? '/suno/generate' : '/api/generate';
    const body = IS_PROD
      ? {
          prompt: params.prompt,
          style: params.style,
          title: params.title,
          custom_mode: params.customMode ?? false,
          instrumental: params.instrumental ?? false,
          model: params.model ?? 'chirp-v4',
        }
      : {
          prompt: params.prompt,
          tags: params.style,
          title: params.title,
          make_instrumental: params.instrumental ?? false,
          wait_audio: false,
        };
    const result = await apiFetch<SunoSong[]>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return result;
  } finally {
    resetPending(-1);
  }
}

/**
 * Poll task/song status by IDs.
 * DEV  → GET /api/get?ids=id1,id2
 * PROD → GET /suno/get?ids=id1,id2
 */
export async function getSongStatus(ids: string[]): Promise<SunoSong[]> {
  const path = IS_PROD ? '/suno/get' : '/api/get';
  const qs = `?ids=${ids.join(',')}`;
  return apiFetch<SunoSong[]>(`${path}${qs}`);
}

/**
 * Extend an existing track.
 * DEV  → POST /api/extend_audio
 * PROD → POST /suno/extend_audio
 */
export async function extendSong(
  songId: string,
  continueAt: number,
  prompt?: string,
): Promise<SunoSong[]> {
  resetPending(+1);
  try {
    const path = IS_PROD ? '/suno/extend_audio' : '/api/extend_audio';
    return await apiFetch<SunoSong[]>(path, {
      method: 'POST',
      body: JSON.stringify({ audio_id: songId, continue_at: continueAt, prompt }),
    });
  } finally {
    resetPending(-1);
  }
}

/**
 * Poll until all songs reach a terminal state (complete | error).
 * Resolves with the final song list or rejects after timeout.
 */
export async function pollUntilDone(
  ids: string[],
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<SunoSong[]> {
  const { intervalMs = 3000, timeoutMs = 300_000 } = opts;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const songs = await getSongStatus(ids);
    const allDone = songs.every(
      (s) => s.status === 'complete' || s.status === 'error',
    );
    if (allDone) return songs;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('[SunoService] pollUntilDone: timeout exceeded');
}
