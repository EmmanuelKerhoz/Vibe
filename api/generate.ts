import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// M4 fix: internal timeout 55s (under Vercel's 60s maxDuration).
// Prevents the handler from hanging silently if Gemini freezes.
const GEMINI_TIMEOUT_MS = 55_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  try {
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Request body must be a JSON object' });
      return;
    }

    const { model, contents, config } = req.body as {
      model: string;
      contents: string;
      config?: Record<string, unknown>;
    };

    if (!model || !contents) {
      res.status(400).json({ error: 'Missing required fields: model, contents' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    let response;
    try {
      response = await ai.models.generateContent({ model, contents, config });
    } finally {
      clearTimeout(timer);
    }

    if (controller.signal.aborted) {
      res.status(504).json({ error: 'AI generation timed out. Please try again.' });
      return;
    }

    res.status(200).json({ text: response.text ?? '' });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown server error';
    const isAbort = error instanceof DOMException && error.name === 'AbortError';
    if (isAbort) {
      res.status(504).json({ error: 'AI generation timed out. Please try again.' });
      return;
    }
    const code =
      error instanceof Error && 'code' in error
        ? (error as { code?: number }).code
        : undefined;
    const status =
      typeof code === 'number' && code >= 400 && code < 600 ? code : 500;
    res.status(status).json({ error: message });
  }
}
