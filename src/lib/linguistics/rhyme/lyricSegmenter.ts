/**
 * lyricSegmenter.ts  v2
 * Splits raw lyric text into structured LyricLine objects.
 * Supersedes the flat string[] approach — now preserves stanza boundaries,
 * annotation markers, and RTL metadata for downstream consumers.
 *
 * docs_fusion_optimal.md §3 (segmentation) + §4 (RN extraction).
 */

/** Structural section marker: [Verse 1], [Chorus], (hook), etc. */
const SECTION_MARKER_RE = /^\s*[\[\(].+[\]\)]\s*$/;

/** RTL language codes — no impact on split logic, used for metadata only. */
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur', 'yi', 'ps', 'ug']);

// ─── Public types ────────────────────────────────────────────────────────────

export interface LyricLine {
  /** 0-based global position in the full text. */
  index: number;
  /** Raw trimmed text of the line. */
  text: string;
  /** True for empty lines — stanza separators, not passed to the rhyme engine. */
  isBlank: boolean;
  /** True for section markers like [Verse 1] or (hook). */
  isAnnotation: boolean;
  /** Stanza index — increments on each blank-line boundary. */
  stanzaIndex: number;
  /** 0-based position within its stanza (blank/annotation lines excluded). */
  lineInStanza: number;
  /** True for RTL language codes. */
  isRTL: boolean;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Split a raw lyric block into structured LyricLine objects.
 *
 * Rules:
 * 1. Split on \n.
 * 2. Trim each line.
 * 3. Consecutive blank lines collapse to a single stanza boundary.
 * 4. Section markers are preserved as isAnnotation lines.
 * 5. stanzaIndex increments on each blank-line group.
 * 6. lineInStanza counts only non-blank, non-annotation lines within the stanza.
 *
 * @param text      Raw lyric text.
 * @param langCode  ISO 639-1/3 language code (used for isRTL metadata).
 */
export function splitLyricIntoLines(text: string, langCode: string): LyricLine[] {
  if (!text || !text.trim()) return [];

  const isRTL = RTL_LANGS.has(langCode);
  const rawLines = text.split('\n');
  const result: LyricLine[] = [];

  let globalIndex = 0;
  let stanzaIndex = 0;
  let lineInStanza = 0;
  let lastWasBlank = false;

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    const isBlank = trimmed.length === 0;
    const isAnnotation = !isBlank && SECTION_MARKER_RE.test(trimmed);

    if (isBlank) {
      if (!lastWasBlank) {
        // Emit one blank line per stanza boundary group
        result.push({
          index: globalIndex++,
          text: '',
          isBlank: true,
          isAnnotation: false,
          stanzaIndex,
          lineInStanza: 0,
          isRTL,
        });
        stanzaIndex++;
        lineInStanza = 0;
      }
      lastWasBlank = true;
      continue;
    }

    lastWasBlank = false;

    result.push({
      index: globalIndex++,
      text: trimmed,
      isBlank: false,
      isAnnotation,
      stanzaIndex,
      lineInStanza: isAnnotation ? 0 : lineInStanza,
      isRTL,
    });

    if (!isAnnotation) lineInStanza++;
  }

  return result;
}

// ─── Legacy compat ───────────────────────────────────────────────────────────

/**
 * Legacy flat-array export — kept for backward compatibility with
 * rhymeSchemeDetector.ts and existing call sites.
 * New code should use splitLyricIntoLines() instead.
 */
export function splitIntoRhymingLines(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !SECTION_MARKER_RE.test(l));
}

/**
 * Extract the rhyme-bearing tail of a line.
 * Returns the last word, lowercased, with trailing punctuation stripped.
 *
 * Extended charset:
 *   - Typographic quotes \u201C \u201D added (copy-pasted lyrics)
 *   - Closing ) ] added (annotation remnants)
 */
export function extractLineTail(line: string): string {
  const words = line.trim().split(/\s+/);
  const last = words[words.length - 1] ?? '';
  return last
    .toLowerCase()
    .replace(/[.,!?;:"'\u201C\u201D«»…\-–—\)\]]+$/, '');
}
