import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateAndPoll, generateClip } from './lyriaService';

const jsonResponse = (body: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: vi.fn().mockResolvedValue(body),
  text: vi.fn().mockResolvedValue(JSON.stringify(body)),
});

describe('lyriaService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends generation requests through the same-origin proxy with an abort signal', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({
      id: 'clip-1',
      title: 'Preview',
      status: 'complete',
      audioUrl: 'data:audio/wav;base64,abc',
      synthIdWatermarked: true,
      durationSeconds: null,
      model: 'lyria-3-clip-preview',
      prompt: 'prompt',
      createdAt: '2026-05-19T00:00:00.000Z',
      errorMessage: null,
    } as Response));
    const controller = new AbortController();

    await expect(generateClip({
      lyrics: 'hello',
      style: 'afrobeats',
      mode: 'clip',
    }, controller.signal)).resolves.toMatchObject({ id: 'clip-1', status: 'complete' });

    expect(fetchMock).toHaveBeenCalledWith('/api/lyria/generate', expect.objectContaining({
      method: 'POST',
      signal: controller.signal,
    }));
  });

  it('does not poll /api/lyria/get for full-song generations that finish synchronously', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({
      id: 'full-1',
      title: 'Full Song',
      status: 'complete',
      audioUrl: 'https://example.test/full.wav',
      synthIdWatermarked: true,
      durationSeconds: null,
      model: 'lyria-3-pro-preview',
      prompt: 'prompt',
      createdAt: '2026-05-19T00:00:00.000Z',
      errorMessage: null,
    } as Response));

    await expect(generateAndPoll({
      lyrics: 'hello',
      style: 'afrobeats',
      mode: 'full',
    })).resolves.toMatchObject({ id: 'full-1', status: 'complete' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/api/lyria/get'), expect.anything());
  });

  it('polls clip generations until the proxy returns a complete clip', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({
        id: 'clip-pending',
        title: 'Preview',
        status: 'processing',
        audioUrl: null,
        synthIdWatermarked: false,
        durationSeconds: null,
        model: 'lyria-3-clip-preview',
        prompt: 'prompt',
        createdAt: '2026-05-19T00:00:00.000Z',
        errorMessage: null,
      } as Response))
      .mockResolvedValueOnce(jsonResponse({
        id: 'clip-pending',
        title: 'Preview',
        status: 'complete',
        audioUrl: 'data:audio/wav;base64,abc',
        synthIdWatermarked: true,
        durationSeconds: null,
        model: 'lyria-3-clip-preview',
        prompt: 'prompt',
        createdAt: '2026-05-19T00:00:00.000Z',
        errorMessage: null,
      } as Response));

    const resultPromise = generateAndPoll({
      lyrics: 'hello',
      style: 'afrobeats',
      mode: 'clip',
    }, { intervalMs: 100, timeoutMs: 1_000 });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(100);

    await expect(resultPromise).resolves.toMatchObject({ id: 'clip-pending', status: 'complete' });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/lyria/get?id=clip-pending', expect.anything());
  });
});
