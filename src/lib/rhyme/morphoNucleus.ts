/**
 * morphoNucleus.ts
 * Step 2 — Morphology-aware Rhyme Nucleus Extraction.
 * Strips inflectional suffixes (TR/FI/HU agglutinative) and nominal class
 * prefixes (BNT Swahili/Lingala) before nucleus extraction.
 * Japanese: mora-based (last 2 moras), not syllable-accent.
 */

export type LangFamily =
  | 'ROM' | 'GER' | 'SLV' | 'SEM' | 'TAI' | 'SIN' | 'JAP' | 'KOR'
  | 'IND' | 'AGG' | 'BNT' | 'KWA' | 'CRV' | 'DEFAULT';

export interface NucleusResult {
  nucleus: string;
  /** Stripped stem (for logging / debug) */
  stem: string;
  syllables: string[];
  moraCount?: number;
}

// ── Agglutinative suffix whitelists (strip right-to-left) ────────────────────

const TR_SUFFIXES = [
  'lerin', 'lara', 'lere', 'ları', 'leri', 'ları', 'lar', 'ler',
  'ında', 'inde', 'nda', 'nde', 'dan', 'den', 'tan', 'ten',
  'nın', 'nin', 'nun', 'nün', 'ın', 'in', 'un', 'ün',
  'yı', 'yi', 'yu', 'yü', 'ı', 'i', 'u', 'ü',
  'dır', 'dir', 'dur', 'dür', 'tır', 'tir', 'tur', 'tür',
  'mış', 'miş', 'muş', 'müş', 'yor', 'ecek', 'acak', 'mak', 'mek',
];

const FI_SUFFIXES = [
  'llaan', 'llään', 'llaan', 'llaan',
  'ssa', 'ssä', 'sta', 'stä', 'lle', 'lta', 'ltä', 'lla', 'llä',
  'ksi', 'tta', 'ttä', 'na', 'nä', 'ni', 'si', 'nsa', 'nsä',
  'kin', 'kaan', 'kään', 'ko', 'kö', 'han', 'hän',
  'jen', 'ien', 'ten', 'den', 'nen',
  'lle', 'lta', 'sta', 'ssa', 'en', 'lle', 'in', 'an', 'ää', 'aa',
];

const HU_SUFFIXES = [
  'okban', 'ekben', 'okból', 'ekből', 'ökből',
  'ban', 'ben', 'ból', 'ből', 'hoz', 'hez', 'höz',
  'nak', 'nek', 'tól', 'től', 'nál', 'nél',
  'ra', 're', 'ról', 'ről', 'ba', 'be', 'ig',
  'val', 'vel', 'ért', 'képpen',
  'ok', 'ek', 'ök', 'ák', 'ék', 'k',
  'om', 'em', 'öm', 'od', 'ed', 'öd', 'ja', 'je',
];

// ── BNT Nominal class prefixes (Swahili / Lingala / Zulu subset) ─────────────

const BNT_PREFIXES = [
  'm', 'wa', 'mi', 'yi', 'ki', 'vi', 'li', 'ma', 'n', 'zi',
  'u', 'i', 'pa', 'ku', 'mu', 'a', 'ba', 'bu', 'bi',
];

// ── Japanese honorific prefixes to ignore ────────────────────────────────────

const JA_HONOR_PREFIXES = ['お', 'ご', '御', '尊'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripSuffixes(word: string, suffixes: string[]): string {
  // Sort longest first to avoid partial matches
  const sorted = [...suffixes].sort((a, b) => b.length - a.length);
  for (const s of sorted) {
    if (word.length > s.length + 2 && word.endsWith(s)) {
      return word.slice(0, word.length - s.length);
    }
  }
  return word;
}

function stripPrefix(word: string, prefixes: string[]): string {
  const sorted = [...prefixes].sort((a, b) => b.length - a.length);
  for (const p of sorted) {
    if (word.length > p.length + 2 && word.startsWith(p)) {
      return word.slice(p.length);
    }
  }
  return word;
}

/** Naïve syllabifier — CV boundary heuristic. Good enough for nucleus extraction. */
function syllabify(word: string): string[] {
  // Split on vowel clusters as nucleus markers
  const syllables: string[] = [];
  const re = /[^aeiouáéíóúàèìòùäëïöüâêîôûãõ]*/gi;
  let match;
  let last = 0;
  const vowelRe = /[aeiouáéíóúàèìòùäëïöüâêîôûãõ]+/gi;
  while ((match = vowelRe.exec(word)) !== null) {
    const start = match.index;
    const end = vowelRe.lastIndex;
    syllables.push(word.slice(last, end));
    last = end;
  }
  if (last < word.length) {
    if (syllables.length > 0) syllables[syllables.length - 1] += word.slice(last);
    else syllables.push(word.slice(last));
  }
  return syllables.length > 0 ? syllables : [word];
}

/** Japanese mora splitter (hiragana/katakana). Each character = 1 mora,
 *  except long vowel marks (ー) and combined kana (きゃ etc.) = 1 mora. */
function splitMoras(word: string): string[] {
  const moras: string[] = [];
  const chars = [...word]; // spread handles surrogate pairs
  let i = 0;
  while (i < chars.length) {
    const c = chars[i]!;
    // Combined kana: small kana follows
    const small = /[ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ]/;
    if (i + 1 < chars.length && small.test(chars[i + 1]!)) {
      moras.push(c + chars[i + 1]!);
      i += 2;
    } else {
      moras.push(c);
      i++;
    }
  }
  return moras;
}

// ── Main export ──────────────────────────────────────────────────────────────

export function extractNucleus(
  word: string,
  family: LangFamily
): NucleusResult {
  let stem = word.toLowerCase();

  // 1. Morphological stripping
  switch (family) {
    case 'AGG': {
      // Detect sub-family by rough heuristic (overridable via langcode router)
      // TR: vowel harmony markers
      const trStripped = stripSuffixes(stem, TR_SUFFIXES);
      const fiStripped = stripSuffixes(stem, FI_SUFFIXES);
      const huStripped = stripSuffixes(stem, HU_SUFFIXES);
      // Pick shortest strip that still leaves ≥3 chars
      const candidates = [trStripped, fiStripped, huStripped, stem]
        .filter(s => s.length >= 3);
      stem = candidates.reduce((a, b) => (a.length < b.length ? a : b));
      break;
    }
    case 'BNT': {
      stem = stripPrefix(stem, BNT_PREFIXES);
      break;
    }
    case 'JAP': {
      // Strip honorific prefix
      for (const p of JA_HONOR_PREFIXES) {
        if (stem.startsWith(p) && stem.length > p.length + 1) {
          stem = stem.slice(p.length);
          break;
        }
      }
      const moras = splitMoras(stem);
      const nucleus = moras.slice(-2).join('');
      return { nucleus, stem, syllables: moras, moraCount: moras.length };
    }
    default:
      break;
  }

  // 2. Syllabify stem
  const syllables = syllabify(stem);

  // 3. Nucleus = last stressed syllable onward
  //    Heuristic: for most families, last syllable.
  //    For French (ROM): last non-silent syllable (drop final 'e' syllable).
  let nucleusStart = syllables.length - 1;
  if (family === 'ROM') {
    // Skip purely mute-e final syllable
    while (
      nucleusStart > 0 &&
      /^[^aeiouáéíóú]*e$/i.test(syllables[nucleusStart]!)
    ) {
      nucleusStart--;
    }
  }

  const nucleus = syllables.slice(nucleusStart).join('');
  return { nucleus, stem, syllables };
}
