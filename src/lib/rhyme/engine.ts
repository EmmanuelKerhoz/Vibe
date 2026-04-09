/**
 * Rhyme Engine v2 — Entry Point
 * rhymeScore(lineA, lineB, langA, langB): RhymeResult
 */

import type { LangCode, RhymeResult } from './types';
import { extractLineEndingUnit } from './normalize';
import { routeToFamily } from './router';
import { categorize, scoreKWANormalized, scoreCRV, phonemeEditDistance } from './scoring';
import { extractNucleusKWA } from './algo-kwa';
import { extractNucleusCRV } from './algo-crv';
import { extractNucleusROM } from './algo-rom';
import { extractNucleusGER, scoreGER } from './algo-ger';
import { extractNucleusBNT, scoreBNT } from './algo-bnt';

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

  // Step 2 — Route to family (use langA as primary)
  const { family, lowResource } = routeToFamily(langA);
  const familyB = routeToFamily(langB).family;

  // Cross-family: use FALLBACK graphemic scoring
  if (family !== familyB) {
    warnings.push('cross-family-fallback');
    const scoreRaw = 1 - phonemeEditDistance(
      unitA.surface.slice(-4).toLowerCase(),
      unitB.surface.slice(-4).toLowerCase()
    );
    const dummyNucleus = { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 as 1 | 2 };
    return {
      score: scoreRaw,
      category: categorize(scoreRaw),
      family: 'FALLBACK',
      langA, langB,
      unitA, unitB,
      nucleusA: dummyNucleus,
      nucleusB: dummyNucleus,
      lowResourceFallback: true,
      warnings,
    };
  }

  // Step 3 — Extract nuclei and compute score
  let score = 0;

  switch (family) {
    case 'KWA': {
      const nA = extractNucleusKWA(unitA);
      const nB = extractNucleusKWA(unitB);
      score = scoreKWANormalized(nA, nB);
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    case 'CRV': {
      const nA = extractNucleusCRV(unitA, lowResource);
      const nB = extractNucleusCRV(unitB, lowResource);
      score = scoreCRV(nA, nB);
      if (lowResource) warnings.push('low-resource-fallback');
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    case 'ROM': {
      const nA = extractNucleusROM(unitA, langA);
      const nB = extractNucleusROM(unitB, langB);
      const vowSim  = 1 - phonemeEditDistance(nA.vowels, nB.vowels);
      const codaSim = 1 - phonemeEditDistance(nA.coda, nB.coda);
      score = 0.6 * vowSim + 0.4 * codaSim;
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    case 'GER': {
      const nA = extractNucleusGER(unitA, langA);
      const nB = extractNucleusGER(unitB, langB);
      score = scoreGER(nA, nB);
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    case 'BNT': {
      const nA = extractNucleusBNT(unitA, langA);
      const nB = extractNucleusBNT(unitB, langB);
      score = scoreBNT(nA, nB, langA);
      return build(score, family, langA, langB, unitA, unitB, nA, nB, lowResource, warnings);
    }
    default: {
      // FALLBACK: graphemic tail PED
      const scoreRaw = 1 - phonemeEditDistance(
        unitA.surface.slice(-4).toLowerCase(),
        unitB.surface.slice(-4).toLowerCase()
      );
      const dN = { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 as 1 | 2 };
      warnings.push('fallback-graphemic');
      return build(scoreRaw, 'FALLBACK', langA, langB, unitA, unitB, dN, dN, true, warnings);
    }
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function build(
  score: number,
  family: RhymeResult['family'],
  langA: LangCode,
  langB: LangCode,
  unitA: RhymeResult['unitA'],
  unitB: RhymeResult['unitB'],
  nucleusA: RhymeResult['nucleusA'],
  nucleusB: RhymeResult['nucleusB'],
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
