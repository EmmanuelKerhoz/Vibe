/**
 * Rhyme Engine v4 — Entry Point
 * rhymeScore(lineA, lineB, langA, langB, opts): RhymeResult
 * analyzeBlock(block, lang, opts): BlockAnalysis
 *
 * v4 additions:
 *  - morphoAwareNucleus wired for BNT family (TRK/FIN handle morpho internally)
 *  - lidSpanDetector auto-detects code-switching before routing
 *  - embeddingScorer (level 4) blended for CJK/TAI/VIET/YRB/KWA
 *  - tonalMatrix unified penalty applied to all tonal families
 *  - rhymePosition mode: end | internal | initial | all
 */

import type { LangCode, RhymeNucleus, RhymeResult, SchemeResult } from './types';
import { extractLineEndingUnit, normalizeInput } from './normalize';
import { routeToFamily } from './router';
import { categorize, scoreKWANormalized, scoreCRV, phonemeEditDistance } from './scoring';
import { extractNucleusKWA } from './algo-kwa';
import { extractNucleusCRV } from './algo-crv';
import { extractNucleusROM } from './algo-rom';
import { extractNucleusGER, scoreGER } from './algo-ger';
import { extractNucleusBNT, scoreBNT } from './algo-bnt';
import { extractNucleusYRB, scoreYRB, type YRBNucleus } from './algo-yrb';
import { extractNucleusSLV, scoreSLV } from './algo-slv';
import { extractNucleusSEM, scoreSEM } from './algo-sem';
import { extractNucleusTAI, scoreTAI } from './algo-tai';
import { extractNucleusVIET, scoreVIET } from './algo-viet';
import { extractNucleusCJK, scoreCJK } from './algo-cjk';
import { extractNucleusTRK, scoreTRK, type TRKNucleus } from './algo-trk';
import { extractNucleusFIN, scoreFIN, type FINNucleus } from './algo-fin';
import { extractNucleusIIR, scoreIIR } from './algo-iir';
import { extractNucleusAUS, scoreAUS } from './algo-aus';
import { extractNucleusDRA, scoreDRA } from './algo-dra';
import { extractNucleusCRE, scoreCRE } from './algo-cre';
import { detectRhymeSchemeMultiLang } from './rhymeSchemeDetector';
// v4 imports
import { extractNucleus as morphoExtractNucleus } from './morphoNucleus';
import { detectCodeSwitch } from './lidSpanDetector';
import { embeddingScore, blendScores } from './embeddingScorer';
import { applyTonalPenalty, type TonalLang as TonalFamily } from './tonalDistance';
import {
  extractPositionUnits,
  multiSyllabicTail,
  POSITION_THRESHOLDS,
  type RhymePosition,
  type PositionOptions,
} from './rhymePosition';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface BlockAnalysisOptions {
  langs?: LangCode[];
  splitHemistich?: boolean;
  window?: number;
}

export interface RhymeScoreOptions extends PositionOptions {
  /** Enable level-4 embedding blend (async). Default false for sync compat. */
  useEmbedding?: boolean;
  /** Tonal penalty weight override (default 0.25) */
  tonalWeight?: number;
}

export interface BlockAnalysis {
  scheme: SchemeResult;
  lines: Array<{ text: string; lang: LangCode }>;
}

// ─── Tonal families that receive matrix penalty ───────────────────────────────
const TONAL_FAMILY_MAP: Partial<Record<string, TonalFamily>> = {
  CJK: 'zh',
  TAI: 'th',
  VIET: 'vi',
  CRV: 'ha',
  KWA: 'kwa',
  YRB: 'yo',
};

// ─── Embedding-eligible families ─────────────────────────────────────────────
const EMBEDDING_FAMILIES = new Set(['CJK', 'TAI', 'VIET', 'YRB', 'KWA']);

// ─── analyzeBlock ────────────────────────────────────────────────────────────
// Hemistich separators: " // " (double slash) or " / " (single slash with spaces)
const HEMISTICH_RE = /\s*\/\/\s*|\s+\/\s+/;
const LINE_BREAK_RE = /\n|(?<=[.!?;])\s+/;

export function analyzeBlock(
  block: string,
  lang: LangCode,
  opts: BlockAnalysisOptions = {}
): BlockAnalysis {
  const splitHemistich = opts.splitHemistich ?? true;

  const rawLines = block
    .split(LINE_BREAK_RE)
    .flatMap(l => splitHemistich ? l.split(HEMISTICH_RE) : [l])
    .map(l => l.trim())
    .filter(Boolean);

  const lineItems = rawLines.map((text, i) => ({
    text,
    lang: opts.langs?.[i] ?? lang,
  }));

  const scheme = detectRhymeSchemeMultiLang(lineItems, opts.window ?? 6);
  return { scheme, lines: lineItems };
}

