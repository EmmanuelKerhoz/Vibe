/**
 * Converts a Unicode emoji string into its Twemoji CDN SVG URL.
 *
 * Twemoji (by jdecked, formerly Twitter) provides consistent, cross-platform
 * emoji images.  This is primarily used to guarantee flag-emoji rendering on
 * Windows, where regional-indicator pairs are displayed as plain two-letter
 * country codes by the OS emoji font.
 */
export function emojiToTwemojiUrl(emoji: string): string {
  const codepoints = [...emoji]
    .map(char => char.codePointAt(0)!.toString(16))
    .join('-');
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${codepoints}.svg`;
}

/**
 * Returns true when every character in the string is a basic ASCII letter or
 * digit — i.e. NOT a Unicode emoji.  Used to guard against passing plain
 * country-code text (e.g. "EN") to emojiToTwemojiUrl, which only works with
 * actual emoji code-points.
 */
export function isPlainAscii(text: string): boolean {
  return /^[\x20-\x7E]*$/.test(text);
}
