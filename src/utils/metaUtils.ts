/**
 * Known section-header keywords that must NOT be treated as meta-instructions.
 * Extend this list as new section types are added.
 */
const SECTION_HEADER_PATTERNS = [
  /^intro/i,
  /^verse/i,
  /^pre[- ]?chorus/i,
  /^chorus/i,
  /^final chorus/i,
  /^bridge/i,
  /^breakdown/i,
  /^outro/i,
  /^couplet/i,
  /^refrain/i,
  /^refrain final/i,
  /^pont/i,
  /^hook/i,
  /^tag/i,
  /^solo/i,           // [Solo] alone acts as section, [Guitar solo] is meta
  /^interlude/i,
  /^spoken/i,
];

/**
 * Returns true if the bracketed content looks like a structural section header
 * (Verse, Chorus, Bridge…) as opposed to a performance meta-instruction.
 * @param inner  Content INSIDE the brackets, e.g. "Verse 1" or "Guitar solo"
 */
export const isSectionHeader = (inner: string): boolean =>
  SECTION_HEADER_PATTERNS.some(re => re.test(inner.trim()));

/**
 * Returns true if a raw text line is a pure bracketed meta-instruction
 * (the entire line is `[something]`) AND that something is NOT a known section header.
 */
export const isPureMetaLine = (line: string): boolean => {
  const m = line.trim().match(/^\[(.+)\]$/);
  if (!m || !m[1]) return false;
  return !isSectionHeader(m[1]);
};

/**
 * Renders meta-instruction tokens in a plain text string as highlighted HTML spans.
 * Tokens: `[anything]` that is NOT a section header get cyan styling.
 * Returns an array of React-compatible parts: { text, isMeta }[]
 */
export const tokenizeMetaInline = (
  text: string
): Array<{ text: string; isMeta: boolean }> => {
  const parts: Array<{ text: string; isMeta: boolean }> = [];
  const regex = /\[([^\]]+)\]/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const inner = match[1] ?? '';
    if (match.index > last) {
      parts.push({ text: text.slice(last, match.index), isMeta: false });
    }
    parts.push({ text: match[0], isMeta: !isSectionHeader(inner) });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ text: text.slice(last), isMeta: false });
  }
  return parts;
};
