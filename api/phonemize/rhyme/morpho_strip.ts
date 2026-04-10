/**
 * morpho_strip.ts — Lyricist v4.1 Remediation #4
 * Strip morphologique pré-extraction du RN (BNT, TRK, DRV).
 */

export interface StripResult {
  original: string;
  stripped: string;
  suffixRemoved: string;
  morphoStripApplied: boolean;
}

const BANTU_PREFIXES: Record<string, string[]> = {
  sw: ['m-', 'wa-', 'ki-', 'vi-', 'n-', 'ny-', 'ma-', 'pa-', 'ku-', 'mu-'],
  zu: ['um-', 'ama-', 'is-', 'iz-', 'ulu-', 'izi-', 'in-', 'imi-'],
  ln: ['mo-', 'ba-', 'lo-', 'ma-', 'bo-', 'ko-'],
};

const TURKIC_SUFFIXES: Record<string, string[]> = {
  tr: ['-lar', '-ler', '-dan', '-den', '-da', '-de', '-ta', '-te', '-ın', '-in', '-un', '-ün', '-a', '-e', '-ı', '-i', '-u', '-ü'],
  uz: ['-lar', '-da', '-ga'],
};

const DRAVIDIAN_SUFFIXES: Record<string, string[]> = {
  ta: ['-கள்', '-இல்', '-இன்', '-உம்', '-ஐ', '-கு'],
  te: ['-లు', '-లో', '-కు', '-ను'],
};

export function stripMorphology(token: string, lang: string): [string, string] {
  const lower = lang.toLowerCase();

  const bantoPrefixes = BANTU_PREFIXES[lower];
  if (bantoPrefixes) {
    for (const prefix of bantoPrefixes) {
      const bare = prefix.replace(/-/g, '');
      if (token.toLowerCase().startsWith(bare) && token.length > bare.length + 2) {
        return [token.slice(bare.length), prefix];
      }
    }
  }

  const turkicSuffixes = TURKIC_SUFFIXES[lower];
  if (turkicSuffixes) {
    for (const suffix of [...turkicSuffixes].sort((a, b) => b.length - a.length)) {
      const bare = suffix.replace(/-/g, '');
      if (token.toLowerCase().endsWith(bare) && token.length > bare.length + 2) {
        return [token.slice(0, -bare.length), suffix];
      }
    }
  }

  const dravidianSuffixes = DRAVIDIAN_SUFFIXES[lower];
  if (dravidianSuffixes) {
    for (const suffix of [...dravidianSuffixes].sort((a, b) => b.length - a.length)) {
      const bare = suffix.replace(/-/g, '');
      if (token.endsWith(bare) && token.length > bare.length + 1) {
        return [token.slice(0, -bare.length), suffix];
      }
    }
  }

  return [token, ''];
}

export function stripBeforeRnExtraction(ipaToken: string, lang: string, applyStrip = true): StripResult {
  if (!applyStrip) {
    return { original: ipaToken, stripped: ipaToken, suffixRemoved: '', morphoStripApplied: false };
  }
  const [stripped, suffix] = stripMorphology(ipaToken, lang);
  return {
    original: ipaToken,
    stripped,
    suffixRemoved: suffix,
    morphoStripApplied: suffix.length > 0,
  };
}
