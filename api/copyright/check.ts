import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Copyright Similarity Check API
 * 
 * This endpoint searches multiple lyrics databases (Genius, Musixmatch, LyricFind)
 * to detect similarity with existing copyrighted songs.
 * 
 * Required Environment Variables:
 * - GENIUS_ACCESS_TOKEN: Genius API token
 * - MUSIXMATCH_API_KEY: Musixmatch API key (optional)
 * - LYRICFIND_API_KEY: LyricFind API key (optional)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lyrics, keywords, sections, threshold = 30, limit = 10 } = req.body;

  if (!lyrics || !keywords) {
    return res.status(400).json({ error: 'Missing lyrics or keywords' });
  }

  try {
    const matches = [];

    // Search Genius
    if (process.env.GENIUS_ACCESS_TOKEN) {
      const geniusMatches = await searchGenius(keywords, lyrics, sections, threshold);
      matches.push(...geniusMatches);
    }

    // Deduplicate and sort
    const uniqueMatches = deduplicateMatches(matches);
    const sortedMatches = uniqueMatches
      .sort((a, b) => {
        const riskWeight = { high: 3, medium: 2, low: 1 };
        const riskDiff = riskWeight[b.riskLevel] - riskWeight[a.riskLevel];
        if (riskDiff !== 0) return riskDiff;
        return b.score - a.score;
      })
      .slice(0, limit);

    return res.status(200).json({
      matches: sortedMatches,
      count: sortedMatches.length,
      searched: matches.length,
    });
  } catch (error: any) {
    console.error('Copyright check error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Search Genius API for similar songs
 */
async function searchGenius(
  keywords: string[],
  currentLyrics: string,
  sections: any[],
  threshold: number,
) {
  const token = process.env.GENIUS_ACCESS_TOKEN;
  if (!token) return [];

  const matches = [];

  // Search for each keyword
  for (const keyword of keywords.slice(0, 5)) {
    try {
      const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(keyword)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!searchRes.ok) continue;

      const searchData = await searchRes.json();
      const hits = searchData.response?.hits || [];

      // Get lyrics for top 3 results
      for (const hit of hits.slice(0, 3)) {
        const song = hit.result;
        if (!song) continue;

        try {
          // Fetch full lyrics via web scraping
          const lyricsUrl = song.url;
          const lyricsRes = await fetch(lyricsUrl);
          const html = await lyricsRes.text();

          // Extract lyrics from HTML
          const lyrics = extractLyricsFromGeniusHtml(html);
          if (!lyrics) continue;

          // Calculate similarity
          const similarity = calculateSimilarity(currentLyrics, lyrics, sections);

          if (similarity.score >= threshold) {
            matches.push({
              ...similarity,
              title: song.title || 'Unknown',
              artist: song.primary_artist?.name || 'Unknown',
              album: song.album?.name,
              year: song.release_date_components?.year,
              source: 'genius',
              copyrightHolder: song.primary_artist?.name,
              riskLevel: calculateRiskLevel(similarity.score),
            });
          }
        } catch (err) {
          // Skip this song if lyrics fetch fails
          continue;
        }
      }
    } catch (err) {
      // Skip this keyword if search fails
      continue;
    }
  }

  return matches;
}

/**
 * Extract lyrics from Genius HTML page
 */
function extractLyricsFromGeniusHtml(html: string): string | null {
  try {
    // Genius uses data-lyrics-container divs
    const matches = html.match(/<div[^>]*data-lyrics-container[^>]*>([\s\S]*?)<\/div>/gi);
    if (!matches) return null;

    const lyrics = matches
      .map(div => {
        // Remove HTML tags
        return div
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z]+;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      })
      .join('\n\n');

    return lyrics.length > 50 ? lyrics : null;
  } catch (err) {
    return null;
  }
}

/**
 * Calculate similarity between current lyrics and a copyrighted song
 */
function calculateSimilarity(
  currentLyrics: string,
  copyrightedLyrics: string,
  sections: any[],
) {
  const currentLines = currentLyrics.split('\n').filter(l => l.trim());
  const copyrightedLines = copyrightedLyrics.split('\n').filter(l => l.trim());

  // Find exact line matches
  const matchedLines: string[] = [];
  currentLines.forEach(currentLine => {
    const normalized = currentLine.toLowerCase().trim();
    copyrightedLines.forEach(copyrightedLine => {
      const copyrightNormalized = copyrightedLine.toLowerCase().trim();
      if (normalized === copyrightNormalized ||
          (normalized.length > 20 && copyrightNormalized.includes(normalized)) ||
          (copyrightNormalized.length > 20 && normalized.includes(copyrightNormalized))) {
        if (!matchedLines.includes(currentLine)) {
          matchedLines.push(currentLine);
        }
      }
    });
  });

  // Calculate word overlap
  const currentWords = new Set(
    currentLyrics.toLowerCase().match(/\b\w{4,}\b/g) || []
  );
  const copyrightedWords = new Set(
    copyrightedLyrics.toLowerCase().match(/\b\w{4,}\b/g) || []
  );
  const sharedWords = [...currentWords].filter(w => copyrightedWords.has(w)).length;

  // Find shared keywords
  const sharedKeywords = extractKeywords(currentLyrics).filter(keyword =>
    copyrightedLyrics.toLowerCase().includes(keyword.toLowerCase())
  );

  // Calculate section similarity
  const matchedSections = sections
    .map((section: any) => {
      const sectionScore = calculateSimpleScore(section.text, copyrightedLyrics);
      return { name: section.name, score: sectionScore };
    })
    .filter(s => s.score > 20);

  // Overall similarity score
  const lineScore = (matchedLines.length / Math.max(currentLines.length, 1)) * 100;
  const wordScore = (sharedWords / Math.max(currentWords.size, 1)) * 100;
  const score = Math.round(lineScore * 0.7 + wordScore * 0.3);

  return {
    score,
    matchedLines,
    matchedSections,
    sharedWords,
    sharedLines: matchedLines.length,
    sharedKeywords: sharedKeywords.slice(0, 10),
  };
}

function calculateSimpleScore(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().match(/\b\w{4,}\b/g) || []);
  const words2 = new Set(text2.toLowerCase().match(/\b\w{4,}\b/g) || []);
  const shared = [...words1].filter(w => words2.has(w)).length;
  return Math.round((shared / Math.max(words1.size, 1)) * 100);
}

function extractKeywords(text: string): string[] {
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
}

function calculateRiskLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function deduplicateMatches(matches: any[]): any[] {
  const seen = new Map<string, any>();
  matches.forEach(match => {
    const key = `${match.title.toLowerCase()}-${match.artist.toLowerCase()}`;
    const existing = seen.get(key);
    if (!existing || match.score > existing.score) {
      seen.set(key, match);
    }
  });
  return Array.from(seen.values());
}
