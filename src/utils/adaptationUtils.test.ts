/**
 * Tests for adaptation utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  matchRhymeSchemeAcrossLang,
  validateTranslatedLineRhyme,
  validateTranslatedLines,
  type AdaptationResult,
} from './adaptationUtils';
import * as ipaPipeline from './ipaPipeline';

// Mock the IPA pipeline
vi.mock('./ipaPipeline', async () => {
  const actual = await vi.importActual('./ipaPipeline');
  return {
    ...actual,
    runIPAPipelineBatch: vi.fn(),
    compareTextsWithIPA: vi.fn(),
  };
});

describe('adaptationUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('matchRhymeSchemeAcrossLang', () => {
    it('should return an empty scheme when no source lines are provided', async () => {
      const result = await matchRhymeSchemeAcrossLang([], 'en', 'fr');
      expect(result.success).toBe(true);
      expect(result.sourceScheme).toBe('');
      expect(result.targetScheme).toBe('');
      expect(result.constrainedPrompt).toBe('');
      expect(result.sourceAnalysis).toEqual([]);
      expect(result.error).toBeUndefined();
      expect(ipaPipeline.runIPAPipelineBatch).not.toHaveBeenCalled();
    });

    it('should return error when source language not provided', async () => {
      const result = await matchRhymeSchemeAcrossLang(['test'], '', 'fr');
      expect(result.success).toBe(false);
      expect(result.error).toContain('language codes are required');
    });

    it('should return error when target language not provided', async () => {
      const result = await matchRhymeSchemeAcrossLang(['test'], 'en', '');
      expect(result.success).toBe(false);
      expect(result.error).toContain('language codes are required');
    });

    it('should extract rhyme scheme from source lines', async () => {
      const sourceLines = [
        'The cat sat on the mat',
        'Wearing a funny hat',
        'The dog ran in the park',
        'He left a little mark',
      ];

      // Mock IPA pipeline results
      vi.mocked(ipaPipeline.runIPAPipelineBatch).mockResolvedValue([
        {
          success: true,
          text: sourceLines[0]!,
          langCode: 'en',
          family: 'ALGO-ROM',
          ipa: 'ðə kæt sæt ɒn ðə mæt',
          syllables: [{ onset: 'm', nucleus: 'æ', coda: 't', stress: true }],
          rhymeNucleus: 'æt',
          method: 'service',
          lowResource: false,
        },
        {
          success: true,
          text: sourceLines[1]!,
          langCode: 'en',
          family: 'ALGO-ROM',
          ipa: 'wɛərɪŋ ə fʌni hæt',
          syllables: [{ onset: 'h', nucleus: 'æ', coda: 't', stress: true }],
          rhymeNucleus: 'æt',
          method: 'service',
          lowResource: false,
        },
        {
          success: true,
          text: sourceLines[2]!,
          langCode: 'en',
          family: 'ALGO-ROM',
          ipa: 'ðə dɒg ræn ɪn ðə pɑːk',
          syllables: [{ onset: 'p', nucleus: 'ɑː', coda: 'k', stress: true }],
          rhymeNucleus: 'ɑːk',
          method: 'service',
          lowResource: false,
        },
        {
          success: true,
          text: sourceLines[3]!,
          langCode: 'en',
          family: 'ALGO-ROM',
          ipa: 'hiː lɛft ə lɪtəl mɑːk',
          syllables: [{ onset: 'm', nucleus: 'ɑː', coda: 'k', stress: true }],
          rhymeNucleus: 'ɑːk',
          method: 'service',
          lowResource: false,
        },
      ]);

      const result = await matchRhymeSchemeAcrossLang(sourceLines, 'en', 'fr');

      expect(result.success).toBe(true);
      expect(result.sourceScheme).toBe('AABB');
      expect(result.targetScheme).toBe('AABB');
      expect(result.constrainedPrompt).toContain('CROSS-LANGUAGE TRANSLATION');
      expect(result.constrainedPrompt).toContain('Source language: en');
      expect(result.constrainedPrompt).toContain('Target language: fr');
      expect(result.constrainedPrompt).toContain('Source rhyme scheme: AABB');
      expect(result.sourceAnalysis).toHaveLength(4);
      expect(ipaPipeline.runIPAPipelineBatch).toHaveBeenCalledWith(sourceLines, 'en', undefined);
    });

    it('should handle lines without rhyme (X in scheme)', async () => {
      const sourceLines = ['This line has no rhyme', 'Neither does this one'];

      vi.mocked(ipaPipeline.runIPAPipelineBatch).mockResolvedValue([
        {
          success: true,
          text: sourceLines[0]!,
          langCode: 'en',
          family: 'ALGO-ROM',
          ipa: 'ðɪs laɪn hæz nəʊ raɪm',
          syllables: [{ onset: 'r', nucleus: 'aɪ', coda: 'm', stress: true }],
          rhymeNucleus: 'aɪm',
          method: 'service',
          lowResource: false,
        },
        {
          success: true,
          text: sourceLines[1]!,
          langCode: 'en',
          family: 'ALGO-ROM',
          ipa: 'niːðə dʌz ðɪs wʌn',
          syllables: [{ onset: 'w', nucleus: 'ʌ', coda: 'n', stress: true }],
          rhymeNucleus: 'ʌn',
          method: 'service',
          lowResource: false,
        },
      ]);

      const result = await matchRhymeSchemeAcrossLang(sourceLines, 'en', 'ee');

      expect(result.success).toBe(true);
      expect(result.sourceScheme).toBe('AB');
      expect(result.constrainedPrompt).toContain('Source rhyme scheme: AB');
    });

    it('should build constrained prompt with phonemic analysis', async () => {
      const sourceLines = ['Roses are red', 'Violets are blue'];

      vi.mocked(ipaPipeline.runIPAPipelineBatch).mockResolvedValue([
        {
          success: true,
          text: sourceLines[0]!,
          langCode: 'en',
          family: 'ALGO-ROM',
          ipa: 'rəʊzɪz ɑː rɛd',
          syllables: [
            { onset: 'r', nucleus: 'əʊ', coda: '', stress: true },
            { onset: 'z', nucleus: 'ɪ', coda: 'z', stress: false },
            { onset: 'r', nucleus: 'ɛ', coda: 'd', stress: true },
          ],
          rhymeNucleus: 'ɛd',
          method: 'service',
          lowResource: false,
        },
        {
          success: true,
          text: sourceLines[1]!,
          langCode: 'en',
          family: 'ALGO-ROM',
          ipa: 'vaɪələts ɑː bluː',
          syllables: [
            { onset: 'v', nucleus: 'aɪ', coda: '', stress: true },
            { onset: 'bl', nucleus: 'uː', coda: '', stress: true },
          ],
          rhymeNucleus: 'uː',
          method: 'service',
          lowResource: false,
        },
      ]);

      const result = await matchRhymeSchemeAcrossLang(sourceLines, 'en', 'fr');

      expect(result.success).toBe(true);
      expect(result.constrainedPrompt).toContain('RN: /ɛd/');
      expect(result.constrainedPrompt).toContain('RN: /uː/');
      expect(result.constrainedPrompt).toContain('3 syllables');
      expect(result.constrainedPrompt).toContain('2 syllables');
      expect(result.constrainedPrompt).toContain('RHYME CONSTRAINTS');
    });

    it('should fall back to graphemic analysis for unsupported source languages without throwing', async () => {
      const sourceLines = ['Ɖeka la', 'Ɖeka gba'];

      vi.mocked(ipaPipeline.runIPAPipelineBatch).mockResolvedValue([
        {
          success: true,
          text: sourceLines[0]!,
          langCode: 'zz',
          family: 'ALGO-ROM',
          ipa: 'ɖeka la',
          syllables: [{ onset: 'l', nucleus: 'a', coda: '', stress: true }],
          rhymeNucleus: 'a',
          method: 'graphemic',
          lowResource: true,
        },
        {
          success: true,
          text: sourceLines[1]!,
          langCode: 'zz',
          family: 'ALGO-ROM',
          ipa: 'ɖeka gba',
          syllables: [{ onset: 'gb', nucleus: 'a', coda: '', stress: true }],
          rhymeNucleus: 'a',
          method: 'graphemic',
          lowResource: true,
        },
      ]);

      await expect(matchRhymeSchemeAcrossLang(sourceLines, 'zz', 'fr')).resolves.toMatchObject({
        success: true,
        sourceScheme: 'AA',
        targetScheme: 'AA',
      });
    });

    it('should return immediately when the signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      const result = await matchRhymeSchemeAcrossLang(['Test line'], 'en', 'fr', controller.signal);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Operation aborted');
      expect(ipaPipeline.runIPAPipelineBatch).not.toHaveBeenCalled();
    });

    it('should handle IPA pipeline errors gracefully', async () => {
      const sourceLines = ['Test line'];

      vi.mocked(ipaPipeline.runIPAPipelineBatch).mockRejectedValue(
        new Error('Pipeline failed')
      );

      const result = await matchRhymeSchemeAcrossLang(sourceLines, 'en', 'fr');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Pipeline failed');
    });

    it('should propagate the abort signal to the IPA batch pipeline', async () => {
      const sourceLines = ['Test line'];
      const controller = new AbortController();

      vi.mocked(ipaPipeline.runIPAPipelineBatch).mockResolvedValue([
        {
          success: true,
          text: sourceLines[0]!,
          langCode: 'en',
          family: 'ALGO-ROM',
          ipa: 'tɛst laɪn',
          syllables: [{ onset: 'l', nucleus: 'aɪ', coda: 'n', stress: true }],
          rhymeNucleus: 'aɪn',
          method: 'service',
          lowResource: false,
        },
      ]);

      await matchRhymeSchemeAcrossLang(sourceLines, 'en', 'fr', controller.signal);

      expect(ipaPipeline.runIPAPipelineBatch).toHaveBeenCalledWith(sourceLines, 'en', controller.signal);
    });
  });

  describe('validateTranslatedLineRhyme', () => {
    it('should return true when no peer lines to compare', async () => {
      const isValid = await validateTranslatedLineRhyme(
        'Test line',
        'fr',
        'test',
        []
      );

      expect(isValid).toBe(true);
    });

    it('should validate rhyme against peer lines', async () => {
      const translatedLine = 'Les roses sont rouges';
      const peerLines = ['Les cieux sont rouges'];

      vi.mocked(ipaPipeline.compareTextsWithIPA).mockResolvedValue({
        score: 0.85,
        quality: 'rich',
        distance: 0.15,
        method: 'feature-weighted',
      });

      const isValid = await validateTranslatedLineRhyme(
        translatedLine,
        'fr',
        'uʒ',
        peerLines,
        0.75
      );

      expect(isValid).toBe(true);
      expect(ipaPipeline.compareTextsWithIPA).toHaveBeenCalledWith(
        translatedLine,
        peerLines[0],
        'fr'
      );
    });

    it('should reject line when rhyme similarity is below threshold', async () => {
      const translatedLine = 'Les roses sont jaunes';
      const peerLines = ['Les cieux sont rouges'];

      vi.mocked(ipaPipeline.compareTextsWithIPA).mockResolvedValue({
        score: 0.3,
        quality: 'weak',
        distance: 0.7,
        method: 'feature-weighted',
      });

      const isValid = await validateTranslatedLineRhyme(
        translatedLine,
        'fr',
        'uʒ',
        peerLines,
        0.75
      );

      expect(isValid).toBe(false);
    });

    it('should accept line if it rhymes with at least one peer', async () => {
      const translatedLine = 'Roses are red';
      const peerLines = ['Violets are blue', 'The bed is made'];

      // First comparison fails, second succeeds
      vi.mocked(ipaPipeline.compareTextsWithIPA)
        .mockResolvedValueOnce({
          score: 0.2,
          quality: 'weak',
          distance: 0.8,
          method: 'feature-weighted',
        })
        .mockResolvedValueOnce({
          score: 0.9,
          quality: 'rich',
          distance: 0.1,
          method: 'feature-weighted',
        });

      const isValid = await validateTranslatedLineRhyme(
        translatedLine,
        'en',
        'ɛd',
        peerLines,
        0.75
      );

      expect(isValid).toBe(true);
      expect(ipaPipeline.compareTextsWithIPA).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateTranslatedLines', () => {
    it('should throw error when line count does not match scheme', async () => {
      await expect(
        validateTranslatedLines(['line1', 'line2'], 'AAA', 'fr')
      ).rejects.toThrow('Number of translated lines must match source scheme length');
    });

    it('should validate all lines in AABB scheme', async () => {
      const translatedLines = [
        'Le chat sur le tapis',
        'Avec un joli chapeau',
        'Le chien dans le parc',
        'Il laisse une marque',
      ];
      const scheme = 'AABB';

      // Mock comparisons: lines 0-1 rhyme, lines 2-3 rhyme
      vi.mocked(ipaPipeline.compareTextsWithIPA).mockResolvedValue({
        score: 0.85,
        quality: 'rich',
        distance: 0.15,
        method: 'feature-weighted',
      });

      const results = await validateTranslatedLines(translatedLines, scheme, 'fr');

      expect(results).toHaveLength(4);
      expect(results).toEqual([true, true, true, true]);
    });

    it('should mark lines with X as valid without checking', async () => {
      const translatedLines = ['line1', 'line2', 'line3'];
      const scheme = 'AXB';

      vi.mocked(ipaPipeline.compareTextsWithIPA).mockResolvedValue({
        score: 0.9,
        quality: 'rich',
        distance: 0.1,
        method: 'feature-weighted',
      });

      const results = await validateTranslatedLines(translatedLines, scheme, 'fr');

      expect(results).toHaveLength(3);
      expect(results[1]).toBe(true); // X line always valid
      // compareTextsWithIPA should not be called for X line
    });

    it('should correctly validate mixed rhyme scheme', async () => {
      const translatedLines = ['a', 'b', 'a', 'b'];
      const scheme = 'ABAB';

      // Mock: a lines rhyme (0,2), b lines rhyme (1,3)
      vi.mocked(ipaPipeline.compareTextsWithIPA)
        .mockImplementation(async (line1: string, line2: string) => {
          const rhymes = (line1 === 'a' && line2 === 'a') || (line1 === 'b' && line2 === 'b');
          return {
            score: rhymes ? 0.9 : 0.3,
            quality: rhymes ? 'rich' : 'weak',
            distance: rhymes ? 0.1 : 0.7,
            method: 'feature-weighted',
          };
        });

      const results = await validateTranslatedLines(translatedLines, scheme, 'fr');

      expect(results).toHaveLength(4);
      expect(results).toEqual([true, true, true, true]);
    });
  });
});
