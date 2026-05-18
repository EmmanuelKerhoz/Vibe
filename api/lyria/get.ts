/**
 * api/lyria/get.ts
 * Vercel Serverless Function — GET /api/lyria/get?id=…
 *
 * Polls a Lyria Pro async job status.
 * For clip (synchronous) mode this endpoint is rarely needed,
 * but we expose it for consistency with sunoService polling pattern.
 *
 * In V1, full-song async jobs are not yet implemented in Google GenAI SDK:
 * this endpoint returns a stub 'processing' clip so the client keeps polling
 * without crashing. Replace with real job-status logic when Google stabilises
 * the async API surface.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { LyriaClip } from '../../src/types/lyria';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const id = typeof req.query['id'] === 'string' ? req.query['id'] : null;

  if (!id) {
    res.status(400).json({ error: 'Missing required query param: id' });
    return;
  }

  // TODO: implement real async job polling when Google GenAI Pro async surface stabilises
  // For now: return processing stub — client will time out gracefully via generateAndPoll
  const stub: LyriaClip = {
    id,
    title: 'Lyria Full Song',
    status: 'processing',
    audioUrl: null,
    synthIdWatermarked: true,
    durationSeconds: null,
    model: 'lyria-3-pro',
    prompt: '',
    createdAt: new Date().toISOString(),
    errorMessage: null,
  };

  res.status(200).json(stub);
}
