/**
 * Tests for prompt building utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildAdaptSectionPrompt,
  buildAdaptSongPrompt,
  buildApplyAnalysisBatchPrompt,
  buildApplyAnalysisItemPrompt,
  buildDetectLanguagePrompt,
  buildRhymeConstrainedPrompt,
  buildRhymeConstrainedPromptFromSection,
} from './promptUtils';
import type { Line, Section } from '../types';
import * as ipaPipeline from './ipaPipeline';

// Mock the IPA pipeline
vi.mock('./ipaPipeline', async () => {
  const actual = await vi.importActual('./ipaPipeline');
  return {
    ...actual,
    runIPAPipeline: vi.fn(),
  };
});

describe('promptUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildRhymeConstrainedPrompt', () => {
    it('should return basic prompt when no lines provided', async () => {
      const prompt = await buildRhymeConstrainedPrompt([], 'en', 'AABB');
      expect(prompt).toContain('AABB');
      expect(prompt).toContain('Generate lyrics');
    });

    it('should return basic prompt when no langCode provided', async () => {
      const lines: Line[] = [
        {
          id: '1',
          text: 'test line',
          rhymingSyllables: 'line',
          rhyme: 'A',
          syllables: 2,
          concept: 'test',
        },
      ];
      const prompt = await buildRhymeConstrainedPrompt(lines, '', 'AABB');
      expect(prompt).toContain('AABB');
      expect(prompt).toContain('Generate lyrics');
    });

    it('should analyze existing lines and build phonemic constraints', async () => {
      const lines: Line[] = [
        {
          id: '1',
          text: 'The cat sat on the mat',
          rhymingSyllables: 'mat',
          rhyme: 'A',
          syllables: 6,
          concept: 'cat on mat',
        },
        {
          id: '2',
          text: 'Wearing a funny hat',
          rhymingSyllables: 'hat',
          rhyme: 'A',
          syllables: 5,
          concept: 'funny hat',
        },
      ];

      // Mock IPA pipeline results
      vi.mocked(ipaPipeline.runIPAPipeline).mockImplementation(async (text: string) => {
        if (text.includes('mat')) {
          return {
            success: true,
            text,
            langCode: 'en',
            family: 'ALGO-ROM',
            ipa: 'ðə kæt sæt ɒn ðə mæt',
            syllables: [
              { onset: 'm', nucleus: 'æ', coda: 't', stress: true },
            ],
            rhymeNucleus: 'æt',
            method: 'service',
            lowResource: false,
          };
        }
        return {
          success: true,
          text,
          langCode: 'en',
          family: 'ALGO-ROM',
          ipa: 'weərɪŋ ə fʌni hæt',
          syllables: [
            { onset: 'h', nucleus: 'æ', coda: 't', stress: true },
          ],
          rhymeNucleus: 'æt',
          method: 'service',
          lowResource: false,
        };
      });

      const prompt = await buildRhymeConstrainedPrompt(lines, 'en', 'AABB');

      expect(prompt).toContain('AABB');
      expect(prompt).toContain('Existing lines');
      expect(prompt).toContain('cat sat on the mat');
      expect(prompt).toContain('PHONEMIC RHYME CONSTRAINTS');
      expect(prompt).toContain('Rhyme group "A"');
      expect(prompt).toContain('æt');
      expect(ipaPipeline.runIPAPipeline).toHaveBeenCalledTimes(2);
    });

    it('should skip empty and meta lines', async () => {
      const lines: Line[] = [
        {
          id: '1',
          text: 'Valid line',
          rhymingSyllables: 'line',
          rhyme: 'A',
          syllables: 2,
          concept: 'test',
        },
        {
          id: '2',
          text: '',
          rhymingSyllables: '',
          rhyme: '',
          syllables: 0,
          concept: '',
        },
        {
          id: '3',
          text: '[Guitar solo]',
          rhymingSyllables: '',
          rhyme: '',
          syllables: 0,
          concept: '',
          isMeta: true,
        },
      ];

      vi.mocked(ipaPipeline.runIPAPipeline).mockResolvedValue({
        success: true,
        text: 'Valid line',
        langCode: 'en',
        family: 'ALGO-ROM',
        ipa: 'ˈvælɪd laɪn',
        syllables: [
          { onset: 'l', nucleus: 'aɪ', coda: 'n', stress: true },
        ],
        rhymeNucleus: 'aɪn',
        method: 'service',
        lowResource: false,
      });

      const prompt = await buildRhymeConstrainedPrompt(lines, 'en', 'AABB');

      expect(ipaPipeline.runIPAPipeline).toHaveBeenCalledTimes(1);
      expect(prompt).toContain('Valid line');
      expect(prompt).not.toContain('Guitar solo');
    });

    it('should handle FREE rhyme scheme without constraints', async () => {
      const lines: Line[] = [
        {
          id: '1',
          text: 'Free form line',
          rhymingSyllables: '',
          rhyme: 'FREE',
          syllables: 3,
          concept: 'free',
        },
      ];

      vi.mocked(ipaPipeline.runIPAPipeline).mockResolvedValue({
        success: true,
        text: 'Free form line',
        langCode: 'en',
        family: 'ALGO-ROM',
        ipa: 'friː fɔːm laɪn',
        syllables: [
          { onset: 'l', nucleus: 'aɪ', coda: 'n' },
        ],
        rhymeNucleus: 'aɪn',
        method: 'service',
        lowResource: false,
      });

      const prompt = await buildRhymeConstrainedPrompt(lines, 'en', 'FREE');

      expect(prompt).toContain('FREE');
      expect(prompt).not.toContain('PHONEMIC RHYME CONSTRAINTS');
    });

    it('should calculate average syllable count', async () => {
      const lines: Line[] = [
        {
          id: '1',
          text: 'Line one',
          rhymingSyllables: 'one',
          rhyme: 'A',
          syllables: 2,
          concept: 'test',
        },
        {
          id: '2',
          text: 'Line two here',
          rhymingSyllables: 'here',
          rhyme: 'B',
          syllables: 3,
          concept: 'test',
        },
      ];

      vi.mocked(ipaPipeline.runIPAPipeline).mockImplementation(async (text: string) => ({
        success: true,
        text,
        langCode: 'en',
        family: 'ALGO-ROM',
        ipa: 'test',
        syllables: text.includes('one')
          ? [{ onset: '', nucleus: 'ʌ', coda: 'n' }, { onset: '', nucleus: 'ʌ', coda: 'n' }]
          : [{ onset: '', nucleus: 'ɪ', coda: 'ə' }, { onset: '', nucleus: 'ɪ', coda: 'ə' }, { onset: '', nucleus: 'ɪ', coda: 'ə' }],
        rhymeNucleus: 'test',
        method: 'service',
        lowResource: false,
      }));

      const prompt = await buildRhymeConstrainedPrompt(lines, 'en', 'AABB');

      expect(prompt).toContain('approximately');
      expect(prompt).toMatch(/\d+ syllables/);
    });

    it('should handle IPA pipeline failures gracefully', async () => {
      const lines: Line[] = [
        {
          id: '1',
          text: 'Test line',
          rhymingSyllables: 'line',
          rhyme: 'A',
          syllables: 2,
          concept: 'test',
        },
      ];

      vi.mocked(ipaPipeline.runIPAPipeline).mockResolvedValue({
        success: false,
        text: 'Test line',
        langCode: 'en',
        family: 'ALGO-ROM',
        ipa: '',
        syllables: [],
        rhymeNucleus: '',
        method: 'graphemic',
        lowResource: true,
      });

      const prompt = await buildRhymeConstrainedPrompt(lines, 'en', 'AABB');

      // Should still generate a prompt, just without phonemic constraints
      expect(prompt).toContain('AABB');
      expect(prompt).toContain('Test line');
    });
  });

  describe('buildRhymeConstrainedPromptFromSection', () => {
    it('should extract langCode from section.language', async () => {
      const section: Section = {
        id: 'verse1',
        name: 'Verse 1',
        language: 'fr',
        rhymeScheme: 'ABAB',
        lines: [
          {
            id: '1',
            text: 'Un chat noir',
            rhymingSyllables: 'noir',
            rhyme: 'A',
            syllables: 3,
            concept: 'black cat',
          },
        ],
      };

      vi.mocked(ipaPipeline.runIPAPipeline).mockResolvedValue({
        success: true,
        text: 'Un chat noir',
        langCode: 'fr',
        family: 'ALGO-ROM',
        ipa: 'œ̃ ʃa nwaʁ',
        syllables: [
          { onset: 'n', nucleus: 'wa', coda: 'ʁ', stress: true },
        ],
        rhymeNucleus: 'waʁ',
        method: 'service',
        lowResource: false,
      });

      const prompt = await buildRhymeConstrainedPromptFromSection(section);

      expect(prompt).toContain('ABAB');
      expect(prompt).toContain('Un chat noir');
      expect(ipaPipeline.runIPAPipeline).toHaveBeenCalledWith('Un chat noir', 'fr');
    });

    it('should default to English if no language specified', async () => {
      const section: Section = {
        id: 'verse1',
        name: 'Verse 1',
        rhymeScheme: 'AABB',
        lines: [
          {
            id: '1',
            text: 'Test',
            rhymingSyllables: 'Test',
            rhyme: 'A',
            syllables: 1,
            concept: 'test',
          },
        ],
      };

      vi.mocked(ipaPipeline.runIPAPipeline).mockResolvedValue({
        success: true,
        text: 'Test',
        langCode: 'en',
        family: 'ALGO-ROM',
        ipa: 'test',
        syllables: [{ onset: 't', nucleus: 'ɛ', coda: 'st' }],
        rhymeNucleus: 'ɛst',
        method: 'service',
        lowResource: false,
      });

      await buildRhymeConstrainedPromptFromSection(section);

      expect(ipaPipeline.runIPAPipeline).toHaveBeenCalledWith('Test', 'en');
    });

    it('should default to FREE rhyme scheme if not specified', async () => {
      const section: Section = {
        id: 'verse1',
        name: 'Verse 1',
        language: 'en',
        lines: [],
      };

      const prompt = await buildRhymeConstrainedPromptFromSection(section);

      expect(prompt).toContain('FREE');
    });
  });

  describe('apply analysis prompt builders', () => {
    const song: Section[] = [
      {
        id: 'verse-1',
        name: 'Verse 1',
        language: 'en',
        rhymeScheme: 'AABB',
        lines: [
          {
            id: 'line-1',
            text: 'We chase the light',
            rhymingSyllables: 'light',
            rhyme: 'A',
            syllables: 4,
            concept: 'hope',
          },
        ],
      },
    ];
    const expectedRules = `IMPORTANT:
1. Maintain the existing section structure (Intro, Verse, Chorus, etc.).
2. Only update the lyrics as suggested.
3. Return the FULL updated song in the same JSON format as the input.
4. Do not change the section names unless specifically requested.
5. Preserve the original song language in all lyric text fields.
6. Write the "concept" field for each line in English.

Current Song Data:`;

    it('buildApplyAnalysisBatchPrompt includes all item strings and shared rules', () => {
      const itemsToApply = [
        'Tighten the internal rhyme in the second line',
        'Make the chorus imagery more vivid',
      ];

      const prompt = buildApplyAnalysisBatchPrompt({
        song,
        itemsToApply,
        uiLanguage: 'English',
      });

      itemsToApply.forEach(item => {
        expect(prompt).toContain(item);
      });
      expect(prompt).toContain(expectedRules);
      expect(prompt).toContain(JSON.stringify(song));
    });

    it('buildApplyAnalysisItemPrompt includes the item text and shared rules', () => {
      const itemText = 'Add more emotional specificity to the verse';

      const prompt = buildApplyAnalysisItemPrompt({
        song,
        itemText,
        uiLanguage: 'English',
      });

      expect(prompt).toContain(itemText);
      expect(prompt).toContain(expectedRules);
      expect(prompt).toContain(JSON.stringify(song));
    });

    it('shares identical apply rules text between batch and item prompts', () => {
      const batchPrompt = buildApplyAnalysisBatchPrompt({
        song,
        itemsToApply: ['Strengthen the bridge transition'],
        uiLanguage: 'English',
      });
      const itemPrompt = buildApplyAnalysisItemPrompt({
        song,
        itemText: 'Strengthen the bridge transition',
        uiLanguage: 'English',
      });

      // The shared APPLY_PROMPT_RULES block (starting with "IMPORTANT:\n1. Maintain")
      // and the trailing fenced song JSON must be identical between the two builders.
      const RULES_MARKER = 'IMPORTANT:\n1. Maintain';
      const batchRules = batchPrompt.slice(batchPrompt.indexOf(RULES_MARKER));
      const itemRules = itemPrompt.slice(itemPrompt.indexOf(RULES_MARKER));

      expect(batchRules).toBe(itemRules);
    });
  });

  describe('language adapter prompt builders', () => {
    const section: Section = {
      id: 'verse-1',
      name: 'Verse 1',
      language: 'en',
      rhymeScheme: 'AABB',
      lines: [
        {
          id: 'line-1',
          text: 'We chase the light',
          rhymingSyllables: 'light',
          rhyme: 'A',
          syllables: 4,
          concept: 'hope',
        },
      ],
    };

    it('buildDetectLanguagePrompt truncates long lyrics samples and emits an explicit truncation marker', () => {
      const prompt = buildDetectLanguagePrompt('a'.repeat(2105));
      expect(prompt).toContain('Analyze the languages used in these lyrics');
      // The sanitizer caps to DETECT_LANGUAGE_LYRICS_MAX_CHARS (2000) and
      // appends a "… [truncated]" marker so the model knows it is seeing a
      // sample, not the full song.
      expect(prompt).toContain('… [truncated]');
      // The fenced LYRICS payload itself must not exceed the cap.
      const lyricsBlock = prompt.slice(prompt.indexOf('<<<LYRICS>>>'), prompt.indexOf('<<<END LYRICS>>>'));
      const lyricsBody = lyricsBlock.replace('<<<LYRICS>>>\n', '').trimEnd();
      expect(lyricsBody.length).toBeLessThanOrEqual(2000);
      // No 2001-char run of "a" should survive — the marker replaces the tail.
      expect(prompt).not.toContain('a'.repeat(2001));
    });

    it('buildDetectLanguagePrompt does not append a truncation marker when input fits the cap', () => {
      const prompt = buildDetectLanguagePrompt('a'.repeat(100));
      expect(prompt).toContain('a'.repeat(100));
      expect(prompt).not.toContain('… [truncated]');
    });

    it('buildAdaptSongPrompt includes adaptation instructions and optional IPA constraints', () => {
      const prompt = buildAdaptSongPrompt({
        sourceSong: [section],
        newLanguage: 'French',
        uiLanguage: 'English',
        ipaEnhancedPrompt: '\n\nIPA BLOCK',
      });

      expect(prompt).toContain('Adapt the following song lyrics to French');
      expect(prompt).toContain('Write the "concept" field for each line in English');
      expect(prompt).toContain(JSON.stringify([section]));
      expect(prompt).toContain('IPA BLOCK');
    });

    it('buildAdaptSongPrompt instructs AI to use native script and not romanize', () => {
      const prompt = buildAdaptSongPrompt({
        sourceSong: [section],
        newLanguage: 'Yoruba',
        uiLanguage: 'English',
      });

      expect(prompt).toContain('authentic writing system and orthography of Yoruba');
      expect(prompt).toContain('Do NOT use phonetic transcription, romanization, or IPA notation');
    });

    it('buildAdaptSectionPrompt keeps section-scoped instructions isolated from the hook', () => {
      const prompt = buildAdaptSectionPrompt({
        section,
        newLanguage: 'Spanish',
        uiLanguage: 'French',
      });

      expect(prompt).toContain('Adapt the following song section to Spanish');
      expect(prompt).toContain('Write the "concept" field for each line in French');
      expect(prompt).toContain(JSON.stringify(section));
    });

    it('buildAdaptSectionPrompt instructs AI to use native script and not romanize', () => {
      const prompt = buildAdaptSectionPrompt({
        section,
        newLanguage: 'Wolof',
        uiLanguage: 'French',
      });

      expect(prompt).toContain('authentic writing system and orthography of Wolof');
      expect(prompt).toContain('Do NOT use phonetic transcription, romanization, or IPA notation');
    });

    it('buildAdaptSongPrompt embeds stored syllable counts in the SYLLABLE CONSTRAINTS block', () => {
      const prompt = buildAdaptSongPrompt({
        sourceSong: [section],
        newLanguage: 'French',
        uiLanguage: 'English',
      });

      expect(prompt).toContain('SYLLABLE CONSTRAINTS');
      // Stored Line.syllables = 4
      expect(prompt).toContain('"We chase the light" → MUST have 4 syllables');
    });

    it('buildAdaptSongPrompt prefers IPA pipeline syllable counts over stale stored values', () => {
      const ipaSyllableCounts = new Map<string, number>([['line-1', 7]]);
      const prompt = buildAdaptSongPrompt({
        sourceSong: [section],
        newLanguage: 'French',
        uiLanguage: 'English',
        ipaSyllableCounts,
      });

      // Fresh IPA count (7) overrides stored value (4)
      expect(prompt).toContain('"We chase the light" → MUST have 7 syllables');
      expect(prompt).not.toContain('MUST have 4 syllables');
    });

    it('buildAdaptSectionPrompt prefers IPA pipeline syllable counts over stale stored values', () => {
      const ipaSyllableCounts = new Map<string, number>([['line-1', 6]]);
      const prompt = buildAdaptSectionPrompt({
        section,
        newLanguage: 'Spanish',
        uiLanguage: 'French',
        ipaSyllableCounts,
      });

      expect(prompt).toContain('"We chase the light" → MUST have 6 syllables');
      expect(prompt).not.toContain('MUST have 4 syllables');
    });

    it('buildAdaptSongPrompt does not throw when a section has undefined lines', () => {
      const malformedSection = { id: 's', name: 'Bad', rhymeScheme: 'FREE' } as unknown as Section;

      expect(() =>
        buildAdaptSongPrompt({
          sourceSong: [malformedSection, section],
          newLanguage: 'French',
          uiLanguage: 'English',
        })
      ).not.toThrow();

      const prompt = buildAdaptSongPrompt({
        sourceSong: [malformedSection, section],
        newLanguage: 'French',
        uiLanguage: 'English',
      });

      // The malformed section is skipped, but the well-formed one still contributes.
      expect(prompt).toContain('"We chase the light" → MUST have 4 syllables');
    });

    it('buildAdaptSectionPrompt does not throw when section.lines is undefined', () => {
      const malformedSection = { id: 's', name: 'Bad', rhymeScheme: 'FREE' } as unknown as Section;

      expect(() =>
        buildAdaptSectionPrompt({
          section: malformedSection,
          newLanguage: 'French',
          uiLanguage: 'English',
        })
      ).not.toThrow();

      const prompt = buildAdaptSectionPrompt({
        section: malformedSection,
        newLanguage: 'French',
        uiLanguage: 'English',
      });

      // No syllable data → no SYLLABLE CONSTRAINTS block emitted.
      expect(prompt).not.toContain('SYLLABLE CONSTRAINTS');
    });
  });

  describe('buildSyllableConstraintsBlock (via buildAdaptSongPrompt)', () => {
    // The block builder is an internal helper; we exercise its branches
    // through the public adapt-song prompt so the tests stay tied to the
    // observable prompt contract.

    const sectionWithMixedLines: Section = {
      id: 'verse-mixed',
      name: 'Verse Mixed',
      language: 'en',
      rhymeScheme: 'AABB',
      lines: [
        // Valid sung line — must appear in constraints.
        { id: 'l-valid', text: 'We chase the light', rhymingSyllables: 'light', rhyme: 'A', syllables: 4, concept: '' },
        // Meta line (e.g. "[Guitar solo]") — must be skipped.
        { id: 'l-meta', text: '[Guitar solo]', rhymingSyllables: '', rhyme: '', syllables: 3, concept: '', isMeta: true },
        // Empty text — must be skipped even though syllables > 0.
        { id: 'l-empty', text: '', rhymingSyllables: '', rhyme: '', syllables: 5, concept: '' },
        // Whitespace-only text — must be skipped.
        { id: 'l-blank', text: '   ', rhymingSyllables: '', rhyme: '', syllables: 6, concept: '' },
        // Stored syllables = 0 → no constraint emitted unless IPA provides one.
        { id: 'l-zero', text: 'Just an idea', rhymingSyllables: 'idea', rhyme: 'B', syllables: 0, concept: '' },
      ],
    };

    const extractConstraintsBlock = (prompt: string): string => {
      const start = prompt.indexOf('SYLLABLE CONSTRAINTS');
      if (start === -1) return '';
      const end = prompt.indexOf('<<<CURRENT_SONG_DATA>>>', start);
      return end === -1 ? prompt.slice(start) : prompt.slice(start, end);
    };

    it('skips meta lines and empty/whitespace-only text in the constraints block', () => {
      const prompt = buildAdaptSongPrompt({
        sourceSong: [sectionWithMixedLines],
        newLanguage: 'French',
        uiLanguage: 'English',
      });
      const block = extractConstraintsBlock(prompt);

      expect(block).toContain('"We chase the light" → MUST have 4 syllables');
      expect(block).not.toContain('[Guitar solo]');
      // The zero-syllable line has no stored count and no IPA override — skipped.
      expect(block).not.toContain('Just an idea');
    });

    it('lets the IPA pipeline contribute counts for lines whose stored syllables are 0', () => {
      const ipaSyllableCounts = new Map<string, number>([
        ['l-zero', 5],
        // Meta and empty lines must remain skipped even if IPA returns a count.
        ['l-meta', 9],
        ['l-empty', 9],
      ]);

      const prompt = buildAdaptSongPrompt({
        sourceSong: [sectionWithMixedLines],
        newLanguage: 'French',
        uiLanguage: 'English',
        ipaSyllableCounts,
      });
      const block = extractConstraintsBlock(prompt);

      expect(block).toContain('"Just an idea" → MUST have 5 syllables');
      // Meta / empty lines stay filtered out regardless of any IPA count.
      expect(block).not.toContain('[Guitar solo]');
      expect(block).not.toMatch(/MUST have 9 syllables/);
    });

    it('omits the SYLLABLE CONSTRAINTS block entirely when no line has a usable count', () => {
      const sectionWithoutCounts: Section = {
        id: 'no-counts',
        name: 'No counts',
        language: 'en',
        rhymeScheme: 'FREE',
        lines: [
          { id: 'a', text: 'Sing along', rhymingSyllables: 'along', rhyme: 'A', syllables: 0, concept: '' },
          { id: 'b', text: '[Bridge]', rhymingSyllables: '', rhyme: '', syllables: 4, concept: '', isMeta: true },
        ],
      };

      const prompt = buildAdaptSongPrompt({
        sourceSong: [sectionWithoutCounts],
        newLanguage: 'French',
        uiLanguage: 'English',
      });

      expect(prompt).not.toContain('SYLLABLE CONSTRAINTS');
    });

    it('treats negative or non-positive stored syllables as missing and falls back to IPA', () => {
      const sectionWithBadCounts: Section = {
        id: 'bad-counts',
        name: 'Bad counts',
        language: 'en',
        rhymeScheme: 'AABB',
        lines: [
          { id: 'neg', text: 'Negative line', rhymingSyllables: 'line', rhyme: 'A', syllables: -3, concept: '' },
        ],
      };

      const ipaSyllableCounts = new Map<string, number>([['neg', 4]]);

      const promptWithoutIpa = buildAdaptSongPrompt({
        sourceSong: [sectionWithBadCounts],
        newLanguage: 'French',
        uiLanguage: 'English',
      });
      expect(promptWithoutIpa).not.toContain('SYLLABLE CONSTRAINTS');

      const promptWithIpa = buildAdaptSongPrompt({
        sourceSong: [sectionWithBadCounts],
        newLanguage: 'French',
        uiLanguage: 'English',
        ipaSyllableCounts,
      });
      expect(promptWithIpa).toContain('"Negative line" → MUST have 4 syllables');
    });
  });
});
