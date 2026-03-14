/**
 * Known section-header keywords that must NOT be treated as meta-instructions.
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
  /^solo/i,
  /^interlude/i,
  /^spoken/i,
];

export const isSectionHeader = (inner: string): boolean =>
  SECTION_HEADER_PATTERNS.some(re => re.test(inner.trim()));

/**
 * Returns true if a raw text line is a pure bracketed meta-instruction
 * AND that something is NOT a known section header.
 * Rejects empty brackets [] or whitespace-only brackets [  ].
 */
export const isPureMetaLine = (line: string): boolean => {
  const m = line.trim().match(/^\[(.+)\]$/);
  if (!m || !m[1] || !m[1].trim()) return false;
  return !isSectionHeader(m[1]);
};

/**
 * Returns true if the line is a bare empty-bracket artifact: [] or [  ]
 */
export const isEmptyBracketLine = (line: string): boolean => {
  const t = line.trim();
  if (t === '[]') return true;
  const m = t.match(/^\[\s*\]$/);
  return m !== null;
};

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
    // Skip empty/whitespace-only brackets
    const innerTrimmed = inner.trim();
    if (innerTrimmed) {
      parts.push({ text: match[0], isMeta: !isSectionHeader(inner) });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ text: text.slice(last), isMeta: false });
  }
  return parts;
};
