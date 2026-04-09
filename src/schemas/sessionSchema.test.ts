/**
 * P11 — Zod guard unit tests for SessionSchema, SectionSchema, SectionLineSchema
 *
 * Covers:
 *   - valid full payload   → success
 *   - empty object         → success (all fields optional)
 *   - invalid titleOrigin  → failure with ZodError
 *   - unknown top-level key stripped (not passthrough)
 *   - SectionLineSchema passthrough preserves unknown fields
 *   - SectionSchema passthrough preserves unknown fields
 *   - safeParse.success === false path explicitly tested
 */
import { describe, expect, it } from 'vitest';
import {
  SessionSchema,
  SectionSchema,
  SectionLineSchema,
} from './sessionSchema';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validLine = {
  id: 'line-1',
  text: 'Hello world',
  rhyme: 'A',
  syllables: 3,
  phonemes: ['HH', 'AH', 'L', 'OW'],
  rhymingSyllables: 'world',
  concept: 'greeting',
  isManual: false,
};

const validSection = {
  id: 'sec-1',
  name: 'Verse 1',
  lines: [validLine],
  rhymeScheme: 'AABB',
  targetSyllables: 8,
  mood: 'hopeful',
  preInstructions: ['Keep it short'],
  postInstructions: [],
};

const validSession = {
  song: [validSection],
  structure: ['Verse 1', 'Chorus'],
  title: 'My Song',
  titleOrigin: 'user' as const,
  topic: 'love',
  mood: 'happy',
  rhymeScheme: 'ABAB',
  targetSyllables: 8,
  genre: 'pop',
  tempo: 120,
  instrumentation: 'guitar',
  rhythm: '4/4',
  narrative: 'story of love',
  musicalPrompt: 'upbeat pop',
  songLanguage: 'en',
};

// ---------------------------------------------------------------------------
// SessionSchema
// ---------------------------------------------------------------------------

describe('SessionSchema', () => {
  it('accepts a valid full session payload', () => {
    const result = SessionSchema.safeParse(validSession);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Song');
      expect(result.data.song).toHaveLength(1);
    }
  });

  it('accepts an empty object (all fields optional)', () => {
    const result = SessionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts titleOrigin = "ai"', () => {
    const result = SessionSchema.safeParse({ titleOrigin: 'ai' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid titleOrigin value → safeParse.success === false', () => {
    const result = SessionSchema.safeParse({ titleOrigin: 'robot' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('titleOrigin');
    }
  });

  it('accepts tempo as a string (union type)', () => {
    const result = SessionSchema.safeParse({ tempo: 'allegro' });
    expect(result.success).toBe(true);
  });

  it('strips unknown top-level keys (no passthrough on SessionSchema)', () => {
    const result = SessionSchema.safeParse({
      title: 'Test',
      _legacyFlag: true,
      __internalCache: { foo: 'bar' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('_legacyFlag' in result.data).toBe(false);
      expect('__internalCache' in result.data).toBe(false);
    }
  });

  it('rejects a song entry that is not an object shape (array of primitives)', () => {
    // z.array(SectionSchema) — string is not a valid section
    const result = SessionSchema.safeParse({ song: ['not-a-section'] });
    expect(result.success).toBe(false);
  });

  it('preserves a valid song array with partial section data', () => {
    const result = SessionSchema.safeParse({
      song: [{ name: 'Chorus' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.song?.[0]?.name).toBe('Chorus');
    }
  });
});

// ---------------------------------------------------------------------------
// SectionSchema
// ---------------------------------------------------------------------------

describe('SectionSchema', () => {
  it('accepts a valid full section', () => {
    const result = SectionSchema.safeParse(validSection);
    expect(result.success).toBe(true);
  });

  it('accepts an empty object (all fields optional)', () => {
    const result = SectionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('preserves unknown fields via passthrough', () => {
    const result = SectionSchema.safeParse({
      name: 'Bridge',
      _runtimeMeta: { generatedAt: 1234567890 },
      customFlag: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data['_runtimeMeta']).toBeDefined();
      expect(data['customFlag']).toBe(true);
    }
  });

  it('rejects when lines contains a non-object (safeParse failure)', () => {
    const result = SectionSchema.safeParse({ lines: [42] });
    expect(result.success).toBe(false);
  });

  it('accepts targetSyllables as a number', () => {
    const result = SectionSchema.safeParse({ targetSyllables: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetSyllables).toBe(10);
    }
  });

  it('rejects targetSyllables as a string', () => {
    const result = SectionSchema.safeParse({ targetSyllables: 'ten' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SectionLineSchema
// ---------------------------------------------------------------------------

describe('SectionLineSchema', () => {
  it('accepts a valid full line', () => {
    const result = SectionLineSchema.safeParse(validLine);
    expect(result.success).toBe(true);
  });

  it('accepts an empty object (all fields optional)', () => {
    const result = SectionLineSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('preserves unknown fields via passthrough', () => {
    const result = SectionLineSchema.safeParse({
      text: 'Hello',
      _phonemeCache: ['HH', 'EH'],
      legacyField: 999,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data['_phonemeCache']).toEqual(['HH', 'EH']);
      expect(data['legacyField']).toBe(999);
    }
  });

  it('rejects syllables as a string → safeParse.success === false', () => {
    const result = SectionLineSchema.safeParse({ syllables: 'three' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('syllables');
    }
  });

  it('rejects phonemes as an array of non-strings', () => {
    const result = SectionLineSchema.safeParse({ phonemes: [1, 2, 3] });
    expect(result.success).toBe(false);
  });

  it('rejects isManual as a non-boolean', () => {
    const result = SectionLineSchema.safeParse({ isManual: 'yes' });
    expect(result.success).toBe(false);
  });
});
