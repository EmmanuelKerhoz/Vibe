/**
 * Rhyme Engine v2 — Entry Point
 * rhymeScore(lineA, lineB, langA, langB): RhymeResult
 */

import type { LangCode, RhymeNucleus, RhymeResult } from './types';
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
import { extractNucleusSEA, extractNucleusCJK, scoreSEA, scoreCJK } from './algo-sea';

// ─── Main entry point ────────────────────────────────────────────────────────

export function rhymeScore(
  lineA: string,
  lineB: string,
  langA: LangCode,
  langB: LangCode
): RhymeResult {
  const warnings: string[] = [];

  // Step 1 — Extract line ending units
  const unitA = extractLineEndingUnit(lineA, langA);
  const unitB = extractLineEndingUnit(lineB, langB);

  warnings.push(...unitA.warnings.map(w => `A:${w}`));
  warnings.push(...unitB.warnings.map(w => `B:${w}`));

  // Step 2 — Route to family
  const { family, lowResource } = routeToFamily(langA);
  const familyB = routeToFamily(langB).family;

  // Cross-family: graphemic tail fallback
  if (family !== familyB) {
    warnings.push('cross-family-fallback');
    const nucleusA = extractBestNucleus(unitA, family, langA, lowResource);
    const nucleusB = extractBestNucleus(unitB, familyB, langB, routeToFamily(langB).lowResource);
    const tailA = normalizeInput(unitA.surface).slice(-4).toLowerCase();
    const tailB = normalizeInput(unitB.surface).slice(-4).toLowerCase();
    const scoreRaw = 1 - phonemeEditDistance(tailA, tailB);
    return {
      score: Math.max(0, Math.min(1, scoreRaw)),
      category: categorize(scoreRaw),
      family: 'FALLBACK',
      langA, langB,
      unitA, unitB,
      nucleusA,
      nucleusB,
      lowResourceFallback: true,
      warnings,
    };
  }

  // Step 3 — Same family: extract nuclei and score
  switch (family) {
    case 'KWA': {
      const nA = extractNucleusKWA(unitA);
      const nB = extractNucleusKWA(unitB);
      const score = scoreKWANormalized(nA, nB);
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    case 'CRV': {
      const nA = extractNucleusCRV(unitA, lowResource, langA);
      const nB = extractNucleusCRV(unitB, lowResource, langB);
      const score = scoreCRV(nA, nB);
      if (lowResource) warnings.push('low-resource-fallback');
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    case 'ROM': {
      const nA = extractNucleusROM(unitA, langA);
      const nB = extractNucleusROM(unitB, langB);
      const vowSim  = 1 - phonemeEditDistance(nA.vowels, nB.vowels);
      const codaSim = 1 - phonemeEditDistance(nA.coda,   nB.coda);
      const score   = 0.6 * vowSim + 0.4 * codaSim;
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    case 'GER': {
      const nA = extractNucleusGER(unitA, langA);
      const nB = extractNucleusGER(unitB, langB);
      const score = scoreGER(nA, nB);
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    case 'BNT': {
      const nA = extractNucleusBNT(unitA, langA);
      const nB = extractNucleusBNT(unitB, langB);
      const score = scoreBNT(nA, nB, langA);
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    case 'YRB': {
      const nA = extractNucleusYRB(unitA) as YRBNucleus;
      const nB = extractNucleusYRB(unitB) as YRBNucleus;
      const score = scoreYRB(nA, nB);
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    case 'SLV': {
      const nA = extractNucleusSLV(unitA, langA);
      const nB = extractNucleusSLV(unitB, langB);
      const score = scoreSLV(nA, nB);
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    case 'SEM': {
      const nA = extractNucleusSEM(unitA, langA);
      const nB = extractNucleusSEM(unitB, langB);
      const score = scoreSEM(nA, nB);
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    case 'SEA': {
      const nA = extractNucleusSEA(unitA, langA);
      const nB = extractNucleusSEA(unitB, langB);
      const score = scoreSEA(nA, nB);
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    case 'CJK': {
      const nA = extractNucleusCJK(unitA, langA);
      const nB = extractNucleusCJK(unitB, langB);
      const score = scoreCJK(nA, nB);
      warnings.push('cjk-graphemic-proxy');
      return build(score, family, langA, langB, unitA, unitB, nA, nB, true, warnings);
    }
    default: {
      // FALLBACK: normalised graphemic tail PED
      const tailA = normalizeInput(unitA.surface).slice(-4).toLowerCase();
      const tailB = normalizeInput(unitB.surface).slice(-4).toLowerCase();
      const scoreRaw = 1 - phonemeEditDistance(tailA, tailB);
      const dN: RhymeNucleus = { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };
      warnings.push('fallback-graphemic');
      return build(scoreRaw, 'FALLBACK', langA, langB, unitA, unitB, dN, dN, true, warnings);
    }
  }
}

// ─── Best-effort nucleus extractor for cross-family comparisons ───────────────

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
    case 'SEA':  return extractNucleusSEA(unit, lang);
    case 'CJK':  return extractNucleusCJK(unit, lang);
    default:     return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };
  }
}

// ─── Build helper ─────────────────────────────────────────────────────────────

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
    family,
    langA,
    langB,
    unitA,
    unitB,
    nucleusA,
    nucleusB,
    lowResourceFallback,
    warnings,
  };
}
