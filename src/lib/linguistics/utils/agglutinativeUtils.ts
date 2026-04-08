const AGGLUTINATIVE_SUFFIXES: Record<string, readonly string[]> = {
  tr: normalizeSuffixes([
    'lerden', 'lardan', 'lerdir', 'lardır', 'lerimiz', 'larımız', 'leriniz', 'larınız',
    'lerde', 'larda', 'lerin', 'ların', 'leri', 'ları', 'imiz', 'ımız', 'umuz', 'ümüz',
    'iniz', 'ınız', 'unuz', 'ünüz', 'iyor', 'ıyor', 'uyor', 'üyor', 'miş', 'mış', 'muş',
    'müş', 'dir', 'dır', 'dur', 'dür', 'tir', 'tır', 'tur', 'tür', 'dan', 'den', 'tan',
    'ten', 'lik', 'lık', 'luk', 'lük', 'siz', 'sız', 'suz', 'süz', 'lar', 'ler',
    // NOTE: 'mak'/'mek' (infinitive) intentionally excluded — the infinitive
    // IS the citation form; stripping it corrupts the rhyme nucleus.
    // e.g. 'gelmek' → coda 'k' (obstruent) must be preserved.
    'da', 'de', 'ta', 'te', 'na', 'ne', 'ni', 'nı', 'nu', 'nü', 'sa', 'se', 'di',
    'dı', 'du', 'dü', 'ti', 'tı', 'tu', 'tü', 'im', 'ım', 'um', 'üm', 'in', 'ın', 'un', 'ün',
  ]),
  uz: normalizeSuffixes([
    'larning', 'lardan', 'lerden', 'larga', 'ning', 'dagi', 'lari', 'lar', 'ler', 'siz',
    'lik', 'chi', 'dan', 'den', 'tan', 'ten', 'ga', 'ge', 'qa', 'ke', 'ni', 'da', 'de',
    'ta', 'te', 'man', 'san', 'miz', 'di', 'ti', 'sa', 'se',
  ]),
  kk: normalizeSuffixes([
    'лардың', 'лердің', 'лардан', 'лерден', 'ларға', 'лерге', 'дағы', 'дегі', 'ның', 'нің',
    'дың', 'дің', 'тың', 'тің', 'мен', 'пен', 'бен', 'лар', 'лер', 'дар', 'дер', 'тар',
    'тер', 'ға', 'ге', 'қа', 'ке', 'ды', 'ді', 'ты', 'ті', 'да', 'де', 'та', 'те', 'сыз',
    'сіз', 'лық', 'лік', 'дық', 'дік',
  ]),
  az: normalizeSuffixes([
    'lardan', 'lərdən', 'ların', 'lərin', 'lara', 'lərə', 'larda', 'lərdə', 'ımız', 'imiz',
    'umuz', 'ümüz', 'ınız', 'iniz', 'unuz', 'ünüz', 'dir', 'dır', 'dur', 'dür', 'dan', 'dən',
    'tan', 'tən', 'lıq', 'lik', 'luq', 'lük', 'sız', 'siz', 'suz', 'süz', 'lar', 'lər', 'maq',
    'mək', 'da', 'də', 'ta', 'tə', 'ni', 'nı', 'nu', 'nü', 'sa', 'sə',
  ]),
  fi: normalizeSuffixes([
    'ssansa', 'ssänsä', 'issakin', 'issäkin', 'istakin', 'istäkin', 'llansa', 'llänsä', 'ssa',
    'ssä', 'sta', 'stä', 'lla', 'llä', 'lta', 'ltä', 'lle', 'ksi', 'tta', 'ttä', 'ineen',
    'nsa', 'nsä', 'mme', 'nne', 'ni', 'si', 'kin', 'kaan', 'kään', 'han', 'hän', 'den', 'jen',
    't', 'n',
  ]),
  et: normalizeSuffixes([
    'dega', 'tega', 'dele', 'tele', 'dest', 'test', 'sse', 'des', 'tes', 'lena', 'lta', 'ga',
    'ta', 'le', 'lt', 'ks', 'ni', 'si', 'te', 'de', 'st', 's',
  ]),
  hu: normalizeSuffixes([
    'otoknak', 'eteknek', 'aitok', 'eitek', 'aink', 'eink', 'ban', 'ben', 'nak', 'nek', 'val',
    'vel', 'rol', 'ről', 'tol', 'től', 'hoz', 'hez', 'höz', 'kor', 'ként', 'kent', 'ig', 'ul',
    'ül', 'an', 'en', 'on', 'ön', 'at', 'et', 'ot', 'öt', 'ra', 're', 'ba', 'be', 'tól', 't',
    'k', 'm', 'd',
  ]),
  ta: normalizeSuffixes([
    'kaḷukku', 'gaḷukku', 'kkaḷ', 'gaḷ', 'kaḷ', 'ukku', 'kku', 'ōṭu', 'odu', 'udan', 'ile',
    'iliruntu', 'ilirundhu', 'ilirunthu', 'in', 'il', 'ai', 'al', 'am', 'um', 'atu', 'adu',
    'ar', 'an', 'e',
  ]),
  te: normalizeSuffixes([
    'luṇḍi', 'lōni', 'laku', 'kuḍā', 'kunu', 'tō', 'ni', 'ki', 'ku', 'lu', 'la', 'lo', 'pai',
    'to', 'mu', 'vu', 'du', 'ḍu', 'ru', 'nu',
  ]),
  kn: normalizeSuffixes([
    'gaḷige', 'gaḷinda', 'gaḷalli', 'gaḷu', 'ige', 'inda', 'alli', 'annu', 'ina', 'u', 'a', 'e',
    'i', 'ge', 'na', 'nu', 'ru',
  ]),
  ml: normalizeSuffixes([
    'kaḷuṭe', 'kaḷkkŭ', 'kaḷil', 'kaḷe', 'kaḷ', 'uṭe', 'kkŭ', 'il', 'āl', 'ōṭe', 'e', 'aṁ', 'um',
    'uṁ', 'u', 'i',
  ]),
  hi: normalizeSuffixes(['iyon', 'iyan', 'ūn', 'on', 'en', 'ko', 'ne', 'se', 'tak', 'par', 'wala', 'wali', 'wale']),
  ur: normalizeSuffixes(['ūn', 'on', 'en', 'ko', 'ne', 'se', 'tak', 'par', 'wala', 'wali', 'wale']),
  bn: normalizeSuffixes(['gulo', 'guli', 'der', 'era', 'ke', 'te', 'e', 'ta']),
  pa: normalizeSuffixes(['iāṁ', 'āṁ', 'ā̃', 'āṃ', 'nūṁ', 'nū', 'tōṁ', 'dā', 'dī', 'de']),
  fa: normalizeSuffixes(['hāye', 'haye', 'hā', 'ha', 'ra', 'tarin', 'tar']),
};

