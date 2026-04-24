/**
 * Rhyme Engine v3 — Verse Segmenter
 *
 * Splits a raw text block into verse lines (LineSegment[]).
 * Handles: newlines, hemistich (/), RTL scripts (AR/HE), CJK/JA.
 */

import type { LangCode } from './types';

export interface LineSegment {
  text: string;
  index: number;
  rtl: boolean;
}

const RTL_LANGS: Set<LangCode> = new Set(['ar', 'he', 'fa', 'ur']);
const CJK_LANGS: Set<LangCode> = new Set(['zh', 'ja', 'ko']);

// Matches CJK sentence boundaries: full-width punctuation or 5+ char run
const CJK_BOUNDARY_RE = /(?<=[。！？…\u3002\uff01\uff1f])|(?=[。！？…\u3002\uff01\uff1f])/gu;

// RTL bidi override / mark characters to strip
const BIDI_RE = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/gu;

/**
 * Strips bidi control characters from a string.
 */
function stripBidi(s: string): string {
  return s.replace(BIDI_RE, '');
}

/**
 * Splits a raw block into LineSegment[].
 *
 * @param block   Raw multiline text (may contain \n, /, CJK boundaries)
 * @param lang    Primary language code — drives segmentation strategy
 * @param splitHemistich  If true, split lines on " / " separator (default: true)
 */
export function segmentVerses(
  block: string,
  lang: LangCode,
  splitHemistich = true
): LineSegment[] {
  const rtl = RTL_LANGS.has(lang);
  const isCJK = CJK_LANGS.has(lang);

  let rawLines: string[];

  if (isCJK) {
    // For CJK without spaces: split on newlines first, then on sentence-ending punctuation
    rawLines = block
      .split('\n')
      .flatMap(line => {
        const parts = line.split(CJK_BOUNDARY_RE).map(s => s.trim()).filter(Boolean);
        return parts.length > 1 ? parts : [line];
      });
  } else {
    rawLines = block.split('\n');
    if (splitHemistich) {
      rawLines = rawLines.flatMap(line =>
        line.includes(' / ') ? line.split(' / ') : [line]
      );
    }
  }

  const segments: LineSegment[] = [];
  for (const raw of rawLines) {
    const text = rtl ? stripBidi(raw.trim()) : raw.trim();
    if (text.length === 0) continue;
    segments.push({ text, index: segments.length, rtl });
  }

  return segments;
}
