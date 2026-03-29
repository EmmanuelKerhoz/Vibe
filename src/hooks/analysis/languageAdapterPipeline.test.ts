import { describe, expect, it } from 'vitest';
import { getSourceLineRefs } from './languageAdapterPipeline';
import type { Section } from '../../types';

const makeLine = (id: string, text: string, isMeta = false) => ({
  id,
  text,
  rhymingSyllables: '',
  rhyme: '',
  syllables: 0,
  concept: '',
  isMeta,
});

describe('getSourceLineRefs', () => {
  it('excludes meta instruction lines (isMeta: true) from language evaluation', () => {
    const song: Section[] = [
      {
        id: 's1',
        name: 'Verse 1',
        lines: [
          makeLine('l1', 'Hello world'),
          makeLine('l2', '[Guitar solo]', true),
          makeLine('l3', 'Another lyric line'),
        ],
      },
    ];

    const refs = getSourceLineRefs(song);
    expect(refs.map(r => r.lineId)).toEqual(['l1', 'l3']);
    expect(refs.every(r => r.text !== '[Guitar solo]')).toBe(true);
  });

  it('excludes section header lines from language evaluation', () => {
    const song: Section[] = [
      {
        id: 's1',
        name: 'Chorus',
        lines: [
          makeLine('l1', '[Chorus]'),
          makeLine('l2', 'I will always love you'),
        ],
      },
    ];

    const refs = getSourceLineRefs(song);
    expect(refs.map(r => r.lineId)).toEqual(['l2']);
  });

  it('includes regular lyric lines in language evaluation', () => {
    const song: Section[] = [
      {
        id: 's1',
        name: 'Verse 1',
        lines: [
          makeLine('l1', 'Line one'),
          makeLine('l2', 'Line two'),
        ],
      },
    ];

    const refs = getSourceLineRefs(song);
    expect(refs).toHaveLength(2);
    expect(refs[0]!.lineId).toBe('l1');
    expect(refs[1]!.lineId).toBe('l2');
  });

  it('handles songs with only meta lines by returning empty array', () => {
    const song: Section[] = [
      {
        id: 's1',
        name: 'Intro',
        lines: [
          makeLine('l1', '[Instrumental]', true),
          makeLine('l2', '[Beat drops]', true),
        ],
      },
    ];

    const refs = getSourceLineRefs(song);
    expect(refs).toHaveLength(0);
  });

  it('returns correct line references with section and line indices', () => {
    const song: Section[] = [
      {
        id: 's1',
        name: 'Verse 1',
        lines: [
          makeLine('l1', '[Verse 1]'),
          makeLine('l2', 'First lyric line'),
          makeLine('l3', '[Background vocals]', true),
          makeLine('l4', 'Second lyric line'),
        ],
      },
    ];

    const refs = getSourceLineRefs(song);
    expect(refs).toHaveLength(2);
    expect(refs[0]!.lineId).toBe('l2');
    expect(refs[1]!.lineId).toBe('l4');
  });
});
