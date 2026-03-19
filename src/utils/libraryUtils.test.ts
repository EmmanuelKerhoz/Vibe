import { describe, expect, it } from 'vitest';
import { loadAssetIntoEditor, type LibraryAsset } from './libraryUtils';

describe('loadAssetIntoEditor', () => {
  it('restores missing syllable counts and infers rhyme schemes for loaded songs', () => {
    const asset: LibraryAsset = {
      id: 'asset-1',
      title: 'Loaded Song',
      timestamp: Date.now(),
      type: 'song',
      sections: [
        {
          id: 'section-1',
          name: 'Verse 1',
          rhymeScheme: 'FREE',
          lines: [
            { id: 'line-1', text: 'Tu veux des preuves, tu veux des certitudes', rhymingSyllables: '', rhyme: '', syllables: 0, concept: 'Line 1' },
            { id: 'line-2', text: 'Tu confonds l\'amour avec la servitude', rhymingSyllables: '', rhyme: '', syllables: 0, concept: 'Line 2' },
          ],
        },
      ],
    };

    const loaded = loadAssetIntoEditor(asset);

    expect(loaded.song[0]?.rhymeScheme).toBe('AA');
    expect(loaded.rhymeScheme).toBe('AA');
    expect(loaded.song[0]?.lines[0]?.syllables).toBeGreaterThan(0);
    expect(loaded.song[0]?.lines[1]?.syllables).toBeGreaterThan(0);
  });
});
