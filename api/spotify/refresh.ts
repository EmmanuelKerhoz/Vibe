import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/spotify/refresh
 * Silently refreshes an access token using a refresh token.
 *
 * Body: { refresh_token: string }
 * Returns: SpotifyTokenResponse (without refresh_token field — Spotify only issues one on first auth)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).json({ error: 'Spotify credentials not configured on server.' });
    return;
  }

  const { refresh_token } = req.body as { refresh_token?: string };

  if (!refresh_token) {
    res.status(400).json({ error: 'Missing required field: refresh_token' });
    return;
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
    });

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: params.toString(),
    });

    const data = await tokenRes.json() as Record<string, unknown>;

    if (!tokenRes.ok) {
      res.status(tokenRes.status).json({ error: (data['error_description'] as string) ?? 'Token refresh failed' });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
