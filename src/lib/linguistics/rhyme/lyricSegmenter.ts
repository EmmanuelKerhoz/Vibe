/**
 * lyricSegmenter.ts  v3
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

/**
 * Scripts that have no inter-word spaces — extraction falls back to
 * last N Unicode grapheme clusters rather than last whitespace token.
 */
const SCRIPTLESS_SPACE_LANGS = new Set([
  'zh', 'zh-cn', 'zh-tw', 'yue',   // Sinitic
  'ja',                              // Japanese
  'th', 'lo',                        // Tai-Kadai
  'km',                              // Khmer
  'my',                              // Burmese
]);

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

/**
 * Structured result of extractLineEndingUnit.
 *
 * - surface        : raw extracted token (before normalization)
 * - normalized     : token ready for G2P / RN comparison
 * - segmentationMode : how the token was isolated
 * - script         : detected Unicode script block
 * - warnings       : non-empty when fallback heuristics were applied
 */
export interface LineEndingUnit {
  surface: string;
  normalized: string;
  segmentationMode: 'space' | 'grapheme-cluster' | 'rtl-space';
  script: 'latin' | 'cjk' | 'arabic' | 'hebrew' | 'devanagari' | 'hangul' | 'thai' | 'other';
  warnings: string[];
}

// ─── Script detection ────────────────────────────────────────────────────────

function detectScript(token: string): LineEndingUnit['script'] {
  if (!token) return 'other';
  const cp = token.codePointAt(0) ?? 0;
  // CJK Unified Ideographs + CJK Ext + Hiragana + Katakana
  if ((cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3040 && cp <= 0x30FF)) return 'cjk';
  // Arabic
  if (cp >= 0x0600 && cp <= 0x06FF) return 'arabic';
  // Hebrew
  if (cp >= 0x05D0 && cp <= 0x05EA) return 'hebrew';
  // Devanagari
  if (cp >= 0x0900 && cp <= 0x097F) return 'devanagari';
  // Hangul
  if (cp >= 0xAC00 && cp <= 0xD7A3) return 'hangul';
  // Thai
  if (cp >= 0x0E00 && cp <= 0x0E7F) return 'thai';
  // Latin (including diacritics up to 0x024F)
  if ((cp >= 0x0041 && cp <= 0x007A) || (cp >= 0x00C0 && cp <= 0x024F)) return 'latin';
  return 'other';
}

// ─── Punctuation stripping — script-aware ────────────────────────────────────

/**
 * Latin/Cyrillic/Greek trailing punctuation.
 * Does NOT strip diacritical marks or tonal modifiers.
 */
