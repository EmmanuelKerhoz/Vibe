/**
 * Rhyme Engine v4 — Entry Point
 * rhymeScore(lineA, lineB, langA, langB, opts): RhymeResult
 * analyzeBlock(block, lang, opts): BlockAnalysis
 *
 * v4 additions:
 *  - morphoAwareNucleus wired for BNT family (TRK/FIN handle morpho internally)
 *  - lidSpanDetector auto-detects code-switching before routing
 *  - embeddingScorer (level 4) blended for TAI/VIET/YRB/KWA (CJK excluded: graphemic proxies)
 *  - tonalMatrix unified penalty applied to all tonal families
 *  - rhymePosition mode: end | internal | initial | all
 */

import type { LangCode, RhymeNucleus, RhymeResult, SchemeResult, FamilyId } from './types';
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
import { applyTonalPenalty } from './toneMatrix';
import {
  extractPositionUnits,
  multiSyllabicTail,
  POSITION_THRESHOLDS,
  type RhymePosition,
  type PositionOptions,
} from './rhymePosition';
import { segmentVerses } from './verseSegmenter';

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



// ─── Embedding-eligible families ─────────────────────────────────────────────
// CJK excluded: Han/kana/jamo graphemic proxies are not in PHOIBLE vectors.
const EMBEDDING_FAMILIES = new Set(['TAI', 'VIET', 'YRB', 'KWA']);

// ─── analyzeBlock ────────────────────────────────────────────────────────────

export function analyzeBlock(
  block: string,
  lang: LangCode,
  opts: BlockAnalysisOptions = {}
): BlockAnalysis {
  const splitHemistich = opts.splitHemistich ?? true;

  // Pre-process hemistich if needed (since segmentVerses strips // by default but ignores internal logic if we pre-split)
  const processedBlock = splitHemistich 
    ? block.replace(/\s*\/\/\s*|\s+\/\s+/g, '\n')
    : block;

  // Delegate strictly to the centralized verseSegmenter which handles CJK/RTL safety
  const { lines } = segmentVerses(processedBlock);

  // Robust validation against unaligned or malformed opts.langs arrays
  const langsArr = Array.isArray(opts.langs) ? opts.langs : [];

  const lineItems = lines.map((vLine, i) => {
    // Safe lookup ensuring neither undefined, empty string, nor out-of-bounds array access breaks behavior
    const explicitLang = langsArr.length > i ? langsArr[i] : undefined;
    return {
      text: vLine.text,
      lang: (explicitLang && explicitLang.trim() !== '') ? explicitLang : lang,
    };
  });

  const scheme = detectRhymeSchemeMultiLang(lineItems, opts.window ?? 6);
  return { scheme, lines: lineItems };
}

// ─── Algorithm Registry ───────────────────────────────────────────────────────
type NucleusExtractor = (unit: RhymeResult['unitA'], lang: LangCode, lowResource: boolean) => RhymeNucleus;
type NucleusScorer = (nA: any, nB: any, langA: LangCode, langB: LangCode) => number;

interface AlgoRegistry {
  extract: NucleusExtractor;
  score: NucleusScorer;
}

