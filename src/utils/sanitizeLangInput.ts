/**
 * Sanitizes a user-supplied language name before it is injected into an AI prompt.
 *
 * Allowed characters:
 *   - Unicode letters (\p{L}) and marks (\p{M}) — covers all scripts
 *   - ASCII digits, space, hyphen, apostrophe, parentheses
 *
 * Anything else is stripped. The result is trimmed and capped at 60 characters.
 * An empty result falls back to 'English'.
 */
export function sanitizeLangName(raw: string): string {
  const cleaned = raw
    .replace(/[^\p{L}\p{M}\d\s()\-']/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  return cleaned.length > 0 ? cleaned : 'English';
}