const LATIN_TRAIL_RE = /[.,!?;:"'«»\u201C\u201D\u2018\u2019\u2026\-–—\)\]]+$/u;

/**
 * Arabic / Hebrew trailing punctuation (right-side strip after logical reversal).
 * Preserves shadda, hamza, and all vocalic diacritics.
 */
const ARABIC_TRAIL_RE = /[\u060C\u061B\u061F\u06D4.,!?]+$/u;
const HEBREW_TRAIL_RE = /[\u05F3\u05F4.,!?:"']+$/u;

/**
 * Tonal-safe strip: only ASCII punctuation, no diacritic removal.
 * Used for VI, TH, YO, EWE, and other tone-marked scripts in Latin rendering.
 */
const TONAL_LATIN_TRAIL_RE = /[.,!?;:"'\u2026\-–—\)\]]+$/u;

function stripTrailing(token: string, script: LineEndingUnit['script'], tonal: boolean): string {
  if (!token) return token;
  switch (script) {
    case 'arabic': return token.replace(ARABIC_TRAIL_RE, '');
    case 'hebrew': return token.replace(HEBREW_TRAIL_RE, '');
    case 'cjk':
    case 'thai':
    case 'hangul':
    case 'devanagari':
      // No lowercase, no Latin stripping — these scripts carry their own punctuation
      return token.replace(/[\uff01\uff0c\uff0e\uff1f\u3002\u3001\uff1b\uff1a]+$/u, '');
    case 'latin':
      return tonal
        ? token.replace(TONAL_LATIN_TRAIL_RE, '')
        : token.replace(LATIN_TRAIL_RE, '');
    default:
      return token.replace(LATIN_TRAIL_RE, '');
  }
}

// ─── Tonal language detection ────────────────────────────────────────────────

/**
 * Language codes where tonal diacritics must NOT be stripped or lowercased
 * in ways that would destroy phonemic information.
 * VI uses combining diacritics; ZH/JA are handled separately via grapheme path.
 */
const TONAL_LANGS = new Set([
  'vi',                    // Vietnamese — 6 tones as diacritics
  'th', 'lo',              // Thai/Lao
  'yo', 'ibo', 'ewe', 'tw', 'ba',  // West African tonal (Yoruba, Igbo, Ewe, Twi, Baoulé)
  'ln',                    // Lingala
]);

// ─── Grapheme cluster iterator (best-effort, no Intl.Segmenter polyfill needed) ──

/**
 * Split a string into Unicode extended grapheme clusters.
 * Uses Intl.Segmenter when available (Node 16+, modern browsers),
 * falls back to [...str] (code points) otherwise.
 */
function toGraphemeClusters(str: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
    return [...seg.segment(str)].map((s: any) => s.segment as string);
  }
  return [...str];
}

// ─── Core extraction ─────────────────────────────────────────────────────────

/**
 * Extract the rhyme-bearing ending unit of a lyric line.
 *
 * Strategy routing:
 *  1. Space-less scripts (ZH, JA, TH, KM…): last 3 grapheme clusters of the line.
 *  2. RTL scripts (AR, HE, FA, UR): last space-delimited token, RTL-aware strip.
 *  3. Tonal Latin (VI, YO, EWE…): last token, tonal-safe strip, no blind lowercase.
 *  4. Default Latin/Cyrillic: last token, full strip, lowercased.
 *
 * @param line      Trimmed lyric line text.
 * @param langCode  ISO 639-1/3 language code. Defaults to 'fr'.
 */
export function extractLineEndingUnit(
  line: string,
  langCode: string = 'fr',
): LineEndingUnit {
  const warnings: string[] = [];
  const lang = langCode.toLowerCase().split('-')[0] ?? 'fr';

  if (!line || !line.trim()) {
    return { surface: '', normalized: '', segmentationMode: 'space', script: 'other', warnings: ['empty line'] };
  }

  const trimmed = line.trim();

  // ── Path 1: scripts without word spaces ───────────────────────────────
  if (SCRIPTLESS_SPACE_LANGS.has(lang) || SCRIPTLESS_SPACE_LANGS.has(langCode.toLowerCase())) {
    const clusters = toGraphemeClusters(trimmed);
    // Take last 3 grapheme clusters as the rhyme-bearing unit
    // (covers CJK monosyllabic + Japanese kana suffix + Thai syllable)
    const endClusters = clusters.slice(-3).join('');
    const script = detectScript(endClusters);
    const stripped = stripTrailing(endClusters, script, false);
    return {
      surface: endClusters,
      normalized: stripped,
      segmentationMode: 'grapheme-cluster',
      script,
      warnings,
    };
  }

  // ── Path 2: RTL scripts ────────────────────────────────────────────────
  if (RTL_LANGS.has(lang)) {
    // Logical split: last space-delimited token in logical order
    const tokens = trimmed.split(/\s+/);
    const last = tokens[tokens.length - 1] ?? '';
    const script = detectScript(last);
    const stripped = stripTrailing(last, script, false);
    return {
      surface: last,
      normalized: stripped,
      segmentationMode: 'rtl-space',
      script,
      warnings,
    };
  }

  // ── Path 3 & 4: space-delimited (Latin, Cyrillic, Devanagari, Hangul, etc.) ──
  const tokens = trimmed.split(/\s+/);
  const last = tokens[tokens.length - 1] ?? '';

  if (!last) {
    warnings.push('no token found — falling back to full line');
    return { surface: trimmed, normalized: trimmed.toLowerCase(), segmentationMode: 'space', script: 'other', warnings };
  }

  const script = detectScript(last);
  const isTonal = TONAL_LANGS.has(lang);

  const stripped = stripTrailing(last, script, isTonal);

  // Tonal languages: preserve case (diacritics carry tone information in VI)
  // Non-tonal: lowercase for normalized comparison
  const normalized = isTonal ? stripped : stripped.toLowerCase();

  return {
    surface: last,
    normalized,
    segmentationMode: 'space',
    script,
    warnings,
  };
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

  const isRTL = RTL_LANGS.has(langCode.toLowerCase().split('-')[0] ?? '');
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
 * Legacy extractLineTail — kept for backward compatibility.
 * Delegates to extractLineEndingUnit and returns only the normalized string.
 * New code should use extractLineEndingUnit() to access the full structured result.
 *
 * @deprecated Use extractLineEndingUnit() instead.
 */
export function extractLineTail(line: string, langCode: string = 'fr'): string {
  return extractLineEndingUnit(line, langCode).normalized;
}
