import type { Section } from '../types';
import type { SimilarityMatch } from './similarityUtils';
import { calculateSimilarityWithMetadata } from './similarityUtils';

export type LibraryAsset = {
  id: string;
  title: string;
  artist?: string;
  timestamp: number;
  type: 'song' | 'poem' | 'lyrics';
  sections: Section[];
  metadata?: {
    album?: string;
    year?: number;
    genre?: string;
    language?: string;
    [key: string]: any;
  };
};

export type LibrarySearchResult = SimilarityMatch & {
  assetType: 'song' | 'poem' | 'lyrics';
  artist?: string;
  metadata?: LibraryAsset['metadata'];
};

export const loadLibraryAssets = async (): Promise<LibraryAsset[]> => {
  try {
    const cached = localStorage.getItem('lyricist_library');
    if (cached) return JSON.parse(cached);
    return [];
  } catch (error) {
    console.error('Failed to load library assets:', error);
    return [];
  }
};

export const saveAssetToLibrary = async (asset: Omit<LibraryAsset, 'id' | 'timestamp'>): Promise<LibraryAsset> => {
  const newAsset: LibraryAsset = {
    ...asset,
    id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
  };

  try {
    const library = await loadLibraryAssets();
    library.push(newAsset);
    localStorage.setItem('lyricist_library', JSON.stringify(library));
    return newAsset;
  } catch (error) {
    console.error('Failed to save asset to library:', error);
    throw error;
  }
};

/**
 * Find top 3 similar assets in library.
 * Always returns up to 3 results regardless of score — low similarity shown.
 */
export const findSimilarAssetsInLibrary = async (
  currentSong: Section[],
  _threshold = 0,
  limit = 3,
): Promise<LibrarySearchResult[]> => {
  if (currentSong.length === 0) return [];

  const library = await loadLibraryAssets();
  if (library.length === 0) return [];

  return library
    .filter(asset => asset.sections.length > 0)
    .map((asset) => {
      const similarityData = calculateSimilarityWithMetadata(currentSong, asset.sections);
      return {
        ...similarityData,
        versionId: asset.id,
        versionName: asset.title,
        title: asset.title,
        timestamp: asset.timestamp,
        assetType: asset.type,
        artist: asset.artist,
        metadata: asset.metadata,
      };
    })
    .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
    .slice(0, limit);
};

export const importAssetsFromFile = async (file: File): Promise<LibraryAsset[]> => {
  const text = await file.text();
  const assets: LibraryAsset[] = [];

  try {
    if (file.name.endsWith('.json')) {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => ({
          id: item.id || `import_${Date.now()}_${idx}`,
          title: item.title || `Imported ${idx + 1}`,
          timestamp: item.timestamp || Date.now(),
          type: item.type || 'lyrics',
          sections: item.sections || [],
          artist: item.artist,
          metadata: item.metadata,
        }));
      }
    } else {
      const sections = parseTextToSections(text);
      assets.push({
        id: `import_${Date.now()}`,
        title: file.name.replace(/\.(txt|md)$/, ''),
        timestamp: Date.now(),
        type: 'lyrics',
        sections,
      });
    }
  } catch (error) {
    console.error('Failed to import assets:', error);
  }

  return assets;
};

const parseTextToSections = (text: string): Section[] => {
  const blocks = text.split(/\n\s*\n/);
  const sections: Section[] = [];

  blocks.forEach((block) => {
    const lines = block.trim().split('\n');
    if (lines.length === 0) return;

    let sectionName = 'Verse';
    let contentLines = lines;

    const firstLine = lines[0].trim();
    if ((firstLine.startsWith('[') && firstLine.endsWith(']')) || (firstLine.startsWith('**[') && firstLine.endsWith(']**'))) {
      sectionName = firstLine.replace(/^\*\*?\[|\]\*\*?$/g, '');
      contentLines = lines.slice(1);
    }

    const sectionLines = contentLines
      .filter(line => line.trim().length > 0)
      .map((text, idx) => ({
        id: `line_${Date.now()}_${idx}`,
        text,
        rhymingSyllables: '',
        rhyme: '',
        syllables: 0,
        concept: '',
        isManual: true,
      }));

    if (sectionLines.length > 0) {
      sections.push({
        id: `section_${Date.now()}_${sections.length}`,
        name: sectionName,
        rhymeScheme: 'AABB',
        targetSyllables: 8,
        mood: '',
        lines: sectionLines,
        preInstructions: [],
        postInstructions: [],
      });
    }
  });

  return sections;
};

export const exportLibraryToJson = async (): Promise<Blob> => {
  const library = await loadLibraryAssets();
  const json = JSON.stringify(library, null, 2);
  return new Blob([json], { type: 'application/json' });
};
