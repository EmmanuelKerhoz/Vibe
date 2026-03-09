import type { Section, SongVersion } from '../types';

export type SimilaritySectionMatch = {
  name: string;
  score: number;
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
};

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (text: string) =>
  normalizeText(text)
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length > 2);

const getSongLines = (song: Section[]) =>
  song
    .flatMap(section => section.lines.map(line => normalizeText(line.text)))
    .filter(Boolean);

const getSongTokens = (song: Section[]) => getSongLines(song).flatMap(tokenize);

const ratio = (intersection: number, union: number) => (union > 0 ? intersection / union : 0);

const getSetOverlapRatio = (left: string[], right: string[]) => {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter(value => rightSet.has(value)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return ratio(intersection, union);
};

const getSharedKeywords = (currentSong: Section[], candidateSong: Section[]) => {
  const currentCounts = new Map<string, number>();
  const candidateCounts = new Map<string, number>();

  for (const token of getSongTokens(currentSong)) {
    currentCounts.set(token, (currentCounts.get(token) || 0) + 1);
  }

  for (const token of getSongTokens(candidateSong)) {
    candidateCounts.set(token, (candidateCounts.get(token) || 0) + 1);
  }

  return [...currentCounts.entries()]
    .filter(([token]) => candidateCounts.has(token))
    .map(([token, count]) => ({
      token,
      weight: count + (candidateCounts.get(token) || 0),
    }))
    .sort((a, b) => b.weight - a.weight || a.token.localeCompare(b.token))
    .slice(0, 5)
    .map(item => item.token);
};

const getMatchedSections = (currentSong: Section[], candidateSong: Section[]) => {
  const candidateByName = new Map(
    candidateSong.map(section => [normalizeText(section.name), section] as const),
  );

  return currentSong
    .map((section) => {
      const candidateSection = candidateByName.get(normalizeText(section.name));
      if (!candidateSection) return null;

      const sectionScore = Math.round(
        getSetOverlapRatio(
          section.lines.map(line => normalizeText(line.text)).filter(Boolean),
          candidateSection.lines.map(line => normalizeText(line.text)).filter(Boolean),
        ) * 100,
      );

      if (sectionScore === 0) return null;

      return {
        name: section.name,
        score: sectionScore,
      };
    })
    .filter((section): section is SimilaritySectionMatch => section !== null)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
};

const calculateSimilarity = (currentSong: Section[], candidateSong: Section[]) => {
  const currentLines = getSongLines(currentSong);
  const candidateLines = getSongLines(candidateSong);
  const currentTokens = getSongTokens(currentSong);
  const candidateTokens = getSongTokens(candidateSong);
  const currentSections = currentSong.map(section => normalizeText(section.name));
  const candidateSections = candidateSong.map(section => normalizeText(section.name));

  const lineScore = getSetOverlapRatio(currentLines, candidateLines);
  const tokenScore = getSetOverlapRatio(currentTokens, candidateTokens);
  const structureScore = getSetOverlapRatio(currentSections, candidateSections);

  return Math.round((tokenScore * 0.6 + lineScore * 0.3 + structureScore * 0.1) * 100);
};

/**
 * Calculate similarity with full metadata (exported for library use)
 */
export const calculateSimilarityWithMetadata = (
  currentSong: Section[],
  candidateSong: Section[],
): Omit<SimilarityMatch, 'versionId' | 'versionName' | 'title' | 'timestamp'> => {
  const currentTokens = getSongTokens(currentSong);
  const candidateTokens = getSongTokens(candidateSong);
  const candidateTokenSet = new Set(candidateTokens);
  
  const currentLines = getSongLines(currentSong);
  const candidateLines = getSongLines(candidateSong);
  const candidateLineSet = new Set(candidateLines);

  const sharedWords = new Set(currentTokens.filter(token => candidateTokenSet.has(token))).size;
  const sharedLines = new Set(currentLines.filter(line => candidateLineSet.has(line))).size;

  return {
    score: calculateSimilarity(currentSong, candidateSong),
    sharedWords,
    sharedLines,
    sharedKeywords: getSharedKeywords(currentSong, candidateSong),
    matchedSections: getMatchedSections(currentSong, candidateSong).slice(0, 3),
  };
};

/**
 * Get top similar matches from version history (original behavior)
 */
export const getTopSimilarSongMatches = (
  currentSong: Section[],
  versions: SongVersion[],
  threshold = 50,
  limit = 3,
): SimilarityMatch[] => {
  if (currentSong.length === 0) return [];

  const currentTokens = getSongTokens(currentSong);
  const currentLines = getSongLines(currentSong);

  return versions
    .filter(version => version.song.length > 0)
    .map((version) => {
      const candidateTokens = getSongTokens(version.song);
      const candidateTokenSet = new Set(candidateTokens);
      const candidateLines = getSongLines(version.song);
      const candidateLineSet = new Set(candidateLines);

      const sharedWords = new Set(currentTokens.filter(token => candidateTokenSet.has(token))).size;
      const sharedLines = new Set(currentLines.filter(line => candidateLineSet.has(line))).size;

      return {
        versionId: version.id,
        versionName: version.name,
        title: version.title,
        timestamp: version.timestamp,
        score: calculateSimilarity(currentSong, version.song),
        sharedWords,
        sharedLines,
        sharedKeywords: getSharedKeywords(currentSong, version.song),
        matchedSections: getMatchedSections(currentSong, version.song).slice(0, 3),
      };
    })
    .filter(match => match.score > threshold)
    .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
    .slice(0, limit);
};
