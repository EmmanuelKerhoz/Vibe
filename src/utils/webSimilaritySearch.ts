/**
 * Web Similarity Search Engine
 * Hybrid search tree using DuckDuckGo Instant Answer API + Wikipedia Search API
 * No API key required. CORS handled via Vite proxy in dev (see vite.config.ts).
 */

import type { Section } from '../types';
import type { WebSimilarityCandidate, SearchTreeNode, SearchProvider } from '../types/webSimilarity';

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (text: string): string[] =>
  normalize(text)
    .split(' ')
    .filter(t => t.length > 2);

const ngramSet = (tokens: string[], n = 2): Set<string> => {
  const result = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i++) {
    result.add(tokens.slice(i, i + n).join(' '));
  }
  return result;
};

export const jaccardScore = (a: string, b: string): number => {
  const tokA = tokenize(a);
  const tokB = tokenize(b);
  if (tokA.length === 0 || tokB.length === 0) return 0;
  const setA = ngramSet(tokA);
  const setB = ngramSet(tokB);
  const intersection = [...setA].filter(g => setB.has(g)).length;
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
};

// ---------------------------------------------------------------------------
// Segment extraction — hook detection
// ---------------------------------------------------------------------------

export const extractSegments = (sections: Section[]): string[] => {
  const segments: string[] = [];

  // Full text
  const fullText = sections
    .flatMap(s => s.lines.map(l => l.text))
    .filter(Boolean)
    .join(' ');
  if (fullText.trim()) segments.push(fullText);

  // Per section
  for (const section of sections) {
    const sectionText = section.lines.map(l => l.text).filter(Boolean).join(' ');
    if (sectionText.trim()) segments.push(sectionText);
  }

  // Hooks: lines with highest token density (>= 4 tokens, deduplicated)
  const allLines = sections.flatMap(s => s.lines.map(l => l.text)).filter(Boolean);
  const hooks = allLines
    .filter(line => tokenize(line).length >= 4)
    .sort((a, b) => tokenize(b).length - tokenize(a).length)
    .slice(0, 5);
  segments.push(...hooks);

  return [...new Set(segments.filter(s => s.trim().length > 10))];
};

// ---------------------------------------------------------------------------
// Search providers
// ---------------------------------------------------------------------------

const ddgSearch = async (query: string): Promise<SearchTreeNode[]> => {
  const url = `/api/ddg?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    const results: SearchTreeNode[] = [];

    if (data.AbstractText) {
      results.push({
        title: data.Heading ?? query,
        snippet: data.AbstractText,
        url: data.AbstractURL ?? '',
        source: 'ddg',
      });
    }
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 4)) {
        if (topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] ?? '',
            snippet: topic.Text,
            url: topic.FirstURL ?? '',
            source: 'ddg',
          });
        }
      }
    }
    return results;
  } catch {
    return [];
  }
};

const wikipediaSearch = async (query: string): Promise<SearchTreeNode[]> => {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: '5',
    srprop: 'snippet|titlesnippet',
    format: 'json',
    origin: '*',
  });
  const url = `https://en.wikipedia.org/w/api.php?${params}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.query?.search ?? []).map((item: { title: string; snippet: string }) => ({
      title: item.title,
      snippet: item.snippet.replace(/<[^>]+>/g, ''),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
      source: 'wikipedia' as const,
    }));
  } catch {
    return [];
  }
};

export const PROVIDERS: Record<SearchProvider, (q: string) => Promise<SearchTreeNode[]>> = {
  ddg: ddgSearch,
  wikipedia: wikipediaSearch,
};

// ---------------------------------------------------------------------------
// Search tree — progressive refinement
// ---------------------------------------------------------------------------

const SCORE_THRESHOLD = 0.08;
const MAX_CANDIDATES = 20;

const deduplicateNodes = (nodes: SearchTreeNode[]): SearchTreeNode[] => {
  const seen = new Set<string>();
  return nodes.filter(n => {
    const key = normalize(n.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Run the search tree for a given set of segments.
 * Level 0: full text + top hook → broad candidates
 * Level 1: per-section queries → focused candidates
 * Level 2: re-score all collected candidates against full text
 * Returns top 3 WebSimilarityCandidate sorted by score desc.
 */
export const runSearchTree = async (
  sections: Section[],
  abortSignal?: AbortSignal,
): Promise<WebSimilarityCandidate[]> => {
  if (sections.length === 0) return [];

  const segments = extractSegments(sections);
  const fullText = segments[0] ?? '';
  const allNodes: SearchTreeNode[] = [];

  const safeSearch = async (provider: SearchProvider, query: string) => {
    if (abortSignal?.aborted) return;
    const nodes = await PROVIDERS[provider](query);
    allNodes.push(...nodes);
  };

  // Level 0 — broad: full text + first hook via both providers in parallel
  const level0Queries = [fullText, segments[segments.length - 1]].filter(Boolean).slice(0, 2);
  await Promise.allSettled(
    level0Queries.flatMap(q => [
      safeSearch('ddg', q),
      safeSearch('wikipedia', q),
    ]),
  );

  if (abortSignal?.aborted) return [];

  // Level 1 — focused: one query per section
  const sectionQueries = segments.slice(1, sections.length + 1);
  await Promise.allSettled(
    sectionQueries.flatMap(q => [
      safeSearch('ddg', q),
      safeSearch('wikipedia', q),
    ]),
  );

  if (abortSignal?.aborted) return [];

  // Level 2 — score all collected nodes against fullText
  const unique = deduplicateNodes(allNodes).slice(0, MAX_CANDIDATES);

  const candidates: WebSimilarityCandidate[] = unique
    .map(node => {
      const snippetScore = jaccardScore(fullText, node.snippet);
      const titleScore = jaccardScore(fullText, node.title) * 0.5;
      const score = Math.min(1, snippetScore * 0.6 + titleScore * 0.4);
      return {
        title: node.title,
        snippet: node.snippet,
        url: node.url,
        source: node.source,
        score: Math.round(score * 100),
        matchedSegments: segments
          .filter(s => jaccardScore(s, node.snippet) > SCORE_THRESHOLD)
          .map(s => s.slice(0, 60)),
      };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return candidates;
};
