import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const response = await ai.models.generateContent({ model, contents, config });

    res.status(200).json({ text: response.text ?? '' });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown server error';
    const code =
      error instanceof Error && 'code' in error
        ? (error as { code?: number }).code
        : undefined;
    const status =
      typeof code === 'number' && code >= 400 && code < 600 ? code : 500;
    res.status(status).json({ error: message });
  }
}