// ─── Core pairwise scorer ─────────────────────────────────────────────────────
export function rhymeScore(
  lineA: string,
  lineB: string,
  langA: LangCode,
  langB: LangCode,
  opts: RhymeScoreOptions = {}
): RhymeResult {
  const warnings: string[] = [];
  const position: RhymePosition = opts.position ?? 'end';
  const multiSyl = opts.multiSyllabic ?? 1;

  // ── Step 0: LID — assistive only ─────────────────────────────────────────
  // The caller-provided lang takes precedence. LID only re-routes when the
  // caller didn't specify a language (or passed an unknown/auto value).
  // Mismatches are still surfaced as warnings for diagnostics.
  const csA = detectCodeSwitch(lineA, langA);
  const csB = detectCodeSwitch(lineB, langB);

  const isUnspecified = (l: LangCode | undefined): boolean => {
    if (!l) return true;
    const s = String(l).toLowerCase();
    return s === 'auto' || s === 'und' || s === 'unknown' || s === '' || s === '__unknown__';
  };

  const resolvedLangA: LangCode = isUnspecified(langA)
    ? ((csA?.detectedLang as LangCode) ?? langA)
    : langA;
  const resolvedLangB: LangCode = isUnspecified(langB)
    ? ((csB?.detectedLang as LangCode) ?? langB)
    : langB;

  if (csA?.detectedLang && csA.detectedLang !== langA) {
    warnings.push(`lid-cs-hint:${langA}->${csA.detectedLang}`);
  }
  if (csB?.detectedLang && csB.detectedLang !== langB) {
    warnings.push(`lid-cs-hint:${langB}->${csB.detectedLang}`);
  }

  // ── Step 1: Extract position unit ────────────────────────────────────────
  const unitsA = extractPositionUnits(lineA, opts);
  const unitsB = extractPositionUnits(lineB, opts);

  // For multi-syllabic mode, extend tail
  const surfaceA = multiSyl > 1
    ? multiSyllabicTail(unitsA[unitsA.length - 1] ?? lineA, multiSyl)
    : (unitsA[unitsA.length - 1] ?? lineA);
  const surfaceB = multiSyl > 1
    ? multiSyllabicTail(unitsB[unitsB.length - 1] ?? lineB, multiSyl)
    : (unitsB[unitsB.length - 1] ?? lineB);

  const unitA = extractLineEndingUnit(surfaceA, resolvedLangA);
  const unitB = extractLineEndingUnit(surfaceB, resolvedLangB);

  warnings.push(...unitA.warnings.map(w => `A:${w}`));
  warnings.push(...unitB.warnings.map(w => `B:${w}`));

  const { family, lowResource } = routeToFamily(resolvedLangA);
  const familyB = routeToFamily(resolvedLangB).family;

  // ── Step 2: Cross-family fallback ────────────────────────────────────────
  if (family !== familyB) {
    warnings.push('cross-family-fallback');
    const nucleusA = extractBestNucleus(unitA, family, resolvedLangA, lowResource);
    const nucleusB = extractBestNucleus(unitB, familyB, resolvedLangB, routeToFamily(resolvedLangB).lowResource);
    const tailA = normalizeInput(unitA.surface).slice(-4).toLowerCase();
    const tailB = normalizeInput(unitB.surface).slice(-4).toLowerCase();
    const scoreRaw = 1 - phonemeEditDistance(tailA, tailB);
    return {
      score: Math.max(0, Math.min(1, scoreRaw)),
      category: categorize(scoreRaw),
      family: 'FALLBACK',
      langA: resolvedLangA, langB: resolvedLangB, unitA, unitB,
      nucleusA, nucleusB,
      lowResourceFallback: true,
      warnings,
    };
  }

  // ── Step 3: Family scoring ────────────────────────────────────────────────
  let baseScore = 0;
  let nucleusA: RhymeNucleus;
  let nucleusB: RhymeNucleus;

  switch (family) {
    case 'KWA': {
      const nA = extractNucleusKWA(unitA);
      const nB = extractNucleusKWA(unitB);
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreKWANormalized(nA, nB);
      break;
    }
    case 'CRV': {
      const nA = extractNucleusCRV(unitA, lowResource, resolvedLangA);
      const nB = extractNucleusCRV(unitB, lowResource, resolvedLangB);
      nucleusA = nA; nucleusB = nB;
      if (lowResource) warnings.push('low-resource-fallback');
      baseScore = scoreCRV(nA, nB, resolvedLangA);
      break;
    }
    case 'ROM': {
      const nA = extractNucleusROM(unitA, resolvedLangA);
      const nB = extractNucleusROM(unitB, resolvedLangB);
      nucleusA = nA; nucleusB = nB;
      baseScore = 0.6 * (1 - phonemeEditDistance(nA.vowels, nB.vowels))
                + 0.4 * (1 - phonemeEditDistance(nA.coda, nB.coda));
      break;
    }
    case 'GER': {
      const nA = extractNucleusGER(unitA, resolvedLangA);
      const nB = extractNucleusGER(unitB, resolvedLangB);
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreGER(nA, nB);
      break;
    }
    case 'BNT': {
      // morphoAware: strip class prefix before nucleus extraction
      const stemA = morphoExtractNucleus(unitA.surface, 'BNT').stem;
      const stemB = morphoExtractNucleus(unitB.surface, 'BNT').stem;
      const mUnitA = extractLineEndingUnit(stemA, resolvedLangA);
      const mUnitB = extractLineEndingUnit(stemB, resolvedLangB);
      const nA = extractNucleusBNT(mUnitA, resolvedLangA);
      const nB = extractNucleusBNT(mUnitB, resolvedLangB);
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreBNT(nA, nB, resolvedLangA);
      break;
    }
    case 'YRB': {
      const nA = extractNucleusYRB(unitA) as YRBNucleus;
      const nB = extractNucleusYRB(unitB) as YRBNucleus;
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreYRB(nA, nB);
      break;
    }
    case 'SLV': {
      const nA = extractNucleusSLV(unitA, resolvedLangA);
      const nB = extractNucleusSLV(unitB, resolvedLangB);
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreSLV(nA, nB);
      break;
    }
    case 'SEM': {
      const nA = extractNucleusSEM(unitA, resolvedLangA);
      const nB = extractNucleusSEM(unitB, resolvedLangB);
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreSEM(nA, nB);
      break;
    }
    case 'TAI': {
      const nA = extractNucleusTAI(unitA, resolvedLangA);
      const nB = extractNucleusTAI(unitB, resolvedLangB);
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreTAI(nA, nB);
      break;
    }
    case 'VIET': {
      const nA = extractNucleusVIET(unitA, resolvedLangA);
      const nB = extractNucleusVIET(unitB, resolvedLangB);
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreVIET(nA, nB);
      break;
    }
    case 'CJK': {
      const nA = extractNucleusCJK(unitA, resolvedLangA);
      const nB = extractNucleusCJK(unitB, resolvedLangB);
      nucleusA = nA; nucleusB = nB;
      warnings.push('cjk-graphemic-proxy');
      baseScore = scoreCJK(nA, nB);
      break;
    }
    case 'TRK': {
      // algo-trk handles agglutinative suffix stripping internally.
      // Pre-stripping with the generic 'AGG' morphoNucleus is destructive
      // (strips too aggressively, can leave empty stems on short words).
      const nA = extractNucleusTRK(unitA, resolvedLangA) as TRKNucleus;
      const nB = extractNucleusTRK(unitB, resolvedLangB) as TRKNucleus;
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreTRK(nA, nB);
      break;
    }
    case 'FIN': {
      // algo-fin handles FI/HU suffix stripping + vowel-harmony normalisation.
      // Pre-stripping with the generic 'AGG' morphoNucleus would double-strip
      // (e.g. 'maassa' -> 'maa' -> 'ma'), destroying the rhyme nucleus.
      const nA = extractNucleusFIN(unitA, resolvedLangA) as FINNucleus;
      const nB = extractNucleusFIN(unitB, resolvedLangB) as FINNucleus;
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreFIN(nA, nB);
      break;
    }
    case 'IIR': {
      const nA = extractNucleusIIR(unitA, resolvedLangA);
      const nB = extractNucleusIIR(unitB, resolvedLangB);
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreIIR(nA, nB);
      break;
    }
    case 'AUS': {
      const nA = extractNucleusAUS(unitA, resolvedLangA);
      const nB = extractNucleusAUS(unitB, resolvedLangB);
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreAUS(nA, nB);
      break;
    }
    case 'DRA': {
      const nA = extractNucleusDRA(unitA, resolvedLangA);
      const nB = extractNucleusDRA(unitB, resolvedLangB);
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreDRA(nA, nB);
      break;
    }
    case 'CRE': {
      const nA = extractNucleusCRE(unitA, resolvedLangA);
      const nB = extractNucleusCRE(unitB, resolvedLangB);
      nucleusA = nA; nucleusB = nB;
      baseScore = scoreCRE(nA, nB);
      break;
    }
    default: {
      const tailA = normalizeInput(unitA.surface).slice(-4).toLowerCase();
      const tailB = normalizeInput(unitB.surface).slice(-4).toLowerCase();
      baseScore = 1 - phonemeEditDistance(tailA, tailB);
      const dN: RhymeNucleus = { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };
      nucleusA = dN; nucleusB = dN;
      warnings.push('fallback-graphemic');
    }
  }

  // ── Step 4: Tonal penalty ─────────────────────────────────────────────────
  const tonalFamily = TONAL_FAMILY_MAP[family];
  if (tonalFamily && nucleusA!.tone && nucleusB!.tone) {
    baseScore = applyTonalPenalty(
      baseScore, tonalFamily,
      nucleusA!.tone, nucleusB!.tone,
      opts.tonalWeight ?? 0.25
    );
  }

  // ── Step 5: Embedding blend (sync path — embedding deferred) ─────────────
  // Embedding is async; in sync call we skip and flag for caller.
  // Use rhymeScoreAsync() for full level-4 blend.
  if (opts.useEmbedding && EMBEDDING_FAMILIES.has(family)) {
    warnings.push('embedding-deferred:use-rhymeScoreAsync');
  }

  // ── Step 6: Position threshold annotation ────────────────────────────────
  const threshold = POSITION_THRESHOLDS[position];
  if (baseScore < threshold) warnings.push(`below-threshold:${position}:${threshold}`);

  const score = Math.max(0, Math.min(1, baseScore));
  return build(score, family, resolvedLangA, resolvedLangB, unitA, unitB, nucleusA!, nucleusB!, lowResource, warnings);
}

