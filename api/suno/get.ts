/**
 * api/suno/get.ts
 * Vercel Serverless Function — GET /api/suno/get?ids=id1,id2
 *
 * Polls song status from upstream (gcui-art or EvoLink).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sunoFetch, upstreamPath } from './_sunoProxy';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const ids = req.query['ids'];
  if (!ids || (typeof ids !== 'string' && !Array.isArray(ids))) {
    res.status(400).json({ error: 'Missing required query param: ids' });
    return;
  }
  const idsStr = Array.isArray(ids) ? ids.join(',') : ids;

  // Validate: only alphanumeric + hyphens
  if (!/^[\w\-,]+$/.test(idsStr)) {
    res.status(400).json({ error: 'Invalid ids format' });
    return;
  }

  try {
    const data = await sunoFetch(`${upstreamPath('get')}?ids=${idsStr}`);
    res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upstream error';
    res.status(502).json({ error: message });
  }
}
