/**
 * api/suno/extend.ts
 * Vercel Serverless Function — POST /api/suno/extend
 *
 * Extends an existing Suno track.
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

  const { songId, continueAt, prompt } = req.body as Record<string, unknown>;
  if (!songId || typeof songId !== 'string') {
    res.status(400).json({ error: 'Missing required field: songId (string)' });
    return;
  }
  if (typeof continueAt !== 'number') {
    res.status(400).json({ error: 'Missing required field: continueAt (number)' });
    return;
  }

  try {
    const data = await sunoFetch(upstreamPath('extend_audio'), {
      method: 'POST',
      body: JSON.stringify({
        audio_id: songId,
        continue_at: continueAt,
        ...(prompt ? { prompt } : {}),
      }),
    });
    res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upstream error';
    res.status(502).json({ error: message });
  }
}
