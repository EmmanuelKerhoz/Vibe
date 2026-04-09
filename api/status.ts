import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProviderInfo } from './_aiProvider';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const { available, provider, model } = getProviderInfo();
  res.status(200).json({ available, provider, model });
}
