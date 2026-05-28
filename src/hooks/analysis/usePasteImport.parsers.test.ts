import { describe, expect, it } from 'vitest';
import type { Section } from '../../types';
import {
  getSectionHeaderHint,
  normalizeImportedSectionNames,
  splitPastedLyricsIntoChunks,
} from './usePasteImport.parsers';

describe('usePasteImport.parsers', () => {
  it('detects standalone section headers with numeric and roman suffixes', () => {
    expect(getSectionHeaderHint('Verse 2')).toBe('Verse 2');
    expect(getSectionHeaderHint('couplet iv')).toBe('couplet iv');
    expect(getSectionHeaderHint('[Guitar solo]')).toBe('');
  });

  it('splits pasted lyrics into named chunks when headers are present', () => {
    const chunks = splitPastedLyricsIntoChunks('Verse 1\nLine A\nLine B\n\nChorus\nHook A\nHook B');
    expect(chunks).toEqual([
      { displayLabel: 'Verse 1', nameHint: 'Verse 1', text: 'Line A\nLine B' },
      { displayLabel: 'Chorus', nameHint: 'Chorus', text: 'Hook A\nHook B' },
    ]);
  });

  it('normalizes intro names based on title extraction state', () => {
    const sections: Section[] = [
      { id: 's1', name: 'Intro', rhymeScheme: 'FREE', lines: [] },
      { id: 's2', name: 'Intro 2', rhymeScheme: 'FREE', lines: [] },
      { id: 's3', name: 'Verse', rhymeScheme: 'AABB', lines: [] },
    ];

    expect(normalizeImportedSectionNames(sections, false).map(section => section.name))
      .toEqual(['Title', 'Verse 2', 'Verse']);
    expect(normalizeImportedSectionNames(sections, true).map(section => section.name))
      .toEqual(['Intro', 'Verse 2', 'Verse']);
  });
});
