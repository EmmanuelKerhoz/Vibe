import type { Section } from '../types';
import { getSectionText, getSongText } from './songUtils';

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

/**
 * Check similarity against worldwide copyrighted songs
 * Uses multiple lyrics APIs and databases
 */
export const checkCopyrightSimilarity = async (
  currentSong: Section[],
  threshold = 30,
  limit = 10,
): Promise<CopyrightMatch[]> => {
  if (currentSong.length === 0) return [];

  const songText = getSongText(currentSong);

  const keywords = extractKeywords(songText);

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
    });

    if (!response.ok) {
      console.warn('Copyright API unavailable, feature disabled');
      return [];
    }

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.warn('Copyright check failed:', error);
    return [];
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
