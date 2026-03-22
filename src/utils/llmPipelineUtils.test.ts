import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reverseTranslateLines, reviewTranslationFidelity } from './llmPipelineUtils';
import * as aiUtils from './aiUtils';

vi.mock('./aiUtils', async () => {
  const actual = await vi.importActual('./aiUtils');
  return {
    ...actual,
    generateContentWithRetry: vi.fn(),
  };
});

describe('llmPipelineUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reverseTranslateLines returns early for empty line sets', async () => {
    expect(await reverseTranslateLines([], 'French', 'English')).toEqual([]);
    expect(aiUtils.generateContentWithRetry).not.toHaveBeenCalled();
  });

  it('reverseTranslateLines delegates to the generic LLM helper with translation prompt', async () => {
    vi.mocked(aiUtils.generateContentWithRetry).mockResolvedValue({ text: '["hello"]' });

    const result = await reverseTranslateLines(['bonjour'], 'French', 'English');

    expect(result).toEqual(['hello']);
    expect(aiUtils.generateContentWithRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        model: aiUtils.AI_MODEL_NAME,
        contents: expect.stringContaining('Translate the following French lyrics LITERALLY'),
      }),
    );
  });

  it('reviewTranslationFidelity parses the returned score and warnings', async () => {
    vi.mocked(aiUtils.generateContentWithRetry).mockResolvedValue({
      text: '{"score":81,"warnings":["bridge meaning softened"]}',
    });

    const result = await reviewTranslationFidelity(
      ['original line'],
      ['reverse translated line'],
      'Spanish',
      'English',
    );

    expect(result).toEqual({
      score: 81,
      warnings: ['bridge meaning softened'],
    });
    expect(aiUtils.generateContentWithRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: expect.stringContaining('conceptual fidelity of a song adaptation from English to Spanish'),
      }),
    );
  });
});
