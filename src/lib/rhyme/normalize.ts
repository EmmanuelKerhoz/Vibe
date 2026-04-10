/**
 * Rhyme Engine v2 — Normalization & Line Ending Extraction
 * Replaces the legacy extractLineTail(line: string): string
 */

import type { LineEndingUnit, ScriptClass, SegmentationMode } from './types';

// ─── Languages that require tone-mark segmentation despite latin script ──────
// Vietnamese and KWA languages: tone diacritics are phonemic, not decorative.
// yo (Yoruba) added — tonal KWA language; was missing from original set.
const TONE_MARK_LANGS = new Set(['vi', 'ba', 'ew', 'mi', 'di', 'yo']);

// ─── Script detection ────────────────────────────────────────────────────────

const SCRIPT_RANGES: Array<[RegExp, ScriptClass]> = [
  [/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u, 'arabic'],
  [/[\u0590-\u05FF\uFB1D-\uFB4F]/u,              'hebrew'],
  [/[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u30FF]/u, 'cjk'],
  [/[\u0E00-\u0E7F]/u,                            'thai'],
  [/[\u1780-\u17FF]/u,                            'khmer'],
  [/[\u0400-\u04FF]/u,                            'cyrillic'],
  [/[\u0900-\u097F]/u,                            'devanagari'],
  [/[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/u,        'latin'],
];

function detectScript(text: string): ScriptClass {
  for (const [re, cls] of SCRIPT_RANGES) {
    if (re.test(text)) return cls;
  }
  return 'other';
}

// ─── Segmentation mode resolution ────────────────────────────────────────────
// langHint overrides script-derived mode for tonal latin languages.

function segmentationModeForScript(script: ScriptClass): SegmentationMode {
  switch (script) {
    case 'cjk':       return 'character';
    case 'arabic':
    case 'hebrew':    return 'rtl';
    case 'thai':
    case 'khmer':     return 'tonal-syllable';
    default:          return 'whitespace';
  }
}

function resolveSegmentationMode(
  script: ScriptClass,
  langHint?: string
): SegmentationMode {
  // Override: tonal latin languages need tone-aware token extraction.
  // Without this, KWA/VI tone diacritics are treated as mere decoration
  // and the surface token passes to G2P without tonal context flag.
  if (langHint && TONE_MARK_LANGS.has(langHint) && script === 'latin') {
    return 'tone-mark';
  }
  return segmentationModeForScript(script);
}

// ─── Unicode normalization safe for tonal diacritics ─────────────────────────

/**
 * NFC normalization — preserves all combining diacritics (tones, accents).
 * Does NOT strip diacritics. Stripping is left to language-specific G2P.
 */
export function normalizeInput(raw: string): string {
  return raw.normalize('NFC').trim();
}

// ─── Punctuation stripping (script-aware) ────────────────────────────────────

const LATIN_PUNCT    = /[.,;:!?¡¿"'«»()\[\]{}…–—]+$/u;
const ARABIC_PUNCT   = /[،؛؟\u06D4\.!"'()\[\]{}…]+$/u;
const CJK_PUNCT      = /[。、！？「」『』【】〔〕…・]+$/u;
const GENERIC_PUNCT  = /[\p{P}\p{S}]+$/u;

function stripTrailingPunctuation(token: string, script: ScriptClass): string {
  switch (script) {
    case 'arabic':
    case 'hebrew':  return token.replace(ARABIC_PUNCT, '');
    case 'cjk':     return token.replace(CJK_PUNCT, '');
    case 'latin':   return token.replace(LATIN_PUNCT, '');
    default:        return token.replace(GENERIC_PUNCT, '');
  }
}

// ─── Token extraction per segmentation mode ──────────────────────────────────

function extractFinalToken(
  normalized: string,
  mode: SegmentationMode,
  script: ScriptClass
): string {
  switch (mode) {
    case 'character': {
      // CJK: last non-punctuation character
      const chars = [...normalized].filter(c => !/[\p{P}\p{S}]/u.test(c));
      return chars.at(-1) ?? normalized.at(-1) ?? '';
    }
    case 'rtl': {
      // Arabic/Hebrew: stored LTR in JS strings despite RTL display
      const tokens = normalized.split(/\s+/).filter(Boolean);
      const raw = tokens.at(-1) ?? '';
      return stripTrailingPunctuation(raw, script);
    }
    case 'tonal-syllable': {
      // Thai/Khmer: last ZW-or-space-delimited unit
      const tokens = normalized.split(/[\s\u200B]+/).filter(Boolean);
      const raw = tokens.at(-1) ?? '';
      return stripTrailingPunctuation(raw, script);
    }
    case 'tone-mark': {
      // KWA/VI: standard whitespace split but preserve ALL combining diacritics.
      // normalizeInput already ran NFC so diacritics are composed.
      const tokens = normalized.split(/\s+/).filter(Boolean);
      const raw = tokens.at(-1) ?? '';
      // Only strip non-tonal punctuation (latin set); never strip U+0300-U+036F
      return raw.replace(LATIN_PUNCT, '');
    }
    case 'whitespace':
    default: {
      const tokens = normalized.split(/\s+/).filter(Boolean);
      const raw = tokens.at(-1) ?? '';
      return stripTrailingPunctuation(raw, script);
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Replaces the legacy extractLineTail().
 * Returns a structured LineEndingUnit suitable for G2P → RhymeNucleus pipeline.
 *
 * @param line     Raw input line
 * @param langHint BCP-47 language code (e.g. 'vi', 'ba', 'fr', 'yo')
 */
export function extractLineEndingUnit(line: string, langHint?: string): LineEndingUnit {
  const warnings: string[] = [];
  const normalized = normalizeInput(line);

  if (!normalized) {
    warnings.push('empty-line');
    return {
      surface: '',
      normalized: '',
      script: 'other',
      segmentationMode: 'unknown',
      warnings,
    };
  }

  const script = detectScript(normalized);
  const segmentationMode = resolveSegmentationMode(script, langHint);
  const surface = extractFinalToken(normalized, segmentationMode, script);

  if (!surface) {
    warnings.push('no-token-extracted');
  }

  return { surface, normalized, script, segmentationMode, warnings };
}
