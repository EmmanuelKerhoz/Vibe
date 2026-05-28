import { describe, expect, it } from 'vitest';
import type { Section } from '../../types';
import {
  alignGeneratedSongToStructure,
  buildExclusiveLanguageInstruction,
  flagMetaLines,
  sectionNamesMatch,
} from './useAiGeneration.parsers';

describe('useAiGeneration.parsers', () => {
  it('matches section names case-insensitively', () => {
    expect(sectionNamesMatch('Verse 1', 'verse 1')).toBe(true);
    expect(sectionNamesMatch('Verse', 'Chorus')).toBe(false);
  });

  it('aligns generated sections to the requested structure order', () => {
    const generatedSong: Section[] = [
      { id: 's1', name: 'Chorus', rhymeScheme: 'AABB', lines: [] },
      { id: 's2', name: 'Verse', rhymeScheme: 'ABAB', lines: [] },
    ];

    const aligned = alignGeneratedSongToStructure(generatedSong, ['Verse', 'Chorus', 'Bridge'], 'FREE');
    expect(aligned).toHaveLength(3);
    expect(aligned[0]?.name).toBe('Verse');
    expect(aligned[0]?.rhymeScheme).toBe('ABAB');
    expect(aligned[1]?.name).toBe('Chorus');
    expect(aligned[1]?.rhymeScheme).toBe('AABB');
    expect(aligned[2]?.name).toBe('Bridge');
    expect(aligned[2]?.rhymeScheme).toBe('FREE');
  });

  it('flags pure bracket meta-lines and sanitizes language instruction', () => {
    expect(flagMetaLines([{ text: '[Guitar solo]' }, { text: 'Regular lyric' }])).toEqual([
      { text: '[Guitar solo]', isMeta: true },
      { text: 'Regular lyric', isMeta: false },
    ]);
    expect(buildExclusiveLanguageInstruction('French')).toBe('Write exclusively in French.');
    expect(buildExclusiveLanguageInstruction('')).toBe('');
  });
});
