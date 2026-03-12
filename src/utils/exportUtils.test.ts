// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Section } from '../types';
import { createSongExport } from './exportUtils';

const song: Section[] = [
  {
    id: 's1',
    name: 'Chorus',
    lines: [
      {
        id: 'l1',
        text: 'Sing along',
        rhymingSyllables: '',
        rhyme: '',
        syllables: 0,
        concept: 'New line',
      },
      {
        id: 'l2',
        text: '[drop]',
        rhymingSyllables: '',
        rhyme: '',
        syllables: 0,
        concept: 'New line',
        isMeta: true,
      },
    ],
  },
];

describe('createSongExport', () => {
  it('builds readable txt output', async () => {
    const { blob, filename } = createSongExport({
      song,
      title: 'Test Song',
      topic: 'night drive',
      mood: 'moody',
      format: 'txt',
    });

    expect(filename).toBe('Test_Song.txt');
    await expect(blob.text()).resolves.toContain('[Chorus]');
    await expect(blob.text()).resolves.toContain('Sing along');
  });

  it('builds readable markup output', async () => {
    const { blob, filename } = createSongExport({
      song,
      title: 'Test Song',
      topic: 'night drive',
      mood: 'moody',
      format: 'markup',
    });

    expect(filename).toBe('Test_Song.md');
    await expect(blob.text()).resolves.toContain('# Test Song');
    await expect(blob.text()).resolves.toContain('### Chorus');
    await expect(blob.text()).resolves.toContain('*\\[drop\\]*');
  });

  it.each([
    ['docx', 'Test_Song.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['odt', 'Test_Song.odt', 'application/vnd.oasis.opendocument.text'],
  ] as const)('builds %s as a zip container', async (format, expectedFilename, expectedMime) => {
    const { blob, filename } = createSongExport({
      song,
      title: 'Test Song',
      topic: 'night drive',
      mood: 'moody',
      format,
    });

    expect(filename).toBe(expectedFilename);
    expect(blob.type).toBe(expectedMime);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(Array.from(bytes.slice(0, 2))).toEqual([80, 75]);
  });
});
