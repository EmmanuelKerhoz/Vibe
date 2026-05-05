/**
 * songRhymeAnalysis.ts
 *
 * Song-level rhyme analysis: groups lines by rhyme family, computes overlay
 * split points, and detects rhyme scheme per section.
 *
 * langCode is threaded through all public functions so family-specific
 * graphemic rules (tonal preservation, agglutinative syllable selection,
 * extended enjambment connectors) are applied consistently.
 */

import { doLinesRhymeGraphemic, splitRhymingSuffix } from './rhymeDetection';
import type { Section } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RhymeGroup {
  /** Canonical suffix shared by all lines in the group (canonicalized). */
  suffix: string;
  /** 0-based indices into the section's lines array. */
  lineIndices: number[];
}

export interface RhymeOverlaySegment {
  /** Text before the rhyming portion (before + whitespace from original). */
  before: string;
  /** The rhyming tail of the line as it should be highlighted in the UI. */
  rhyme: string;
  /** Structural position detected by Step-0 segmentation. */
  position: 'end' | 'internal' | 'enjambed';
}

export interface SectionRhymeAnalysis {
  /** Rhyme groups found in this section. */
  groups: RhymeGroup[];
  /** Per-line overlay data (parallel array to section.lines). */
  overlays: (RhymeOverlaySegment | null)[];
  /** Detected rhyme scheme string (e.g. "ABAB"), null when undetermined. */
  scheme: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build rhyme groups for a flat list of line texts.
 *
 * Strategy: for each unassigned line, find all later lines that rhyme with it
 * (via doLinesRhymeGraphemic, which now applies Step-0 segmentation). Lines
 * that share a rhyme are placed in the same group.
 *
 * @param lines    Raw line texts
 * @param langCode ISO 639 code — propagated to all graphemic comparisons
 */
export const buildRhymeGroups = (lines: string[], langCode?: string): RhymeGroup[] => {
  const n = lines.length;
  const groupIndex = new Array<number | null>(n).fill(null);
  const groups: RhymeGroup[] = [];

  for (let i = 0; i < n; i++) {
    if (groupIndex[i] !== null) continue;
    if (!lines[i]?.trim()) continue;

    const members: number[] = [i];
    for (let j = i + 1; j < n; j++) {
      if (!lines[j]?.trim()) continue;
      if (doLinesRhymeGraphemic(lines[i]!, lines[j]!, langCode)) {
        members.push(j);
      }
    }

    if (members.length < 2) continue; // singleton — not a rhyme group

    const gIdx = groups.length;
    for (const idx of members) groupIndex[idx] = gIdx;

    // Derive a representative suffix for the group: use the split from the
    // first line against the second rhyming peer.
    const split = splitRhymingSuffix(lines[i]!, [lines[members[1]]!], langCode);
    groups.push({
      suffix: split?.rhyme ?? '',
      lineIndices: members,
    });
  }

  return groups;
};

/**
 * Compute overlay segments for every line in a section.
 *
 * Each line receives a split point derived from its rhyme peers inside the
 * same section. Lines with no rhyme peer receive null.
 *
 * @param lines    Raw line texts
 * @param groups   Pre-computed RhymeGroup[] for this section
 * @param langCode ISO 639 code — propagated to splitRhymingSuffix
 */
export const buildRhymeOverlays = (
  lines: string[],
  groups: RhymeGroup[],
  langCode?: string,
): (RhymeOverlaySegment | null)[] => {
  // Build a reverse map: lineIndex → group
  const lineToGroup = new Map<number, RhymeGroup>();
  for (const group of groups) {
    for (const idx of group.lineIndices) lineToGroup.set(idx, group);
  }

  return lines.map((line, i) => {
    const group = lineToGroup.get(i);
    if (!group) return null;

    // Peer lines = all other members of the same group
    const peerLines = group.lineIndices
      .filter(idx => idx !== i)
      .map(idx => lines[idx]!)
      .filter(Boolean);

    const split = splitRhymingSuffix(line, peerLines, langCode);
    if (!split) return null;

    // Resolve position from segmentation metadata
    // (doLinesRhymeGraphemic already ran segmentation; we derive position
    // from the split result — if rhyme === whole line it's likely enjambed)
    const position: RhymeOverlaySegment['position'] =
      split.before.trim() === '' ? 'enjambed' : 'end';

    return { before: split.before, rhyme: split.rhyme, position };
  });
};

/**
 * Derive a letter-based rhyme scheme string from groups and line count.
 * Returns null when fewer than 2 rhyming groups are present.
 *
 * @param lineCount Total lines in the section
 * @param groups    RhymeGroup[] for the section
 */
export const buildRhymeScheme = (lineCount: number, groups: RhymeGroup[]): string | null => {
  if (groups.length < 1) return null;

  const letters = new Array<string>(lineCount).fill('');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let nextLetter = 0;

  for (const group of groups) {
    const letter = alphabet[nextLetter % alphabet.length] ?? String.fromCharCode(65 + nextLetter);
    nextLetter++;
    for (const idx of group.lineIndices) {
      if (idx < lineCount) letters[idx] = letter;
    }
  }

  const scheme = letters.join('');
  // A scheme with fewer than 2 distinct non-empty letters is not meaningful
  const distinctLetters = new Set(letters.filter(Boolean));
  return distinctLetters.size >= 2 ? scheme : null;
};

/**
 * Full analysis for a single section.
 *
 * @param section  Section object from the song data model
 * @param langCode ISO 639 code for the song's primary language
 */
export const analyseSection = (
  section: Section,
  langCode?: string,
): SectionRhymeAnalysis => {
  const lines = (section.lines ?? []).map(l => l.text ?? '');
  const groups = buildRhymeGroups(lines, langCode);
  const overlays = buildRhymeOverlays(lines, groups, langCode);
  const scheme = buildRhymeScheme(lines.length, groups);
  return { groups, overlays, scheme };
};

/**
 * Full analysis for an entire song (all sections).
 *
 * @param sections Song sections
 * @param langCode ISO 639 code for the song's primary language
 */
export const analyseSong = (
  sections: Section[],
  langCode?: string,
): SectionRhymeAnalysis[] => sections.map(section => analyseSection(section, langCode));
