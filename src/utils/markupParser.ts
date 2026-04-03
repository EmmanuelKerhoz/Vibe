/**
 * markupParser.ts
 *
 * Pure utility functions for converting between the structured `Section[]`
 * song model and the plain-text markup format displayed in the markup editor.
 *
 * These helpers have NO React dependencies and are unit-testable in isolation.
 *
 * Extracted from `useMarkupEditor` (Phase-1 structural refactor).
 */
import { cleanSectionName } from './songUtils';
import {
  BRACKET_TOKEN_REGEX,
  isPureMetaLine,
  isSectionHeader,
  isEmptyBracketLine,
  unwrapBracketToken,
} from './metaUtils';
import { generateId } from './idUtils';
import { countSyllables } from './syllableUtils';
import type { Section } from '../types';

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Returns true if a token should be excluded from processing (empty or empty bracket). */
const isArtifact = (text: string): boolean => {
  const t = text.trim();
  return t === '' || isEmptyBracketLine(t);
};

/**
 * Splits a raw text line into individual bracketed tokens + plain text.
 *
 * e.g. "[Intro][Deep dry kicks]" → ["[Intro]", "[Deep dry kicks]"]
 * e.g. "[Verse 1]"              → ["[Verse 1]"]
 * e.g. "Some lyric text"        → ["Some lyric text"]
 */
export const tokenizeLine = (rawLine: string): string[] => {
  const trimmed = rawLine.trim();
  const tokenPattern = BRACKET_TOKEN_REGEX;
  tokenPattern.lastIndex = 0;
  const tokens: string[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(trimmed)) !== null) {
    if (match.index > lastIdx) {
      const plain = trimmed.slice(lastIdx, match.index).trim();
      if (plain) tokens.push(plain);
    }
    tokens.push(match[0]);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < trimmed.length) {
    const trailing = trimmed.slice(lastIdx).trim();
    if (trailing) tokens.push(trailing);
  }
  return tokens.length > 0 ? tokens : trimmed ? [trimmed] : [];
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Serialize a `Section[]` song into plain markup text.
 *
 * @param song - The structured song sections to serialize.
 * @returns A multi-line string in the markup format.
 */
export function serializeSongToMarkup(song: Section[]): string {
  const fmt = (i: string) => {
    const tr = i.trim();
    return unwrapBracketToken(tr) ? tr : `[${tr}]`;
  };
  return song
    .map(sec => {
      const pre = (sec.preInstructions ?? []).map(fmt).join('\n');
      const post = (sec.postInstructions ?? []).map(fmt).join('\n');
      const lyricText = sec.lines
        .filter(l => {
          if (isArtifact(l.text)) return false;
          const trimmedText = l.text.trim();
          const inner = unwrapBracketToken(trimmedText);
          if (inner && isSectionHeader(inner)) return false;
          return true;
        })
        .map(l => l.text)
        .join('\n');
      return `[${sec.name}]\n${pre ? pre + '\n' : ''}${lyricText}${post ? '\n' + post : ''}`;
    })
    .join('\n\n');
}

/**
 * Parse markup text back into a `Section[]` array.
 *
 * Attempts to preserve existing section / line IDs from `existingSong` so
 * that React key stability is maintained across round-trips.
 *
 * @param markupText   - The raw markup string from the editor.
 * @param existingSong - The current in-memory song (used for ID reuse).
 * @returns A new `Section[]` array derived from the markup.
 */
export function parseMarkupToSections(
  markupText: string,
  existingSong: Section[],
): Section[] {
  const rawBlocks = markupText.split(/\n\s*\n/);
  const usedSectionIds = new Set<string>();
  const usedLineIds = new Set<string>();

  return rawBlocks
    .map((block, blockIndex) => {
      const expandedLines = block
        .trim()
        .split('\n')
        .flatMap(tokenizeLine)
        .filter(tok => tok.trim().length > 0);

      if (expandedLines.length === 0) return null;

      let name = 'Verse';
      let remainingLines = expandedLines;
      const firstToken = (expandedLines[0] ?? '').trim();
      const firstTokenInner = unwrapBracketToken(firstToken);

      if (firstTokenInner && isSectionHeader(firstTokenInner)) {
        name = cleanSectionName(firstTokenInner);
        remainingLines = expandedLines.slice(1);
      }

      const preInstructions: string[] = [];
      const postInstructions: string[] = [];
      const lyricLines: string[] = [];
      let foundLyrics = false;

      remainingLines.forEach(tok => {
        if (isArtifact(tok)) return;
        const trimmed = tok.trim();
        if (unwrapBracketToken(trimmed)) {
          if (isPureMetaLine(trimmed)) {
            foundLyrics = true;
            lyricLines.push(trimmed);
          } else {
            if (foundLyrics) postInstructions.push(trimmed);
            else preInstructions.push(trimmed);
          }
        } else {
          foundLyrics = true;
          lyricLines.push(tok);
        }
      });

      // Reuse existing section ID when possible for React key stability.
      const sectionAtIndex = existingSong[blockIndex];
      const existingSection =
        sectionAtIndex && sectionAtIndex.name === name
          ? sectionAtIndex
          : existingSong.find(s => s.name === name && !usedSectionIds.has(s.id));

      let sectionId = existingSection?.id ?? generateId();
      if (usedSectionIds.has(sectionId)) sectionId = generateId();
      usedSectionIds.add(sectionId);

      return {
        id: sectionId,
        name,
        rhymeScheme: existingSection?.rhymeScheme ?? 'AABB',
        targetSyllables: existingSection?.targetSyllables ?? 8,
        mood: existingSection?.mood ?? '',
        preInstructions:
          preInstructions.length > 0
            ? preInstructions
            : (existingSection?.preInstructions ?? []),
        postInstructions:
          postInstructions.length > 0
            ? postInstructions
            : (existingSection?.postInstructions ?? []),
        lines: lyricLines.map((text, lIdx) => {
          const isMeta = isPureMetaLine(text.trim());
          const existingLineByText = existingSection?.lines.find(
            l => l.text === text && !usedLineIds.has(l.id),
          );
          // Safe: use optional chaining instead of non-null assertion.
          // existingSection.lines[lIdx] may be undefined when lIdx >= lines.length.
          const existingLineAtIndex = existingSection?.lines[lIdx];
          const existingLineByIndex =
            existingLineAtIndex && !usedLineIds.has(existingLineAtIndex.id)
              ? existingLineAtIndex
              : null;
          const existingLine = existingLineByText ?? existingLineByIndex ?? null;

          let lineId = existingLine?.id ?? generateId();
          if (usedLineIds.has(lineId)) lineId = generateId();
          usedLineIds.add(lineId);

          return {
            id: lineId,
            text,
            rhymingSyllables: existingLine?.rhymingSyllables ?? '',
            rhyme: existingLine?.rhyme ?? '',
            syllables: isMeta
              ? 0
              : text.split(/\s+/).reduce(
                  (acc, word) => acc + (word ? countSyllables(word) : 0),
                  0,
                ),
            concept: existingLine?.concept ?? (isMeta ? 'Meta' : 'New line'),
            isManual: true,
            isMeta,
          };
        }),
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);
}
