import type { Section } from '../types';
import { getSectionText, getSongText } from './songUtils';
import { logger } from './logger';

export type CopyrightMatch = {
  score: number;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  matchedLines: string[];
  matchedSections: Array<{ name: string; score: number }>;
  sharedWords: number;
  sharedLines: number;
  sharedKeywords: string[];
  source: 'genius' | 'musixmatch' | 'azlyrics' | 'local';
  copyrightHolder?: string;
  riskLevel: 'high' | 'medium' | 'low';
};

/** Default timeout for the copyright similarity API call. */
const COPYRIGHT_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Build an AbortSignal that fires after `timeoutMs` and is also aborted if the
 * caller-provided `parentSignal` aborts.
 */
const makeTimeoutSignal = (
  timeoutMs: number,
  parentSignal?: AbortSignal,
): { signal: AbortSignal; cleanup: () => void } => {
  const controller = new AbortController();
  const onParentAbort = () => controller.abort(parentSignal?.reason);
  if (parentSignal) {
    if (parentSignal.aborted) controller.abort(parentSignal.reason);
    else parentSignal.addEventListener('abort', onParentAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      parentSignal?.removeEventListener('abort', onParentAbort);
    },
  };
};

/**
 * Check similarity against worldwide copyrighted songs
 * Uses multiple lyrics APIs and databases
 */
export const checkCopyrightSimilarity = async (
  currentSong: Section[],
  threshold = 30,
  limit = 10,
  options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<CopyrightMatch[]> => {
  if (currentSong.length === 0) return [];

  const songText = getSongText(currentSong);

  const keywords = extractKeywords(songText);

  const { signal, cleanup } = makeTimeoutSignal(
    options?.timeoutMs ?? COPYRIGHT_REQUEST_TIMEOUT_MS,
    options?.signal,
  );

  try {
    const response = await fetch('/api/copyright/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lyrics: songText,
        keywords,
        sections: currentSong.map(s => ({
          name: s.name,
          text: getSectionText(s)
        })),
        threshold,
        limit
      }),
      signal,
    });

    if (!response.ok) {
      logger.warn('Copyright API unavailable, feature disabled');
      return [];
    }

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    logger.warn('Copyright check failed:', error);
    return [];
  } finally {
    cleanup();
  }
};

const extractKeywords = (text: string): string[] => {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she',
    'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  ]);

  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordFreq = new Map<string, number>();

  words.forEach(word => {
    if (word.length > 3 && !stopWords.has(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  });

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
};

export const getRiskLevelColor = (level: 'high' | 'medium' | 'low'): string => {
  switch (level) {
    case 'high': return 'text-red-500 bg-red-500/10 border-red-500/30';
    case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    case 'low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
  }
};

export const getRiskLevelLabel = (level: 'high' | 'medium' | 'low'): string => {
  switch (level) {
    case 'high': return 'High Risk';
    case 'medium': return 'Medium Risk';
    case 'low': return 'Low Risk';
  }
};
