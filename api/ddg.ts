import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless proxy for DuckDuckGo Instant Answer API.
 * Avoids CORS issues in production (Vercel). No API key required.
 * GET /api/ddg?q=<query>&format=json&no_html=1&skip_disambig=1
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const q = req.query.q as string | undefined;
  if (!q || q.trim().length === 0) {
    res.status(400).json({ error: 'Missing query parameter: q' });
    return;
  }

  const params = new URLSearchParams({
    q,
    format: 'json',
    no_html: '1',
    skip_disambig: '1',
  });

  try {
    const upstream = await fetch(`https://api.duckduckgo.com/?${params}`, {
      headers: { 'User-Agent': 'Lyricist/1.0 similarity-check' },
      signal: AbortSignal.timeout(6000),
    });

    if (!upstream.ok) {
      res.status(502).json({ error: `DDG upstream error: ${upstream.status}` });
      return;
    }

    const data = await upstream.json();

    // Cache 5 minutes — DDG data doesn't change that fast
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown upstream error';
    res.status(502).json({ error: message });
  }
}
