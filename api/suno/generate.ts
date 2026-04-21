/**
 * api/suno/generate.ts
 * Vercel Serverless Function — POST /api/suno/generate
 *
 * Proxies to:
 *   DEV  (SUNO_MODE=dev)  → gcui-art wrapper  POST /api/generate
 *   PROD (SUNO_MODE=prod) → EvoLink.ai        POST /suno/generate
 *
 * Secrets (never VITE_ prefixed — server only):
 *   SUNO_MODE        dev | prod  (default: dev)
 *   SUNO_DEV_URL     gcui-art base URL
 *   SUNO_COOKIE      __clerk_db_jwt=...
 *   EVOLINK_API_KEY  Bearer token
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sunoFetch, upstreamPath } from './_sunoProxy';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({ error: 'Body must be JSON' });
    return;
  }

  const { prompt, style, title, customMode, instrumental, model } = req.body as Record<string, unknown>;
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Missing required field: prompt (string)' });
    return;
  }

  const IS_PROD = (process.env.SUNO_MODE ?? 'dev') === 'prod';
  const body = IS_PROD
    ? {
        prompt,
        style: style ?? '',
        title: title ?? '',
        custom_mode: customMode ?? false,
        instrumental: instrumental ?? false,
        model: model ?? 'chirp-v4',
      }
    : {
        prompt,
        tags: style ?? '',
        title: title ?? '',
        make_instrumental: instrumental ?? false,
        wait_audio: false,
      };

  try {
    const data = await sunoFetch(upstreamPath('generate'), {
      method: 'POST',
      body: JSON.stringify(body),
    });
    res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upstream error';
    res.status(502).json({ error: message });
  }
}
