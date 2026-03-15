/**
 * Web Similarity Search Engine
 * Hybrid search tree using DuckDuckGo Instant Answer API + Wikipedia Search API
 * No API key required. CORS handled via Vite proxy in dev (see vite.config.ts).
 */

import type { Section } from '../types';
import type { WebSimilarityCandidate, SearchTreeNode, SearchProvider } from '../types/webSimilarity';

const decodeHtmlEntities = (html: string): string =>
  html
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (text: string): string[] =>
  normalize(text).split(' ').filter(t => t.length > 2);

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

export const extractSegments = (sections: Section[]): string[] => {
  const segments: string[] = [];
  const fullText = sections.flatMap(s => s.lines.map(l => l.text)).filter(Boolean).join(' ');
  if (fullText.trim()) segments.push(fullText);
  for (const section of sections) {
    const sectionText = section.lines.map(l => l.text).filter(Boolean).join(' ');
    if (sectionText.trim()) segments.push(sectionText);
  }
  const allLines = sections.flatMap(s => s.lines.map(l => l.text)).filter(Boolean);
  const hooks = allLines
    .filter(line => tokenize(line).length >= 4)
    .sort((a, b) => tokenize(b).length - tokenize(a).length)
    .slice(0, 5);
  segments.push(...hooks);
  return [...new Set(segments.filter(s => s.trim().length > 10))];
};

// M3 fix: compose caller abortSignal with a per-request timeout signal.
// AbortSignal.any() is available in all modern browsers and Node 20+.
const makeSearchSignal = (outerSignal?: AbortSignal, timeoutMs = 5000): AbortSignal => {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!outerSignal) return timeoutSignal;
  return AbortSignal.any([outerSignal, timeoutSignal]);
};

const ddgSearch = async (query: string, abortSignal?: AbortSignal): Promise<SearchTreeNode[]> => {
  const url = `/api/ddg?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  try {
    const res = await fetch(url, { signal: makeSearchSignal(abortSignal) });
    if (!res.ok) return [];
    const data = await res.json();
    const results: SearchTreeNode[] = [];
    if (data.AbstractText) {
      results.push({ title: data.Heading ?? query, snippet: decodeHtmlEntities(data.AbstractText), url: data.AbstractURL ?? '', source: 'ddg' });
    }
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 4)) {
        if (topic.Text) {
          results.push({ title: topic.Text.split(' - ')[0] ?? '', snippet: decodeHtmlEntities(topic.Text), url: topic.FirstURL ?? '', source: 'ddg' });
        }
      }
    }
    return results;
  } catch {
    return [];
  }
};

const wikipediaSearch = async (query: string, abortSignal?: AbortSignal): Promise<SearchTreeNode[]> => {
  const params = new URLSearchParams({
    action: 'query', list: 'search', srsearch: query,
    srlimit: '5', srprop: 'snippet|titlesnippet', format: 'json', origin: '*',
  });
  const url = `https://en.wikipedia.org/w/api.php?${params}`;
  try {
    const res = await fetch(url, { signal: makeSearchSignal(abortSignal) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.query?.search ?? []).map((item: { title: string; snippet: string }) => ({
      title: item.title,
      snippet: decodeHtmlEntities(item.snippet.replace(/<[^>]+>/g, '')),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
      source: 'wikipedia' as const,
    }));
  } catch {
    return [];
  }
};

export const PROVIDERS: Record<SearchProvider, (q: string, signal?: AbortSignal) => Promise<SearchTreeNode[]>> = {
  ddg: ddgSearch,
  wikipedia: wikipediaSearch,
};

const MAX_CANDIDATES = 20;
const MAX_TITLE_SCORE_CONTRIBUTION = 0.08;

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
 * Run the search tree.
 * Returns up to 3 candidates with score > 5%, sorted by score desc.
 */
export const runSearchTree = async (
  sections: Section[],
  title = '',
  abortSignal?: AbortSignal,
): Promise<WebSimilarityCandidate[]> => {
  if (sections.length === 0 && title.trim().length === 0) return [];

  const segments = extractSegments(sections);
  const normalizedTitle = normalize(title);
  const fullText = segments[0] ?? '';
  const allNodes: SearchTreeNode[] = [];

  const safeSearch = async (provider: SearchProvider, query: string) => {
    if (abortSignal?.aborted) return;
    const nodes = await PROVIDERS[provider](query, abortSignal);
    allNodes.push(...nodes);
  };

  const level0Queries = [title, fullText, segments[segments.length - 1]]
    .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
    .slice(0, 3);
  await Promise.allSettled(
    level0Queries.flatMap(q => [safeSearch('ddg', q), safeSearch('wikipedia', q)]),
  );

  if (abortSignal?.aborted) return [];

  const sectionQueries = segments.slice(1, sections.length + 1);
  await Promise.allSettled(
    sectionQueries.flatMap(q => [safeSearch('ddg', q), safeSearch('wikipedia', q)]),
  );

  if (abortSignal?.aborted) return [];

  if (normalizedTitle.length > 0) {
    const titleLyricsQuery = `${title} lyrics`;
    await Promise.allSettled([
      safeSearch('ddg', titleLyricsQuery),
      safeSearch('wikipedia', titleLyricsQuery),
    ]);
  }

  if (abortSignal?.aborted) return [];

  const unique = deduplicateNodes(allNodes).slice(0, MAX_CANDIDATES);

  const candidates: WebSimilarityCandidate[] = unique
    .map(node => {
      const snippetScore = jaccardScore(fullText, node.snippet);
      const lyricsToResultTitleScore = jaccardScore(fullText, node.title);
      const exactTitleMatch = normalizedTitle.length > 0 && normalizedTitle === normalize(node.title);
      const titleScore = normalizedTitle.length > 0
        ? Math.max(
          exactTitleMatch ? 1 : 0,
          jaccardScore(title, node.title),
          jaccardScore(title, node.snippet) * 0.8,
        )
        : 0;
      const lyricScore = Math.min(1, snippetScore * 0.6 + lyricsToResultTitleScore * 0.4);
      const titleContribution = Math.min(MAX_TITLE_SCORE_CONTRIBUTION, titleScore * MAX_TITLE_SCORE_CONTRIBUTION);
      const score = Math.min(1, lyricScore + titleContribution);
      return {
        title: node.title,
        snippet: node.snippet,
        url: node.url,
        source: node.source,
        score: Math.round(score * 100),
        matchedSegments: [
          ...(titleScore > 0 && title.trim().length > 0 ? [`Title: ${title}`] : []),
          ...segments
            .filter(s => jaccardScore(s, node.snippet) > 0 || jaccardScore(s, node.title) > 0)
            .map(s => s.slice(0, 60)),
        ]
          .filter((segment, index, list) => list.indexOf(segment) === index),
      };
    })
    .sort((a, b) => b.score - a.score)
    .filter(c => c.score > 5)
    .slice(0, 3);

  return candidates;
};
