/**
 * Converts a Unicode emoji string into its Twemoji SVG URL.
 *
 * Uses locally-bundled SVGs in `/twemoji/` so flag rendering is reliable even
 * when external CDNs are blocked by ad-blockers or corporate firewalls.
 *
 * Only variation selector U+FE0F is stripped — it never appears in Twemoji
 * filenames. U+200D (ZWJ) is intentionally preserved because it is part of
 * subdivision flag sequences (e.g. 🏴󠁧󠁢󠁥󠁮󠁧󠁿) and composite emoji filenames.
 *
 * Results are cached in a module-level Map so the codepoint computation
 * runs at most once per unique emoji across the entire session.
 */

const _twemojiCache = new Map<string, string>();

export function emojiToTwemojiUrl(emoji: string): string {
  const cached = _twemojiCache.get(emoji);
  if (cached !== undefined) return cached;

  const codepoints = [...emoji]
    .map(char => char.codePointAt(0)!)
    .filter(cp => cp !== 0xfe0f) // strip variation selector only
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
