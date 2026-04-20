/**
 * Converts a Unicode emoji string into its Twemoji SVG URL.
 *
 * Uses locally-bundled SVGs in `/twemoji/` so flag rendering is reliable even
 * when external CDNs are blocked by ad-blockers or corporate firewalls.
 *
 * Twemoji filenames never include variation selectors (U+FE0F) or ZWJ
 * (U+200D) as isolated codepoint segments — they are stripped before
 * building the URL so that composite emojis like 🛡️ resolve correctly
 * (e.g. `1f6e1.svg` instead of `1f6e1-fe0f.svg`).
 *
 * Results are cached in a module-level Map so the codepoint computation
 * runs at most once per unique emoji across the entire session.
 */

const STRIPPED = new Set([0xfe0f, 0x200d]);
const _twemojiCache = new Map<string, string>();

export function emojiToTwemojiUrl(emoji: string): string {
  const cached = _twemojiCache.get(emoji);
  if (cached !== undefined) return cached;

  const codepoints = [...emoji]
    .map(char => char.codePointAt(0)!)
    .filter(cp => !STRIPPED.has(cp))
    .map(cp => cp.toString(16))
    .join('-');

  const url = `/twemoji/${codepoints}.svg`;
  _twemojiCache.set(emoji, url);
  return url;
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
