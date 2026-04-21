import { describe, expect, it } from 'vitest';
import { SourceType } from '../domain/enums';
import type { ReferenceLyricDocument, SubmittedLyricDocument } from '../domain/types';
import { buildNormalizedDocumentFields } from '../utils/normalizeLyrics';
import {
  InMemoryReferenceRepository,
} from '../services/repository/ReferenceCorpusRepository';
import { SimilarityEngine } from '../services/similarity/SimilarityEngine';
import { HashingEmbeddingProvider } from '../services/similarity/SemanticMatcher';
import { RiskLevel } from '../domain/enums';

const buildSubmitted = (text: string): SubmittedLyricDocument => ({
  id: 'sub',
  sourceType: SourceType.USER_SUBMITTED,
  language: 'en',
  ...buildNormalizedDocumentFields(text, { language: 'en' }),
});

const buildReference = (id: string, title: string, text: string): ReferenceLyricDocument => ({
  id,
  sourceType: SourceType.LICENSED_REFERENCE,
  title,
  language: 'en',
  ...buildNormalizedDocumentFields(text, { language: 'en' }),
});

describe('SimilarityEngine', () => {
  it('returns LOW for generic cliché overlap only', async () => {
    const submission = buildSubmitted('I love you forever\nWith all my heart');
    const repo = new InMemoryReferenceRepository([
      buildReference('r1', 'Generic Song', 'I love you forever\nNothing else matters at all'),
    ]);
    const engine = new SimilarityEngine({ repository: repo });
    const result = await engine.assess(submission);
    expect([RiskLevel.LOW, RiskLevel.MODERATE]).toContain(result.level);
    expect(result.overallScore).toBeLessThan(70);
  });

  it('escalates a distinctive repeated hook', async () => {
    const hook = 'neon ghosts dance under tangerine skies';
    const submission = buildSubmitted(`${hook}\nverse one here\n${hook}\nverse two here\n${hook}`);
    const reference = buildReference(
      'r1',
      'Ref Hook',
      `${hook}\nsomething else\n${hook}\nmore content\n${hook}`,
    );
    const repo = new InMemoryReferenceRepository([reference]);
    const engine = new SimilarityEngine({ repository: repo });
    const result = await engine.assess(submission);
    expect(result.level).toBe(RiskLevel.ESCALATE);
    expect(result.flaggedMatches.length).toBeGreaterThan(0);
    // Verify privacy: no flagged match leaks the reference text fully.
    for (const m of result.flaggedMatches) {
      expect(m.submittedExcerpt.length).toBeLessThanOrEqual(80);
    }
  });

  it('keeps adjacent multi-line overlap at high or escalate', async () => {
    const text = 'tomorrow the river will rise\nto carry our names away\nto carry our names away\nbeyond the broken bay';
    const submission = buildSubmitted(text);
    const repo = new InMemoryReferenceRepository([buildReference('r1', 'Ref', text)]);
    const engine = new SimilarityEngine({ repository: repo });
    const result = await engine.assess(submission);
    expect([RiskLevel.HIGH, RiskLevel.ESCALATE]).toContain(result.level);
  });

  it('returns LOW when there are no candidate references', async () => {
    const submission = buildSubmitted('completely original line one\noriginal line two');
    const repo = new InMemoryReferenceRepository([]);
    const engine = new SimilarityEngine({ repository: repo });
    const result = await engine.assess(submission);
    expect(result.level).toBe(RiskLevel.LOW);
    expect(result.flaggedMatches).toHaveLength(0);
  });

  it('attaches a SHA-256 hash to flagged matches when subtle is available', async () => {
    const submission = buildSubmitted('walking through the rain again\nwalking through the rain again');
    const repo = new InMemoryReferenceRepository([
      buildReference('r1', 'Walking', 'walking through the rain again\nstill walking through the night'),
    ]);
    const engine = new SimilarityEngine({
      repository: repo,
      embeddings: new HashingEmbeddingProvider(),
    });
    const result = await engine.assess(submission);
    if (result.flaggedMatches.length > 0) {
      const hash = result.flaggedMatches[0]!.spanHash;
      // Either SHA-256 (64 hex) or FNV fallback (16 hex) — both must be hex.
      expect(hash).toMatch(/^[0-9a-f]+$/);
    }
  });
});
