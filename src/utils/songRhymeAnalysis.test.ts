import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../types';
import { compareTextsWithIPA } from './ipaPipeline';
import { analyzeSongRhymes } from './songRhymeAnalysis';

vi.mock('./ipaPipeline', () => ({
  compareTextsWithIPA: vi.fn(),
}));

const makeLine = (id: string, text: string) => ({
  id,
  text,
  rhymingSyllables: '',
  rhyme: '',
  syllables: text.split(/\s+/).length,
  concept: text,
  isMeta: false,
});

const makeSection = (id: string, name: string, language: string, lines: string[]): Section => ({
  id,
  name,
  language,
  lines: lines.map((line, index) => makeLine(`${id}-${index + 1}`, line)),
});

describe('analyzeSongRhymes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses ipa mode for supported languages', async () => {
    vi.mocked(compareTextsWithIPA).mockResolvedValue({
      score: 0.91,
      quality: 'rich',
      distance: 0.09,
      method: 'feature-weighted',
    });

    const song = [
      makeSection('fr-verse', 'Verse 1', 'fr', [
        'Dans la nuit je marche encore',
        'Sous la pluie je cherche l’or',
      ]),
    ];

    await expect(analyzeSongRhymes(song)).resolves.toEqual([
      expect.objectContaining({
        sectionId: 'fr-verse',
        mode: 'ipa',
        pairs: [
          expect.objectContaining({
            quality: 'rich',
            confidenceScore: 91,
            usedIpa: true,
            isApproximated: false,
          }),
        ],
      }),
    ]);
    expect(compareTextsWithIPA).toHaveBeenCalledTimes(1);
  });

  it('falls back to graphemic mode for unsupported languages', async () => {
    const song = [
      makeSection('section-x', 'Verse 1', 'xyz', [
        'nara bela sona',
        'tari mela kona',
      ]),
    ];

    await expect(analyzeSongRhymes(song)).resolves.toEqual([
      expect.objectContaining({
        sectionId: 'section-x',
        mode: 'graphemic',
        pairs: [],
      }),
    ]);
    expect(compareTextsWithIPA).not.toHaveBeenCalled();
  });

  it('downgrades the confidence score for approximated rhymes', async () => {
    vi.mocked(compareTextsWithIPA)
      .mockResolvedValueOnce({
        score: 0.8,
        quality: 'sufficient',
        distance: 0.2,
        method: 'feature-weighted',
      })
      .mockResolvedValueOnce({
        score: 0.8,
        quality: 'sufficient',
        distance: 0.2,
        method: 'feature-weighted',
        isApproximated: true,
      } as never);

    const song = [
      makeSection('section-a', 'Verse 1', 'fr', [
        'Premier reflet sur la Seine',
        'Dernier secret dans la Seine',
      ]),
      makeSection('section-b', 'Verse 2', 'fr', [
        'Le moteur gronde au matin',
        'Le décor tremble au matin',
      ]),
    ];

    const [exactSection, approximatedSection] = await analyzeSongRhymes(song);

    expect(exactSection?.pairs[0]?.confidenceScore).toBe(80);
    expect(approximatedSection?.pairs[0]?.confidenceScore).toBe(68);
    expect(exactSection?.pairs[0]?.confidenceScore).toBeGreaterThan(
      approximatedSection?.pairs[0]?.confidenceScore ?? 0,
    );
  });
});
