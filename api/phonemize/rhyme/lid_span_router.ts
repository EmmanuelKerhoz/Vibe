/**
 * lid_span_router.ts — Lyricist v4.1 Remediation #3
 * LID span-level : détection de langue par segment avant G2P.
 */

export interface LangSpan {
  text: string;
  lang: string;
  family: string;
  confidence: number;
  start: number;
  end: number;
  lowResource: boolean;
}

const LANG_TO_FAMILY: Record<string, string> = {
  fr: 'ALGO-ROM', es: 'ALGO-ROM', it: 'ALGO-ROM', pt: 'ALGO-ROM',
  en: 'ALGO-GER', de: 'ALGO-GER', nl: 'ALGO-GER',
  ru: 'ALGO-SLV', pl: 'ALGO-SLV',
  zh: 'ALGO-SIN', yue: 'ALGO-SIN',
  ar: 'ALGO-SEM', he: 'ALGO-SEM',
  sw: 'ALGO-BNT', yo: 'ALGO-BNT',
  ba: 'ALGO-KWA', di: 'ALGO-KWA', ew: 'ALGO-KWA', mi: 'ALGO-KWA',
  bk: 'ALGO-CRV', cb: 'ALGO-CRV', og: 'ALGO-CRV', ha: 'ALGO-CRV',
  hi: 'ALGO-IIR', ur: 'ALGO-IIR', bn: 'ALGO-IIR',
  ta: 'ALGO-DRV', te: 'ALGO-DRV',
  fi: 'ALGO-FIN', et: 'ALGO-FIN',
  tr: 'ALGO-TRK', uz: 'ALGO-TRK',
  ja: 'ALGO-JAP', ko: 'ALGO-KOR',
  th: 'ALGO-TAI', lo: 'ALGO-TAI',
  vi: 'ALGO-VIET', km: 'ALGO-VIET',
  id: 'ALGO-AUS', ms: 'ALGO-AUS', tl: 'ALGO-AUS',
};

const LOW_RESOURCE_LANGS = new Set(['bk', 'og', 'mi']);

export type LidPredictor = (token: string) => Promise<{ lang: string; confidence: number }>;

export async function detectSpans(
  verse: string,
  docLang = 'fr',
  lidPredictor?: LidPredictor,
  confidenceThreshold = 0.75
): Promise<LangSpan[]> {
  if (!lidPredictor) return [heuristicFallback(verse, docLang)];

  const tokens = verse.split(/\s+/);
  const spans: LangSpan[] = [];
  let currentLang = docLang;
  let currentTokens: string[] = [];
  let startIdx = 0;

  for (let i = 0; i < tokens.length; i++) {
    const { lang: detected, confidence } = await lidPredictor(tokens[i]);
    const effectiveLang = confidence >= confidenceThreshold ? detected : docLang;

    if (effectiveLang !== currentLang && currentTokens.length > 0) {
      spans.push(buildSpan(currentTokens, currentLang, startIdx, i));
      currentTokens = [];
      startIdx = i;
      currentLang = effectiveLang;
    }
    currentTokens.push(tokens[i]);
  }

  if (currentTokens.length > 0) spans.push(buildSpan(currentTokens, currentLang, startIdx, tokens.length));
  return spans.length > 0 ? spans : [heuristicFallback(verse, docLang)];
}

function heuristicFallback(verse: string, lang: string): LangSpan {
  return buildSpan(verse.split(/\s+/), lang, 0, verse.split(/\s+/).length, 1.0);
}

function buildSpan(tokens: string[], lang: string, start: number, end: number, confidence = 0.8): LangSpan {
  return {
    text: tokens.join(' '),
    lang,
    family: LANG_TO_FAMILY[lang] ?? 'ALGO-ROM',
    confidence,
    start,
    end,
    lowResource: LOW_RESOURCE_LANGS.has(lang),
  };
}
