/**
 * initLexicons.ts
 * Bootstrap: registers all built-in lexicons into the PhonemeIndex
 * used by suggestRhymes().
 *
 * Code alignment:
 *   KWA languages are registered under BOTH their canonical SIL/ISO 639-3
 *   codes (bci, ee, gej, dyu) used by LANG_TO_FAMILY / suggestRhymes()
 *   AND their short LID aliases (ba, ew, mi, di) emitted by detectLanguage().
 *   This ensures both call paths always resolve to a lexicon bucket.
 *
 *   ha is registered under a single code ('ha') — consistent across LID,
 *   LANG_TO_FAMILY, and lexicon.
 *
 *   id (Indonesian) registered under 'id'; also aliased as 'id-ID'.
 *
 *   vi (Vietnamese) registered under 'vi'.
 *   fi (Finnish) registered under 'fi'.
 *   hu (Hungarian) registered under 'hu'.
 *   th (Thai) registered under 'th'.
 */

import { registerLexicon, getLexiconSize } from '../rhyme/PhonemeStore';
import { frLexicon } from './fr';
import { enLexicon } from './en';
import { esLexicon } from './es';
import { ptLexicon } from './pt';
import { yoLexicon } from './yo';
import { swLexicon } from './sw';
import { arLexicon } from './ar';
import { deLexicon } from './de';
import { itLexicon } from './it';
import { roLexicon } from './ro';
import { nlLexicon } from './nl';
import { plLexicon } from './pl';
import { ruLexicon } from './ru';
import { zhLexicon } from './zh';
import { jaLexicon } from './ja';
import { koLexicon } from './ko';
import { hiLexicon } from './hi';
import { trLexicon } from './tr';
import { haLexicon } from './ha';
import { baLexicon } from './ba';
import { ewLexicon } from './ew';
import { miLexicon } from './mi';
import { diLexicon } from './di';
import { idLexicon } from './id';
import { viLexicon } from './vi';
import { fiLexicon } from './fi';
import { huLexicon } from './hu';
import { thLexicon } from './th';

type StructuredLexiconEntry = {
  word: string;
  phones: readonly string[];
};

const IPA_VOWEL_RE = /[aeiouɛɔəɪʊɑæœøɯɤɶ]/u;

function findLastVowelIndex(phones: readonly string[]): number {
  for (let index = phones.length - 1; index >= 0; index -= 1) {
    if (IPA_VOWEL_RE.test(phones[index]!.normalize('NFD'))) {
      return index;
    }
  }

  return -1;
}

function toIndexedLexicon(
  lang: 'ha' | 'bci' | 'ee' | 'gej' | 'dyu',
  entries: readonly StructuredLexiconEntry[],
): ReadonlyArray<readonly [string, string]> {
  return entries.map(({ word, phones }) => {
    const lastVowelIndex = findLastVowelIndex(phones);
    if (lastVowelIndex === -1) {
      throw new Error(`Unable to derive rhyme key for "${word}" (${lang})`);
    }

    const nucleus = phones[lastVowelIndex]!;
    const coda = phones.slice(lastVowelIndex + 1).join('');

    if (lang === 'ha') {
      const weight = coda || nucleus.includes('ː') ? 'H-wt' : null;
      return [word, [nucleus, coda || null, weight].filter(Boolean).join(':')] as const;
    }

    return [word, nucleus] as const;
  });
}

export function initLexicons(): void {
  const haIndexedLexicon = toIndexedLexicon('ha', haLexicon);
  const baIndexedLexicon = toIndexedLexicon('bci', baLexicon);
  const ewIndexedLexicon = toIndexedLexicon('ee', ewLexicon);
  const miIndexedLexicon = toIndexedLexicon('gej', miLexicon);
  const diIndexedLexicon = toIndexedLexicon('dyu', diLexicon);

  // — Romance
  registerLexicon('fr', frLexicon);
  registerLexicon('es', esLexicon);
  registerLexicon('pt', ptLexicon);
  registerLexicon('it', itLexicon);
  registerLexicon('ro', roLexicon);
  // — Germanic
  registerLexicon('en', enLexicon);
  registerLexicon('de', deLexicon);
  registerLexicon('nl', nlLexicon);
  // — Slavic
  registerLexicon('pl', plLexicon);
  registerLexicon('ru', ruLexicon);
  // — Semitic
  registerLexicon('ar', arLexicon);
  // — Indo-Iranian
  registerLexicon('hi', hiLexicon);
  // — Turkic
  registerLexicon('tr', trLexicon);
  // — Uralic
  registerLexicon('fi', fiLexicon);
  registerLexicon('hu', huLexicon);
  // — Sinitic
  registerLexicon('zh', zhLexicon);
  // — Japanese
  registerLexicon('ja', jaLexicon);
  // — Korean
  registerLexicon('ko', koLexicon);
  // — Viet-Muong
  registerLexicon('vi', viLexicon);
  // — Tai-Kadai
  registerLexicon('th', thLexicon);
  // — Bantu / Niger-Congo
  registerLexicon('yo', yoLexicon);
  registerLexicon('sw', swLexicon);
  // — Afro-Asiatic / Chadic
  registerLexicon('ha', haIndexedLexicon);
  // — Austronesian
  registerLexicon('id', idLexicon);
  registerLexicon('id-ID', idLexicon);  // BCP-47 alias
  // — KWA: canonical codes (used by LANG_TO_FAMILY → suggestRhymes)
  registerLexicon('bci', baIndexedLexicon);   // Baoulé
  registerLexicon('ee',  ewIndexedLexicon);   // Ewe
  registerLexicon('gej', miIndexedLexicon);   // Mina / Gen
  registerLexicon('dyu', diIndexedLexicon);   // Dioula
  // — KWA: LID short aliases (emitted by detectLanguage() word-pilots)
  registerLexicon('ba',  baIndexedLexicon);
  registerLexicon('ew',  ewIndexedLexicon);
  registerLexicon('mi',  miIndexedLexicon);
  registerLexicon('di',  diIndexedLexicon);
}

/**
 * Health check: returns a map of lang → entry count.
 * Canonical codes only — aliases share the same bucket.
 */
export function getLexiconHealth(): Record<string, number> {
  return {
    fr:  getLexiconSize('fr'),
    es:  getLexiconSize('es'),
    pt:  getLexiconSize('pt'),
    it:  getLexiconSize('it'),
    ro:  getLexiconSize('ro'),
    en:  getLexiconSize('en'),
    de:  getLexiconSize('de'),
    nl:  getLexiconSize('nl'),
    pl:  getLexiconSize('pl'),
    ru:  getLexiconSize('ru'),
    ar:  getLexiconSize('ar'),
    hi:  getLexiconSize('hi'),
    tr:  getLexiconSize('tr'),
    fi:  getLexiconSize('fi'),
    hu:  getLexiconSize('hu'),
    zh:  getLexiconSize('zh'),
    ja:  getLexiconSize('ja'),
    ko:  getLexiconSize('ko'),
    vi:  getLexiconSize('vi'),
    th:  getLexiconSize('th'),
    yo:  getLexiconSize('yo'),
    sw:  getLexiconSize('sw'),
    ha:  getLexiconSize('ha'),
    id:  getLexiconSize('id'),
    bci: getLexiconSize('bci'),
    ee:  getLexiconSize('ee'),
    gej: getLexiconSize('gej'),
    dyu: getLexiconSize('dyu'),
  };
}

/** No-op reset hook for test compatibility. */
export function _resetLexicons_TEST_ONLY(): void {
  // no-op by design
}
