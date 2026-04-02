const AGGLUTINATIVE_SUFFIXES: Record<string, readonly string[]> = {
  tr: [
    'lerden', 'lardan', 'lerden', 'lardan', 'lerdir', 'lardır', 'lerimiz', 'larımız',
    'leriniz', 'larınız', 'lerden', 'lardan', 'lerde', 'larda', 'lerin', 'ların',
    'lerden', 'lardan', 'leri', 'ları', 'imiz', 'ımız', 'umuz', 'ümüz', 'iniz', 'ınız',
    'unuz', 'ünüz', 'iyor', 'ıyor', 'uyor', 'üyor', 'miş', 'mış', 'muş', 'müş',
    'dir', 'dır', 'dur', 'dür', 'tir', 'tır', 'tur', 'tür', 'dan', 'den', 'tan', 'ten',
    'lik', 'lık', 'luk', 'lük', 'siz', 'sız', 'suz', 'süz', 'lar', 'ler', 'mak', 'mek',
    'da', 'de', 'ta', 'te', 'na', 'ne', 'ni', 'nı', 'nu', 'nü', 'sa', 'se', 'di', 'dı',
    'du', 'dü', 'ti', 'tı', 'tu', 'tü', 'im', 'ım', 'um', 'üm', 'in', 'ın', 'un', 'ün',
  ],
  uz: [
    'lardan', 'lerden', 'larning', 'larning', 'larga', 'larga', 'lardan', 'lardan',
    'ning', 'dagi', 'dagi', 'lari', 'lari', 'lar', 'ler', 'siz', 'lik', 'lik', 'chi',
    'dan', 'den', 'tan', 'ten', 'ga', 'ge', 'qa', 'ke', 'ni', 'da', 'de', 'ta', 'te',
    'man', 'san', 'miz', 'miz', 'di', 'ti', 'sa', 'se',
  ],
  kk: [
    'larning', 'лердің', 'лардың', 'лардан', 'лерден', 'ларға', 'лерге', 'дағы', 'дегі',
    'ның', 'нің', 'дың', 'дің', 'тың', 'тің', 'мен', 'пен', 'бен', 'лар', 'лер', 'дар',
    'дер', 'тар', 'тер', 'ға', 'ге', 'қа', 'ке', 'ды', 'ді', 'ты', 'ті', 'да', 'де',
    'та', 'те', 'мен', 'сыз', 'сіз', 'лық', 'лік', 'дық', 'дік',
  ],
  az: [
    'lardan', 'lərdən', 'ların', 'lərin', 'lara', 'lərə', 'larda', 'lərdə', 'ımız',
    'imiz', 'umuz', 'ümüz', 'ınız', 'iniz', 'unuz', 'ünüz', 'dir', 'dır', 'dur', 'dür',
    'dan', 'dən', 'tan', 'tən', 'lıq', 'lik', 'luq', 'lük', 'sız', 'siz', 'suz', 'süz',
    'lar', 'lər', 'maq', 'mək', 'da', 'də', 'ta', 'tə', 'ni', 'nı', 'nu', 'nü', 'sa', 'sə',
  ],
  fi: [
    'ssansa', 'ssänsä', 'issakin', 'issäkin', 'istakin', 'istäkin', 'llansa', 'llänsä',
    'ssa', 'ssä', 'sta', 'stä', 'lla', 'llä', 'lta', 'ltä', 'lle', 'ksi', 'tta', 'ttä',
    'ineen', 'nsa', 'nsä', 'mme', 'nne', 'ni', 'si', 'kin', 'kaan', 'kään', 'han', 'hän',
    'den', 'jen', 't', 'n',
  ],
  et: [
    'dega', 'tega', 'dele', 'tele', 'dest', 'test', 'sse', 'des', 'tes', 'lena', 'lta',
    'ga', 'ta', 'le', 'lt', 'ks', 'ni', 'si', 'te', 'de', 'st', 's',
  ],
  hu: [
    'otoknak', 'eteknek', 'aitok', 'eitek', 'aink', 'eink', 'ban', 'ben', 'nak', 'nek',
    'val', 'vel', 'rol', 'ről', 'tol', 'től', 'hoz', 'hez', 'höz', 'kor', 'ként', 'kent',
    'ig', 'ul', 'ül', 'an', 'en', 'on', 'ön', 'at', 'et', 'ot', 'öt', 'ra', 're', 'ba',
    'be', 'tól', 'től', 't', 'k', 'm', 'd',
  ],
  ta: [
    'kaḷukku', 'gaḷukku', 'kkaḷ', 'gaḷ', 'kaḷ', 'ukku', 'kku', 'ōṭu', 'odu', 'udan', 'ile',
    'iliruntu', 'ilirundhu', 'ilirunthu', 'iliruntu', 'in', 'il', 'ai', 'al', 'am', 'um',
    'atu', 'adu', 'ar', 'an', 'e',
  ],
  te: [
    'luṇḍi', 'lōni', 'laku', 'kuḍā', 'kunu', 'tō', 'ni', 'ki', 'ku', 'lu', 'la', 'lo',
    'pai', 'to', 'mu', 'vu', 'du', 'ḍu', 'ru', 'nu',
  ],
  kn: [
    'gaḷige', 'gaḷinda', 'gaḷalli', 'gaḷu', 'ige', 'inda', 'alli', 'annu', 'ige', 'ina',
    'ige', 'u', 'a', 'e', 'i', 'inda', 'alli', 'ge', 'na', 'nu', 'ru',
  ],
  ml: [
    'kaḷuṭe', 'kaḷkkŭ', 'kaḷil', 'kaḷe', 'kaḷ', 'uṭe', 'kkŭ', 'il', 'āl', 'ōṭe', 'e', 'aṁ',
    'um', 'uṁ', 'u', 'i', 'e',
  ],
  hi: ['iyon', 'iyan', 'ūn', 'on', 'en', 'ko', 'ne', 'se', 'tak', 'par', 'wala', 'wali', 'wale'],
  ur: ['ūn', 'on', 'en', 'ko', 'ne', 'se', 'tak', 'par', 'wala', 'wali', 'wale'],
  bn: ['gulo', 'guli', 'der', 'era', 'ke', 'te', 'e', 'ta'],
  pa: ['āṁ', 'iāṁ', 'ā̃', 'āṃ', 'nū', 'nūṁ', 'tōṁ', 'dā', 'dī', 'de'],
  fa: ['hāye', 'haye', 'hā', 'ha', 'ra', 'tar', 'tarin'],
};

