import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Minimal mock for @google/genai
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({ text: 'mocked response' }),
    },
  })),
}));

// Stub rate limiter to always allow
vi.mock('./_rateLimit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  resolveIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

function makeReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: {},
    body: { model: 'gemini-1.5-pro', contents: 'write a song' },
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as unknown as VercelRequest;
}

function makeRes(): { res: VercelResponse; statusCode: number; body: unknown } {
  const ctx = { statusCode: 200, body: undefined as unknown };
  const res = {
    status: vi.fn().mockImplementation((code: number) => { ctx.statusCode = code; return res; }),
    json: vi.fn().mockImplementation((data: unknown) => { ctx.body = data; }),
    setHeader: vi.fn(),
  } as unknown as VercelResponse;
  return { res, ...ctx };
}

describe('POST /api/generate', () => {
  let handler: (req: VercelRequest, res: VercelResponse) => Promise<void>;

  beforeEach(async () => {
    vi.resetModules();
    process.env.GEMINI_API_KEY = 'test-key';
    const mod = await import('./generate');
    handler = mod.default;
  });

  it('rejects non-POST methods', async () => {
    const { res, statusCode } = makeRes();
    await handler(makeReq({ method: 'GET' }), res);
    expect(statusCode).toBe(405);
  });

  it('rejects disallowed model prefix', async () => {
    const { res, statusCode } = makeRes();
    await handler(makeReq({ body: { model: 'openai-gpt4', contents: 'hello' } }), res);
    expect(statusCode).toBe(400);
  });

  it('rejects contents exceeding max length', async () => {
    const { res, statusCode } = makeRes();
    const longContents = 'x'.repeat(100_001);
    await handler(makeReq({ body: { model: 'gemini-1.5-pro', contents: longContents } }), res);
    expect(statusCode).toBe(400);
  });

  it('drops unknown config keys', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    const mockGenerate = vi.fn().mockResolvedValue({ text: 'ok' });
    (GoogleGenAI as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      models: { generateContent: mockGenerate },
    }));
    const { res } = makeRes();
    await handler(
      makeReq({ body: { model: 'gemini-1.5-pro', contents: 'test', config: { temperature: 0.5, systemInstruction: 'evil' } } }),
      res
    );
    const callArg = mockGenerate.mock.calls[0]?.[0] as { config: Record<string, unknown> };
    expect(callArg?.config).not.toHaveProperty('systemInstruction');
    expect(callArg?.config).toHaveProperty('temperature', 0.5);
  });

  it('drops responseSchema from config (security)', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    const mockGenerate = vi.fn().mockResolvedValue({ text: 'ok' });
    (GoogleGenAI as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      models: { generateContent: mockGenerate },
    }));
    const { res } = makeRes();
    await handler(
      makeReq({ body: { model: 'gemini-pro', contents: 'test', config: { responseSchema: { type: 'object' } } } }),
      res
    );
    const callArg = mockGenerate.mock.calls[0]?.[0] as { config: Record<string, unknown> };
    expect(callArg?.config).not.toHaveProperty('responseSchema');
  });

  it('returns 200 with text on success', async () => {
    const { res, statusCode } = makeRes();
    await handler(makeReq(), res);
    expect(statusCode).toBe(200);
  });
});
