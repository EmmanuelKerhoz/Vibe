/**
 * api/lyria/generate.ts
 * Vercel Serverless Function — POST /api/lyria/generate
 *
 * Accepts a LyriaGenerateParams body, builds a Lyria prompt,
 * calls Google GenAI Lyria 3 (clip) or Lyria 3 Pro (full),
 * and returns a LyriaClip to the client.
 *
 * Secret: GOOGLE_GENAI_API_KEY (Vercel env — never in bundle)
 *
 * Lyria 3 via @google/genai: uses generateContent with model='lyria-3' or 'lyria-3-pro'
 * Response: base64 audio (wav) in inlineData, or a uri for async jobs.
 * We return audio as a data-URI when synchronous, or a job id for polling.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import type { LyriaGenerateParams, LyriaClip, LyriaStyleDescriptor } from '../../src/types/lyria';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY ?? '' });

function buildPrompt(params: LyriaGenerateParams): string {
  const style: string =
    typeof params.style === 'string'
      ? params.style
      : styleDescriptorToString(params.style);

  const lyricsBlock = params.lyrics.trim()
    ? `\n\nLyrics (use verbatim):\n${params.lyrics.trim()}`
    : '';

  const negBlock = params.negativePrompt
    ? `\n\nAvoid: ${params.negativePrompt}`
    : '';

  return `${style}${lyricsBlock}${negBlock}`.trim();
}

function styleDescriptorToString(s: LyriaStyleDescriptor): string {
  const parts: string[] = [s.genre];
  if (s.mood) parts.push(s.mood);
  if (s.tempo) parts.push(`${s.tempo} bpm`);
  if (s.instruments) parts.push(`instruments: ${s.instruments}`);
  if (s.vocalStyle) parts.push(`vocals: ${s.vocalStyle}`);
  if (s.era) parts.push(`era: ${s.era}`);
  return parts.join(', ');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const params = req.body as LyriaGenerateParams;

  if (!params?.lyrics || !params?.style || !params?.mode) {
    res.status(400).json({ error: 'Missing required fields: lyrics, style, mode' });
    return;
  }

  const modelId = params.mode === 'full' ? 'lyria-3-pro' : 'lyria-3';
  const prompt = buildPrompt(params);
  const clipId = `lyria_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      ...(params.seed != null ? { generationConfig: { seed: params.seed } } : {}),
    });

    // Lyria returns audio in inlineData (base64 wav) for clip mode
    const part = response.candidates?.[0]?.content?.parts?.[0];

    // Synchronous audio response (clip mode)
    if (part && 'inlineData' in part && part.inlineData?.data) {
      const audioDataUri = `data:${part.inlineData.mimeType ?? 'audio/wav'};base64,${part.inlineData.data}`;
      const clip: LyriaClip = {
        id: clipId,
        title: params.title ?? 'Lyria Preview',
        status: 'complete',
        audioUrl: audioDataUri,
        synthIdWatermarked: true,
        durationSeconds: params.mode === 'clip' ? 30 : null,
        model: modelId,
        prompt,
        createdAt: new Date().toISOString(),
        errorMessage: null,
      };
      res.status(200).json(clip);
      return;
    }

    // Async job (Pro / full mode) — return processing status with job id in audioUrl
    const jobUri: string | undefined =
      (part as Record<string, unknown> | undefined)?.['fileData'] != null
        ? String((part as Record<string, unknown>)['fileData'])
        : undefined;

    const clip: LyriaClip = {
      id: clipId,
      title: params.title ?? 'Lyria Full Song',
      status: jobUri ? 'processing' : 'submitted',
      audioUrl: jobUri ?? null,
      synthIdWatermarked: true,
      durationSeconds: null,
      model: modelId,
      prompt,
      createdAt: new Date().toISOString(),
      errorMessage: null,
    };
    res.status(202).json(clip);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const clip: LyriaClip = {
      id: clipId,
      title: params.title ?? 'Lyria Generation',
      status: 'error',
      audioUrl: null,
      synthIdWatermarked: false,
      durationSeconds: null,
      model: modelId,
      prompt,
      createdAt: new Date().toISOString(),
      errorMessage: message,
    };
    res.status(500).json(clip);
  }
}
