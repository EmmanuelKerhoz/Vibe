import type { RhymeQuality } from './ipaUtils';

export type SimilaritySectionMatch = {
  name: string;
  score: number;
  rhymeQuality?: RhymeQuality; // IPA-based rhyme quality if available
};

export type SimilarityMatch = {
  versionId: string;
  versionName: string;
  title: string;
  timestamp: number;
  score: number;
  sharedWords: number;
  sharedLines: number;
  sharedKeywords: string[];
  matchedSections: SimilaritySectionMatch[];
  rhymeQuality?: RhymeQuality; // Overall rhyme quality if IPA-based
  method?: 'graphemic' | 'ipa-based'; // Which method was used
};

/** String-level similarity — for IPA-level scoring use ipaUtils.ts */
export const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
