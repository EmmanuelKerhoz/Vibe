import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/spotify/callback
 * Exchanges a PKCE authorization code for access + refresh tokens.
 * The client_secret never leaves the server.
 *
 * Body: { code: string; redirect_uri: string; code_verifier: string }
 * Returns: SpotifyTokenResponse
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

  const { code, redirect_uri, code_verifier } = req.body as {
    code?: string;
    redirect_uri?: string;
    code_verifier?: string;
  };

  if (!code || !redirect_uri || !code_verifier) {
    res.status(400).json({ error: 'Missing required fields: code, redirect_uri, code_verifier' });
    return;
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      code_verifier,
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
      res.status(tokenRes.status).json({ error: (data['error_description'] as string) ?? 'Token exchange failed' });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
