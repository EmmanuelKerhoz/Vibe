/**
 * lyriaService.ts
 * Client-side Lyria service — talks exclusively to our own Vercel proxy.
 * Zero secrets in the bundle. Zero direct calls to Google GenAI.
 *
 * Proxy endpoints (same-origin):
 *   POST /api/lyria/generate  → starts a clip or full-song generation
 *   GET  /api/lyria/get?id=…  → polls generation status
 *
 * Mode switch (clip / full) is determined by LyriaGenerateParams.mode.
 */

import type {
  LyriaGenerateParams,
  LyriaClip,
  LyriaKPISnapshot,
} from '../types/lyria';

// ─── KPI store ────────────────────────────────────────────────────────────────
let _kpi: LyriaKPISnapshot = {
  totalRequests: 0,
  successCount: 0,
  errorCount: 0,
  pendingCount: 0,
  lastGenerationMs: null,
  lastError: null,
};

export function getLyriaKPISnapshot(): LyriaKPISnapshot {
  return { ..._kpi };
}

function pending(delta: number): void {
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
      throw new Error(`[Lyria] ${res.status}: ${text}`);
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
 * Kick off a Lyria generation (clip ≈30s or full ≈3min).
 * Returns immediately with an in-progress LyriaClip; poll with getClipStatus.
 */
export async function generateClip(params: LyriaGenerateParams): Promise<LyriaClip> {
  pending(+1);
  try {
    return await proxyFetch<LyriaClip>('/api/lyria/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  } finally {
    pending(-1);
  }
}

/** Poll the status of a previously submitted generation. */
export async function getClipStatus(id: string): Promise<LyriaClip> {
  return proxyFetch<LyriaClip>(`/api/lyria/get?id=${encodeURIComponent(id)}`);
}

/**
 * Convenience: generate + poll until done or error.
 * @param opts.intervalMs  polling interval (default 3 000 ms)
 * @param opts.timeoutMs   hard timeout (default 120 000 ms for clip, 360 000 for full)
 */
export async function generateAndPoll(
  params: LyriaGenerateParams,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<LyriaClip> {
  const defaultTimeout = params.mode === 'clip' ? 120_000 : 360_000;
  const { intervalMs = 3_000, timeoutMs = defaultTimeout } = opts;

  const clip = await generateClip(params);
  if (clip.status === 'complete') return clip;
  if (clip.status === 'error') throw new Error(clip.errorMessage ?? '[Lyria] generation failed');

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise<void>((r) => setTimeout(r, intervalMs));
    const updated = await getClipStatus(clip.id);
    if (updated.status === 'complete') return updated;
    if (updated.status === 'error') throw new Error(updated.errorMessage ?? '[Lyria] generation failed');
  }
  throw new Error('[Lyria] generateAndPoll: timeout exceeded');
}