/**
 * Async variant — runs full level-4 embedding blend for eligible families.
 */
export async function rhymeScoreAsync(
  lineA: string,
  lineB: string,
  langA: LangCode,
  langB: LangCode,
  opts: RhymeScoreOptions = {}
): Promise<RhymeResult> {
  const syncResult = rhymeScore(lineA, lineB, langA, langB, { ...opts, useEmbedding: false });
  const { family } = routeToFamily(langA);

  if (!EMBEDDING_FAMILIES.has(family)) return syncResult;

  const phonesA = syncResult.nucleusA.vowels.split('') .concat(syncResult.nucleusA.coda.split(''));
  const phonesB = syncResult.nucleusB.vowels.split('').concat(syncResult.nucleusB.coda.split(''));

  const embResult = await embeddingScore(phonesA, phonesB, family as any, langA);
  const blended = blendScores(syncResult.score, embResult.score, 0.4);
  const warnings = [...syncResult.warnings, `embedding:${embResult.backend}`];

  return {
    ...syncResult,
    score: Math.max(0, Math.min(1, blended)),
    category: categorize(blended),
    warnings,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractBestNucleus(
  unit: RhymeResult['unitA'],
  family: RhymeResult['family'],
  lang: LangCode,
  lowResource: boolean
): RhymeNucleus {
  switch (family) {
    case 'KWA':  return extractNucleusKWA(unit);
    case 'CRV':  return extractNucleusCRV(unit, lowResource, lang);
    case 'ROM':  return extractNucleusROM(unit, lang);
    case 'GER':  return extractNucleusGER(unit, lang);
    case 'BNT':  return extractNucleusBNT(unit, lang);
    case 'YRB':  return extractNucleusYRB(unit);
    case 'SLV':  return extractNucleusSLV(unit, lang);
    case 'SEM':  return extractNucleusSEM(unit, lang);
    case 'TAI':  return extractNucleusTAI(unit, lang);
    case 'VIET': return extractNucleusVIET(unit, lang);
    case 'CJK':  return extractNucleusCJK(unit, lang);
    case 'TRK':  return extractNucleusTRK(unit, lang);
    case 'FIN':  return extractNucleusFIN(unit, lang);
    case 'IIR':  return extractNucleusIIR(unit, lang);
    case 'AUS':  return extractNucleusAUS(unit, lang);
    case 'DRA':  return extractNucleusDRA(unit, lang);
    case 'CRE':  return extractNucleusCRE(unit, lang);
    default:     return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };
  }
}

function build(
  score: number,
  family: RhymeResult['family'],
  langA: LangCode,
  langB: LangCode,
  unitA: RhymeResult['unitA'],
  unitB: RhymeResult['unitB'],
  nucleusA: RhymeNucleus,
  nucleusB: RhymeNucleus,
  lowResourceFallback: boolean,
  warnings: string[]
): RhymeResult {
  return {
    score: Math.max(0, Math.min(1, score)),
    category: categorize(score),
    family, langA, langB, unitA, unitB, nucleusA, nucleusB, lowResourceFallback, warnings,
  };
}