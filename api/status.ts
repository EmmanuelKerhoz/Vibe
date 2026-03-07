import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const available = Boolean(process.env.GEMINI_API_KEY);
  res.status(200).json({ available });
}
