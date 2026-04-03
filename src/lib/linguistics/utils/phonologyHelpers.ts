/**
 * Shared phonology helpers used by multiple family strategies.
 * Pure functions — no side-effects, no network calls.
 */

// ─── Nominal prefix stripping (Bantu class prefixes) ─────────────────────────

/**
 * Strip common Bantu nominal class prefixes from a word.
 * Returns the stem without the prefix.
 */
export function stripNominalPrefix(word: string): string {
  // Ordered from longest to shortest to avoid partial matches
  const prefixes = [
    'aba', 'ama', 'imi', 'izi', 'ulu',
    'ba', 'wa', 'ki', 'vi', 'mi', 'ma', 'zi', 'ny',
    'mu', 'ka', 'tu', 'ku', 'pa', 'li',
    'u', 'a', 'i',
  ];
  const lower = word.toLowerCase();
  for (const p of prefixes) {
    // Require the remaining stem to be at least 3 characters long
    // to avoid over-stripping common words (e.g. "mama" → "ma").
    if (lower.startsWith(p) && lower.length >= p.length + 3) {
      return word.slice(p.length);
    }
  }
  return word;
}

// ─── Coda classification ─────────────────────────────────────────────────────

/** Classify a coda string into nasal, liquid, or obstruent. */
export function classifyCoda(coda: string): 'nasal' | 'liquid' | 'obstruent' | null {
  if (!coda) return null;
  if (/[mnŋɲ]/.test(coda)) return 'nasal';
  if (/[lrɾɹ]/.test(coda)) return 'liquid';
  return 'obstruent';
}

// ─── Slavic palatalisation normalisation ─────────────────────────────────────

/** Strip Slavic final palatalisation markers (ь, й) for rhyme normalisation. */
export function stripPalatalization(text: string): string {
  return text.replace(/[ьй]$/g, '');
}

// ─── Arabic hamza normalisation ──────────────────────────────────────────────

/** Normalise hamza variants to plain alif (ا). */
export function normalizeHamza(text: string): string {
  return text.replace(/[أإآ]/g, 'ا');
}

/** Strip Arabic tashkeel (short vowel diacritics). */
export function stripTashkeel(text: string): string {
  // Fathah, Dammah, Kasrah, Sukun, Shadda, Tanwin variants
  return text.replace(/[\u064B-\u0652]/g, '');
}

/** Check whether Arabic text has tashkeel diacritics. */
export function hasTashkeel(text: string): boolean {
  return /[\u064B-\u0652]/.test(text);
}

// ─── Hebrew matres lectionis ─────────────────────────────────────────────────

/** Hebrew matres lectionis characters (vav, yod) that act as long vowels. */
export const HEBREW_MATRES = new Set(['ו', 'י']);