const FAMILY_FALLBACKS: Record<string, readonly string[]> = {
  trk: [...new Set([...AGGLUTINATIVE_SUFFIXES.tr, ...AGGLUTINATIVE_SUFFIXES.uz, ...AGGLUTINATIVE_SUFFIXES.az])],
  fin: [...new Set([...AGGLUTINATIVE_SUFFIXES.fi, ...AGGLUTINATIVE_SUFFIXES.et, ...AGGLUTINATIVE_SUFFIXES.hu])],
  drv: [...new Set([...AGGLUTINATIVE_SUFFIXES.ta, ...AGGLUTINATIVE_SUFFIXES.te, ...AGGLUTINATIVE_SUFFIXES.kn, ...AGGLUTINATIVE_SUFFIXES.ml])],
  iir: [...new Set([...AGGLUTINATIVE_SUFFIXES.hi, ...AGGLUTINATIVE_SUFFIXES.ur, ...AGGLUTINATIVE_SUFFIXES.bn, ...AGGLUTINATIVE_SUFFIXES.pa, ...AGGLUTINATIVE_SUFFIXES.fa])],
};

const STRIP_PASSES = 3;
const CORE_VOWEL_RE = /[aeiouyäöüıəāīūēōæøœáéíóúàèìòùâêîôûãõ]/i;

export function stripAgglutinativeSuffixes(word: string, langCode: string): string {
  const normalizedWord = word.normalize('NFC').toLowerCase();
  const normalizedLang = langCode.toLowerCase();
  const suffixes = resolveSuffixes(normalizedLang);
  let stem = normalizedWord;

  for (let pass = 0; pass < STRIP_PASSES; pass++) {
    const suffix = suffixes.find(candidate => {
      if (!stem.endsWith(candidate)) return false;
      const stripped = stem.slice(0, -candidate.length);
      return stripped.length >= 2 && CORE_VOWEL_RE.test(stripped);
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
