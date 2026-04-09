import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, resolveIp } from './_rateLimit';
import {
  providerGenerate,
  getAllowedModelPrefixes,
  ALLOWED_CONFIG_KEYS,
  getProviderInfo,
} from './_aiProvider';

const MAX_CONTENTS_LENGTH = 100_000;

type SanitizedConfig = Record<string, unknown>;

function sanitizeConfig(raw: Record<string, unknown>): SanitizedConfig {
  const out: SanitizedConfig = {};
  for (const key of ALLOWED_CONFIG_KEYS) {
    if (!(key in raw)) continue;
    const val = raw[key];
    switch (key) {
      case 'temperature':
      case 'topP':
      case 'topK':
      case 'maxOutputTokens':
      case 'candidateCount':
      case 'presencePenalty':
      case 'frequencyPenalty':
      case 'seed':
        if (typeof val === 'number' && isFinite(val)) out[key] = val;
        break;
      case 'stopSequences':
        if (Array.isArray(val) && val.every((s): s is string => typeof s === 'string')) out[key] = val;
        break;
      case 'responseMimeType':
        if (typeof val === 'string') out[key] = val;
        break;
    }
  }
  return out;
}

function sanitiseErrorMessage(msg: string): string {
  return msg.replace(/\bat\s+\S+/g, '').trim().slice(0, 200);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const ip = resolveIp(
    req.headers as Record<string, string | string[] | undefined>,
    req.socket?.remoteAddress,
  );
  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    res.status(429).json({ error: `Rate limit exceeded. Retry after ${rl.retryAfterSec}s.` });
    return;
  }

  const { available } = getProviderInfo();
  if (!available) {
    res.status(500).json({ error: 'AI provider API key is not configured on the server.' });
    return;
  }

  try {
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Request body must be a JSON object' });
      return;
    }

    const { model, contents, config } = req.body as {
      model: string;
      contents: string;
      config?: Record<string, unknown>;
    };

    if (!model || typeof model !== 'string' || !contents || typeof contents !== 'string') {
      res.status(400).json({ error: 'Missing required fields: model (string), contents (string)' });
      return;
    }

    const allowedPrefixes = getAllowedModelPrefixes();
    if (!allowedPrefixes.some(p => model.startsWith(p))) {
      res.status(400).json({ error: `Model "${model}" is not allowed for the active provider.` });
      return;
    }

    if (contents.length > MAX_CONTENTS_LENGTH) {
      res.status(400).json({ error: `Contents exceeds maximum length of ${MAX_CONTENTS_LENGTH} characters` });
      return;
    }

    const sanitizedConfig = config != null && typeof config === 'object'
      ? sanitizeConfig(config)
      : {};

    const text = await providerGenerate({ model, contents, config: sanitizedConfig });
    res.status(200).json({ text });

  } catch (error: unknown) {
    const isAbort =
      (error instanceof DOMException && error.name === 'AbortError') ||
      (error instanceof Error && error.name === 'AbortError');
    if (isAbort) {
      res.status(504).json({ error: 'AI generation timed out. Please try again.' });
      return;
    }

    let message = 'Unknown server error';
    if (error instanceof Error) {
      let parsed = false;
      try {
        const body = JSON.parse(error.message) as { error?: { message?: string } };
        if (typeof body?.error?.message === 'string') { message = body.error.message; parsed = true; }
      } catch { /* not JSON */ }
      if (!parsed) message = sanitiseErrorMessage(error.message) || 'Unknown server error';
    }

    const httpCode = (() => {
      if (!(error instanceof Error)) return 500;
      const e = error as unknown as Record<string, unknown>;
      if (typeof e.status === 'number' && e.status >= 400 && e.status < 600) return e.status;
      if (typeof e.code === 'number' && e.code >= 400 && e.code < 600) return e.code;
      return 500;
    })();

    res.status(httpCode).json({ error: message });
  }
}
