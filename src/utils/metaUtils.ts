/**
 * Known section-header keywords that must NOT be treated as meta-instructions.
 */
export const BRACKET_TOKEN_REGEX = /[\[［【「『〔〈《]([^\]］】」』〕〉》]+)[\]］】」』〕〉》]/g;
export const BRACKETED_LINE_REGEX = /^(?:\*\*)?[\[［【「『〔〈《](.+?)[\]］】」』〕〉》](?:\*\*)?$/;
const EMPTY_BRACKET_LINE_REGEX = /^[\[［【「『〔〈《]\s*[\]］】」』〕〉》]$/;

const SECTION_HEADER_PATTERNS = [
  /^intro/i,
  /^verse/i,
  /^pre[- ]?chorus/i,
  /^post[- ]?chorus/i,
  /^chorus/i,
  /^final[- ]chorus/i,
  /^bridge/i,
  /^breakdown/i,
  /^outro/i,
  /^couplet/i,
  /^refrain/i,
  /^refrain[- ]final/i,
  /^pont/i,
  /^hook/i,
  /^tag/i,
  /^solo/i,
  /^interlude/i,
  /^spoken/i,
  /^drop/i,
  /^vamp/i,
  // French variants
  /^pr[eé][- ]?refrain/i,
  /^pr[eé][- ]?chorus/i,
  /^post[- ]?refrain/i,
  /^double[- ]chorus/i,
  /^final[- ]refrain/i,
];

export const isSectionHeader = (inner: string): boolean =>
  SECTION_HEADER_PATTERNS.some(re => re.test(inner.trim()));

export const unwrapBracketToken = (value: string): string | null => {
  const match = value.trim().match(BRACKETED_LINE_REGEX);
  return match?.[1]?.trim() || null;
};

/**
 * Returns true if a raw text line is a pure bracketed meta-instruction line.
 *
 * Handles both single-bracket lines and multi-bracket lines:
 *   [Rhythmic Upbeat | Alto harmonica riff]     → true  (single, non-header)
 *   [Intro][Deep dry kicks]                     → true  (prefix header skipped, real meta found)
 *   [Pre-Chorus][Soft Women choir answers]      → true
 *   [Chorus][Alto harmonica answers]            → true
 *   Si ton amour est comme une transaction.     → false (plain lyric)
 *   [Verse 1]                                   → false (pure section header)
 *
 * Algorithm:
 *   1. The trimmed line must consist ONLY of bracket tokens (no text outside brackets).
 *   2. At least one bracket token must be a non-section-header.
 *   Section-header tokens ([Intro], [Chorus]…) are silently skipped — they do
 *   not invalidate the line; they are just not rendered as meta badges.
 */
export const isPureMetaLine = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Must contain at least one opening bracket
  if (!BRACKET_TOKEN_REGEX.test(trimmed)) return false;
  BRACKET_TOKEN_REGEX.lastIndex = 0;

  // Collect all bracket tokens and verify nothing exists outside them
  const tokens: string[] = [];
  const regex = BRACKET_TOKEN_REGEX;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(trimmed)) !== null) {
    // Any text between brackets means this is not a pure meta line
    if (match.index > last) {
      const between = trimmed.slice(last, match.index);
      if (between.trim()) return false;
    }
    tokens.push(match[1]!.trim());
    last = match.index + match[0].length;
  }
  // Any trailing text after the last bracket
  if (last < trimmed.length && trimmed.slice(last).trim()) return false;

  // Need at least one non-empty token
  if (tokens.length === 0) return false;

  // At least one token must be a non-section-header
  return tokens.some(t => t.length > 0 && !isSectionHeader(t));
};

/**
 * Returns true if the line is a bare empty-bracket artifact: [] or [  ]
 */
export const isEmptyBracketLine = (line: string): boolean => {
  const trimmedLine = line.trim();
  if (trimmedLine === '[]') return true;
  const m = trimmedLine.match(EMPTY_BRACKET_LINE_REGEX);
  return m !== null;
};

/**
 * Tokenizes a meta line into display parts.
 * For meta tokens, returns `inner` (WITHOUT surrounding brackets) so MetaLine
 * can render them without duplication with its own bracket badge.
 *
 * Section-header tokens ([Intro], [Chorus]…) embedded in meta lines are
 * skipped — not rendered as badges, not rendered as plain text.
 *
 * Fallback: if the text contains NO brackets at all (AI omitted them),
 * the entire text is treated as a single isMeta token so MetaLine always
 * renders the [ ] visual wrapper and cyan styling.
 */
export const tokenizeMetaInline = (
  text: string
): Array<{ text: string; isMeta: boolean }> => {
  const trimmed = text.trim();

  // Fast path: no brackets at all — treat entire text as meta token
  if (!BRACKET_TOKEN_REGEX.test(trimmed)) {
    BRACKET_TOKEN_REGEX.lastIndex = 0;
    const content = trimmed;
    if (content) return [{ text: content, isMeta: true }];
    return [];
  }
  BRACKET_TOKEN_REGEX.lastIndex = 0;

  const parts: Array<{ text: string; isMeta: boolean }> = [];
  const regex = BRACKET_TOKEN_REGEX;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const inner = match[1] ?? '';
    if (match.index > last) {
      const between = text.slice(last, match.index);
      if (between.trim()) parts.push({ text: between, isMeta: false });
    }
    const innerTrimmed = inner.trim();
    if (innerTrimmed && !isSectionHeader(innerTrimmed)) {
      // Section-header tokens are silently skipped (not rendered)
      parts.push({ text: innerTrimmed, isMeta: true });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    const tail = text.slice(last);
    if (tail.trim()) parts.push({ text: tail, isMeta: false });
  }
  return parts;
};
