/**
 * sessionSchema
 *
 * Zod schema for the localStorage session payload.
 * All fields are optional — a partial or legacy session is accepted.
 * Unrecognised keys on the top-level session object are stripped by default,
 * but unknown keys inside nested `song` sections/lines are preserved because
 * those schemas use `.passthrough()`.
 *
 * Usage:
 *   const result = SessionSchema.safeParse(JSON.parse(raw));
 *   if (result.success) { // use result.data }
 */
import { z } from 'zod';

const SectionLineSchema = z.object({
  id: z.string().optional(),
  text: z.string().optional(),
  rhyme: z.string().optional(),
  syllables: z.number().optional(),
  phonemes: z.array(z.string()).optional(),
}).passthrough(); // allow extra fields — normalizeLoadedSection will handle them

const SectionSchema = z.object({
  name: z.string().optional(),
  lines: z.array(SectionLineSchema).optional(),
  id: z.string().optional(),
}).passthrough();

export const SessionSchema = z.object({
  song: z.array(SectionSchema).optional(),
  structure: z.array(z.string()).optional(),
  title: z.string().optional(),
  titleOrigin: z.enum(['user', 'ai']).optional(),
  topic: z.string().optional(),
  mood: z.string().optional(),
  rhymeScheme: z.string().optional(),
  targetSyllables: z.number().optional(),
  genre: z.string().optional(),
  tempo: z.union([z.number(), z.string()]).optional(),
  instrumentation: z.string().optional(),
  rhythm: z.string().optional(),
  narrative: z.string().optional(),
  musicalPrompt: z.string().optional(),
  songLanguage: z.string().optional(),
});

export type SessionData = z.infer<typeof SessionSchema>;
