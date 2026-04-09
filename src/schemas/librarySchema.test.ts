/**
 * P11 — Zod guard unit tests for LibraryStoreSchema, LibraryAssetSchema,
 * LibraryAsset_MetadataSchema
 *
 * Covers:
 *   - valid current format { version, assets }   → success
 *   - legacy plain-array format                  → normalised to { version:0, assets }
 *   - missing required fields (id, title, timestamp, type, sections) → failure
 *   - invalid type enum                           → failure
 *   - metadata catchall accepts extra keys
 *   - sections nested via SectionSchema passthrough
 *   - safeParse.success === false paths explicitly tested
 */
import { describe, expect, it } from 'vitest';
import {
  LibraryStoreSchema,
  LibraryAssetSchema,
  LibraryAsset_MetadataSchema,
} from './librarySchema';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validAsset = {
  id: 'asset-1',
  title: 'My Song',
  artist: 'Artist',
  timestamp: 1712700000000,
  type: 'song' as const,
  sections: [
    {
      id: 'sec-1',
      name: 'Verse 1',
      lines: [{ id: 'line-1', text: 'Hello world' }],
    },
  ],
  metadata: {
    album: 'Album 1',
    genre: 'pop',
    year: 2024,
  },
};

// ---------------------------------------------------------------------------
// LibraryAssetSchema
// ---------------------------------------------------------------------------

describe('LibraryAssetSchema', () => {
  it('accepts a valid full asset', () => {
    const result = LibraryAssetSchema.safeParse(validAsset);
    expect(result.success).toBe(true);
  });

  it('accepts asset without optional fields (artist, metadata)', () => {
    const minimal = {
      id: 'a1',
      title: 'Song',
      timestamp: 1000,
      type: 'lyrics' as const,
      sections: [],
    };
    const result = LibraryAssetSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('accepts all valid type enum values', () => {
    for (const type of ['song', 'poem', 'lyrics'] as const) {
      const result = LibraryAssetSchema.safeParse({ ...validAsset, type });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an invalid type enum → safeParse.success === false', () => {
    const result = LibraryAssetSchema.safeParse({ ...validAsset, type: 'track' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('type');
    }
  });

  it('rejects missing required id → safeParse.success === false', () => {
    const { id: _id, ...noId } = validAsset;
    const result = LibraryAssetSchema.safeParse(noId);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('id');
    }
  });

  it('rejects missing required title → safeParse.success === false', () => {
    const { title: _title, ...noTitle } = validAsset;
    const result = LibraryAssetSchema.safeParse(noTitle);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('title');
    }
  });

  it('rejects missing required timestamp → safeParse.success === false', () => {
    const { timestamp: _ts, ...noTs } = validAsset;
    const result = LibraryAssetSchema.safeParse(noTs);
    expect(result.success).toBe(false);
  });

  it('rejects missing required sections → safeParse.success === false', () => {
    const { sections: _s, ...noSections } = validAsset;
    const result = LibraryAssetSchema.safeParse(noSections);
    expect(result.success).toBe(false);
  });

  it('preserves unknown fields in section lines via passthrough', () => {
    const assetWithExtra = {
      ...validAsset,
      sections: [
        {
          id: 'sec-1',
          name: 'Verse',
          lines: [{ id: 'l1', text: 'Hi', _phonemeCache: ['HH', 'AY'] }],
          _internalFlag: true,
        },
      ],
    };
    const result = LibraryAssetSchema.safeParse(assetWithExtra);
    expect(result.success).toBe(true);
    if (result.success) {
      const section = result.data.sections[0] as Record<string, unknown>;
      expect(section['_internalFlag']).toBe(true);
      const line = (section['lines'] as Record<string, unknown>[])[0];
      expect(line?.['_phonemeCache']).toEqual(['HH', 'AY']);
    }
  });
});

// ---------------------------------------------------------------------------
// LibraryAsset_MetadataSchema
// ---------------------------------------------------------------------------

describe('LibraryAsset_MetadataSchema', () => {
  it('accepts a valid metadata object', () => {
    const result = LibraryAsset_MetadataSchema.safeParse({
      album: 'Album',
      genre: 'rock',
      year: 2020,
      language: 'en',
      topic: 'love',
      mood: 'sad',
      tempo: 90,
      instrumentation: 'guitar',
      rhythm: '4/4',
      narrative: 'heartbreak',
      musicalPrompt: 'slow rock',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty object (all fields optional)', () => {
    const result = LibraryAsset_MetadataSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('preserves extra keys via catchall(z.unknown())', () => {
    const result = LibraryAsset_MetadataSchema.safeParse({
      customField: 'hello',
      anotherExtra: 42,
      nested: { deep: true },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data['customField']).toBe('hello');
      expect(data['anotherExtra']).toBe(42);
    }
  });
});

// ---------------------------------------------------------------------------
// LibraryStoreSchema
// ---------------------------------------------------------------------------

describe('LibraryStoreSchema', () => {
  it('accepts the current versioned format { version, assets }', () => {
    const result = LibraryStoreSchema.safeParse({
      version: 1,
      assets: [validAsset],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
      expect(result.data.assets).toHaveLength(1);
    }
  });

  it('accepts an empty assets array', () => {
    const result = LibraryStoreSchema.safeParse({ version: 2, assets: [] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assets).toHaveLength(0);
    }
  });

  it('accepts legacy plain-array format and normalises to { version: 0, assets }', () => {
    const result = LibraryStoreSchema.safeParse([validAsset]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(0);
      expect(result.data.assets).toHaveLength(1);
      expect(result.data.assets[0]?.id).toBe('asset-1');
    }
  });

  it('accepts empty legacy plain-array []', () => {
    const result = LibraryStoreSchema.safeParse([]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(0);
      expect(result.data.assets).toHaveLength(0);
    }
  });

  it('rejects a malformed store (plain object without version or assets) → safeParse.success === false', () => {
    const result = LibraryStoreSchema.safeParse({ foo: 'bar' });
    expect(result.success).toBe(false);
  });

  it('rejects null → safeParse.success === false', () => {
    const result = LibraryStoreSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it('rejects a string → safeParse.success === false', () => {
    const result = LibraryStoreSchema.safeParse('corrupted-data');
    expect(result.success).toBe(false);
  });

  it('rejects an asset with invalid type inside assets array', () => {
    const corruptAsset = { ...validAsset, type: 'unknown' };
    const result = LibraryStoreSchema.safeParse({ version: 1, assets: [corruptAsset] });
    expect(result.success).toBe(false);
  });

  it('rejects a legacy array containing a non-object element', () => {
    const result = LibraryStoreSchema.safeParse(['not-an-asset']);
    expect(result.success).toBe(false);
  });
});
