import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless proxy for DuckDuckGo Instant Answer API.
 * Avoids CORS issues in production (Vercel). No API key required.
 * GET /api/ddg?q=<query>&format=json&no_html=1&skip_disambig=1
 *
 * M5 fix: added retry×1 with 300ms backoff on upstream 5xx to absorb
 * transient DDG rate-limiting (502s observed when many sections fire at once).
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

  if (q.length > 500) {
    res.status(400).json({ error: 'Query parameter q exceeds maximum length of 500 characters' });
    return;
  }

  const params = new URLSearchParams({
    q,
    format: 'json',
    no_html: '1',
    skip_disambig: '1',
  });

  const fetchOnce = async (signal: AbortSignal) =>
    fetch(`https://api.duckduckgo.com/?${params}`, {
      headers: { 'User-Agent': 'Lyricist/1.0 similarity-check' },
      signal,
    });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    let upstream = await fetchOnce(controller.signal);

    // Retry once on 5xx with a short backoff
    if (!upstream.ok && upstream.status >= 500) {
      await new Promise(r => setTimeout(r, 300));
      upstream = await fetchOnce(controller.signal);
    }

    clearTimeout(timer);

    if (!upstream.ok) {
      res.status(502).json({ error: `DDG upstream error: ${upstream.status}` });
      return;
    }

    const data = await upstream.json();

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err: unknown) {
    clearTimeout(timer);
    const message = err instanceof Error ? err.message : 'Unknown upstream error';
    res.status(502).json({ error: message });
  }
}