const FAMILY_FALLBACKS: Record<string, readonly string[]> = {
  trk: normalizeSuffixes([...(AGGLUTINATIVE_SUFFIXES.tr ?? []), ...(AGGLUTINATIVE_SUFFIXES.uz ?? []), ...(AGGLUTINATIVE_SUFFIXES.az ?? [])]),
  fin: normalizeSuffixes([...(AGGLUTINATIVE_SUFFIXES.fi ?? []), ...(AGGLUTINATIVE_SUFFIXES.et ?? []), ...(AGGLUTINATIVE_SUFFIXES.hu ?? [])]),
  drv: normalizeSuffixes([...(AGGLUTINATIVE_SUFFIXES.ta ?? []), ...(AGGLUTINATIVE_SUFFIXES.te ?? []), ...(AGGLUTINATIVE_SUFFIXES.kn ?? []), ...(AGGLUTINATIVE_SUFFIXES.ml ?? [])]),
  iir: normalizeSuffixes([...(AGGLUTINATIVE_SUFFIXES.hi ?? []), ...(AGGLUTINATIVE_SUFFIXES.ur ?? []), ...(AGGLUTINATIVE_SUFFIXES.bn ?? []), ...(AGGLUTINATIVE_SUFFIXES.pa ?? []), ...(AGGLUTINATIVE_SUFFIXES.fa ?? [])]),
};

const STRIP_PASSES = 3;
const CORE_VOWEL_RE = /[aeiouyäöüıəāīūēōæøœáéíóúàèìòùâêîôûãõ]/i;

/**
 * Iteratively remove common agglutinative suffix chains from a normalized word stem.
 * `langCode` selects the suffix inventory, and three passes allow plural/case/tense stacks
 * to be peeled back without over-stripping short stems.
 *
 * Guard: the stripped stem must be ≥ 3 chars AND contain a vowel.
 * This prevents over-stripping compounds and short roots (e.g. 'ev' from 'evlerde')
 * which would corrupt the rhyme nucleus used for comparison.
 */
export function stripAgglutinativeSuffixes(word: string, langCode: string): string {
  const normalizedWord = word.normalize('NFC').toLowerCase();
  const normalizedLang = langCode.toLowerCase();
  const suffixes = resolveSuffixes(normalizedLang);
  let stem = normalizedWord;

  for (let pass = 0; pass < STRIP_PASSES; pass++) {
    const suffix = suffixes.find(candidate => {
      if (!stem.endsWith(candidate)) return false;
      const stripped = stem.slice(0, -candidate.length);
      // Raised from 2 to 3: prevents monosyllabic stubs like 'ev', 'el'
      // that would make coda comparison unreliable across near-rhyme pairs.
      return stripped.length >= 3 && CORE_VOWEL_RE.test(stripped);
    });

    if (!suffix) {
      break;
    }

    stem = stem.slice(0, -suffix.length);
  }

  return stem;
}

function resolveSuffixes(langCode: string): readonly string[] {
  return AGGLUTINATIVE_SUFFIXES[langCode]
    ?? FAMILY_FALLBACKS[resolveFamilyKey(langCode)]
    ?? [];
}

function resolveFamilyKey(langCode: string): keyof typeof FAMILY_FALLBACKS {
  if (['tr', 'uz', 'kk', 'az'].includes(langCode)) return 'trk';
  if (['fi', 'et', 'hu'].includes(langCode)) return 'fin';
  if (['ta', 'te', 'kn', 'ml'].includes(langCode)) return 'drv';
  return 'iir';
}

function normalizeSuffixes(suffixes: readonly string[]): readonly string[] {
  return [...new Set(suffixes)].sort((left, right) => right.length - left.length);
}
