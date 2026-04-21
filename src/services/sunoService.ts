/**
 * sunoService.ts
 * Client-side Suno service — talks exclusively to our own Vercel proxy.
 * Zero secrets in the bundle. Zero direct calls to gcui-art or EvoLink.
 *
 * Endpoints (all same-origin):
 *   POST /api/suno/generate
 *   GET  /api/suno/get?ids=...
 *   POST /api/suno/extend
 *
 * The mode switch (dev cookie vs EvoLink) is handled server-side in api/suno/_sunoProxy.ts.
 * The only client-visible KPI is 'mode', read from VITE_SUNO_MODE (safe: not a secret).
 */

import type {
  SunoGenerateParams,
  SunoSong,
  SunoKPISnapshot,
} from '../types/suno';

// Safe: indicates UI label only, not a credential
const CLIENT_MODE = (import.meta.env.VITE_SUNO_MODE as string | undefined) ?? 'dev';

// ─── KPI store ────────────────────────────────────────────────────────────────
let _kpi: SunoKPISnapshot = {
  totalRequests: 0,
  successCount: 0,
  errorCount: 0,
  pendingCount: 0,
  lastGenerationMs: null,
  lastError: null,
  mode: CLIENT_MODE as 'dev' | 'prod',
};

export function getKPISnapshot(): SunoKPISnapshot {
  return { ..._kpi };
}

function pending(delta: number) {
  _kpi = { ..._kpi, pendingCount: Math.max(0, _kpi.pendingCount + delta) };
}

// ─── Internal fetch ───────────────────────────────────────────────────────────
async function proxyFetch<T>(path: string, init?: RequestInit): Promise<T> {
  _kpi = { ..._kpi, totalRequests: _kpi.totalRequests + 1 };
  const t0 = performance.now();
  try {
    const res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`[Suno] ${res.status}: ${text}`);
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

export async function generateSong(params: SunoGenerateParams): Promise<SunoSong[]> {
  pending(+1);
  try {
    return await proxyFetch<SunoSong[]>('/api/suno/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  } finally {
    pending(-1);
  }
}

export async function getSongStatus(ids: string[]): Promise<SunoSong[]> {
  return proxyFetch<SunoSong[]>(`/api/suno/get?ids=${ids.join(',')}`);
}

export async function extendSong(
  songId: string,
  continueAt: number,
  prompt?: string,
): Promise<SunoSong[]> {
  pending(+1);
  try {
    return await proxyFetch<SunoSong[]>('/api/suno/extend', {
      method: 'POST',
      body: JSON.stringify({ songId, continueAt, prompt }),
    });
  } finally {
    pending(-1);
  }
}

export async function pollUntilDone(
  ids: string[],
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<SunoSong[]> {
  const { intervalMs = 3000, timeoutMs = 300_000 } = opts;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const songs = await getSongStatus(ids);
    const allDone = songs.every((s) => s.status === 'complete' || s.status === 'error');
    if (allDone) return songs;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('[Suno] pollUntilDone: timeout exceeded');
}
