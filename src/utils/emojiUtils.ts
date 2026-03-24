/**
 * Converts a Unicode emoji string into its Twemoji SVG URL.
 *
 * Uses locally-bundled SVGs in `/twemoji/` so flag rendering is reliable even
 * when external CDNs are blocked by ad-blockers or corporate firewalls.
 */
export function emojiToTwemojiUrl(emoji: string): string {
  const codepoints = [...emoji]
    .map(char => char.codePointAt(0)!.toString(16))
    .join('-');
  return `/twemoji/${codepoints}.svg`;
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