const ALGO_REGISTRY: Partial<Record<string, AlgoRegistry>> = {
  KWA:  { extract: (u) => extractNucleusKWA(u), score: (nA, nB) => scoreKWANormalized(nA, nB) },
  CRV:  { extract: (u, _, lowRes) => extractNucleusCRV(u, lowRes, _), score: (nA, nB, lA) => scoreCRV(nA, nB, lA) },
  ROM:  { extract: (u, l) => extractNucleusROM(u, l), score: (nA, nB) => 0.6 * (1 - phonemeEditDistance(nA.vowels, nB.vowels)) + 0.4 * (1 - phonemeEditDistance(nA.coda, nB.coda)) },
  GER:  { extract: (u, l) => extractNucleusGER(u, l), score: (nA, nB) => scoreGER(nA, nB) },
  YRB:  { extract: (u) => extractNucleusYRB(u), score: (nA, nB) => scoreYRB(nA, nB) },
  SLV:  { extract: (u, l) => extractNucleusSLV(u, l), score: (nA, nB) => scoreSLV(nA, nB) },
  SEM:  { extract: (u, l) => extractNucleusSEM(u, l), score: (nA, nB) => scoreSEM(nA, nB) },
  TAI:  { extract: (u, l) => extractNucleusTAI(u, l), score: (nA, nB) => scoreTAI(nA, nB) },
  VIET: { extract: (u, l) => extractNucleusVIET(u, l), score: (nA, nB) => scoreVIET(nA, nB) },
  CJK:  { extract: (u, l) => extractNucleusCJK(u, l), score: (nA, nB) => scoreCJK(nA, nB) },
  TRK:  { extract: (u, l) => extractNucleusTRK(u, l), score: (nA, nB) => scoreTRK(nA, nB) },
  FIN:  { extract: (u, l) => extractNucleusFIN(u, l), score: (nA, nB) => scoreFIN(nA, nB) },
  IIR:  { extract: (u, l) => extractNucleusIIR(u, l), score: (nA, nB) => scoreIIR(nA, nB) },
  AUS:  { extract: (u, l) => extractNucleusAUS(u, l), score: (nA, nB) => scoreAUS(nA, nB) },
  DRA:  { extract: (u, l) => extractNucleusDRA(u, l), score: (nA, nB) => scoreDRA(nA, nB) },
  CRE:  { extract: (u, l) => extractNucleusCRE(u, l), score: (nA, nB) => scoreCRE(nA, nB) },
  BNT:  {
    extract: (u, l) => {
      const stem = morphoExtractNucleus(u.surface, 'BNT').stem;
      const mUnit = extractLineEndingUnit(stem, l);
      return extractNucleusBNT(mUnit, l);
    },
    score: (nA, nB, lA) => scoreBNT(nA, nB, lA),
  }
};

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

  // For multi-unit modes (internal/all), find the best-matching pair by quick
  // phoneme similarity across all unit combinations, then score that pair fully.
  let bestUnitA: string;
  let bestUnitB: string;
  if (unitsA.length === 1 && unitsB.length === 1) {
    bestUnitA = unitsA[0]!;
    bestUnitB = unitsB[0]!;
  } else {
    let bestSim = -1;
    bestUnitA = unitsA[0]!;
    bestUnitB = unitsB[0]!;
    for (const ua of unitsA) {
      for (const ub of unitsB) {
        const na = normalizeInput(ua).toLowerCase();
        const nb = normalizeInput(ub).toLowerCase();
        const sim = 1 - phonemeEditDistance(na.slice(-5), nb.slice(-5));
        if (sim > bestSim) { bestSim = sim; bestUnitA = ua; bestUnitB = ub; }
      }
    }
  }

  // For multi-syllabic mode, extend tail of the chosen units
  const surfaceA = multiSyl > 1
    ? multiSyllabicTail(bestUnitA, multiSyl)
    : bestUnitA;
  const surfaceB = multiSyl > 1
    ? multiSyllabicTail(bestUnitB, multiSyl)
    : bestUnitB;

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
      position,
      csDetected: resolvedLangA !== langA || resolvedLangB !== langB,
    };
  }

  // ── Step 3: Family scoring ────────────────────────────────────────────────
  let baseScore = 0;
  let nucleusA: RhymeNucleus;
  let nucleusB: RhymeNucleus;

  const handler = ALGO_REGISTRY[family];
  if (handler) {
    nucleusA = handler.extract(unitA, resolvedLangA, lowResource);
    nucleusB = handler.extract(unitB, resolvedLangB, routeToFamily(resolvedLangB).lowResource);

    if (family === 'CRV' && lowResource) warnings.push('low-resource-fallback');
    if (family === 'CJK') warnings.push('cjk-graphemic-proxy');

    baseScore = handler.score(nucleusA, nucleusB, resolvedLangA, resolvedLangB);
  } else {
    // FALLBACK GRAPHEMIC
    const tailA = normalizeInput(unitA.surface).slice(-4).toLowerCase();
    const tailB = normalizeInput(unitB.surface).slice(-4).toLowerCase();
    baseScore = 1 - phonemeEditDistance(tailA, tailB);
    const dN: RhymeNucleus = { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };
    nucleusA = dN; nucleusB = dN;
    warnings.push('fallback-graphemic');
  }

  // ── Step 4: Tonal penalty ─────────────────────────────────────────────────
  if (nucleusA!.tone && nucleusB!.tone) {
    baseScore = applyTonalPenalty(
      baseScore, family as FamilyId, resolvedLangA,
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
  return build(score, family, resolvedLangA, resolvedLangB, unitA, unitB, nucleusA!, nucleusB!, lowResource, warnings, position, resolvedLangA !== langA || resolvedLangB !== langB);
}

/**
 * Async variant — runs full level-4 embedding blend for eligible families.
 * Uses the LID-resolved languages from the sync result to ensure embedding
 * eligibility is evaluated on the same language as the sync scoring path.
 */
export async function rhymeScoreAsync(
  lineA: string,
  lineB: string,
  langA: LangCode,
  langB: LangCode,
  opts: RhymeScoreOptions = {}
): Promise<RhymeResult> {
  const syncResult = rhymeScore(lineA, lineB, langA, langB, { ...opts, useEmbedding: false });
  // Use LID-resolved language (stored in syncResult.langA after rhymeScore)
  const { family } = routeToFamily(syncResult.langA);

  if (!EMBEDDING_FAMILIES.has(family)) return syncResult;

  const phonesA = syncResult.nucleusA.vowels.split('').concat(syncResult.nucleusA.coda.split(''));
  const phonesB = syncResult.nucleusB.vowels.split('').concat(syncResult.nucleusB.coda.split(''));

  const embResult = await embeddingScore(phonesA, phonesB, family as any, syncResult.langA);
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
  const handler = ALGO_REGISTRY[family];
  if (handler) return handler.extract(unit, lang, lowResource);
  return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };
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
  warnings: string[],
  position?: RhymeResult['position'],
  csDetected?: boolean
): RhymeResult {
  const result: RhymeResult = {
    score: Math.max(0, Math.min(1, score)),
    category: categorize(score),
    family, langA, langB, unitA, unitB, nucleusA, nucleusB, lowResourceFallback, warnings,
  };
  if (position !== undefined) result.position = position;
  if (csDetected !== undefined) result.csDetected = csDetected;
  return result;
}