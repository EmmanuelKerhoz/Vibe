/**
 * detectLanguage.ts
 * Lightweight Language Identification (LID) for the linguistics engine.
 *
 * Two-stage pipeline — no external dependencies, offline, < 3 KB:
 *
 *   Stage 1 — Script detector
 *     Unicode range matching resolves ~80% of cases unambiguously
 *     (Cyrillic → ru, CJK → zh/ja/ko, Arabic → ar, Devanagari → hi, etc.).
 *
 *   Stage 1.5 — Devanagari disambiguation
 *     Hindi (hi), Sanskrit (sa), Marathi (mr) and Nepali (ne) all use
 *     Devanagari (\u0900-\u097F). Stage 1 alone cannot distinguish them.
 *     A word-pilot pass over Sanskrit-exclusive tokens (classical particles,
 *     sandhi markers) runs ONLY when Devanagari script is detected.
 *     If no Sanskrit signal is found, falls back to 'hi' (highest-frequency
 *     Devanagari language in practice).
 *
 *     Sanskrit pilots (must be absent from modern Hindi / Marathi / Nepali
 *     prose): च, एव, तु, अपि, इति, वा, यत्, तत्, सः, अस्ति, भवति,
 *     अहम्, त्वम्, एतत्, इदम्, किम्, कः, सर्व, धर्म, कर्म, मोक्ष.
 *
 *   Stage 2 — Word-pilot detector
 *     For Latin-script text, a small set of high-frequency, language-exclusive
 *     words scores each candidate language. Highest score wins.
 *     Covered: fr, en, es, it, pt, de, nl, sw, yo, ha, id, ms, tr, fi, hu, vi,
 *              ba, ew, mi, di (KWA non-standard codes), pl, ro,
 *              nou (Nouchi CI), pcm (Nigerian Pidgin), cfg (Camfranglais),
 *              ur (Urdu romanisé).
 *
 * @param text  Raw text (lyric, word, or sentence). May be mixed-script.
 * @returns     ISO 639-1/3 language code, or DEFAULT_LANG if detection fails.
 *
 * Confidence is intentionally NOT exposed in the public API — callers receive
 * a code and use it; the Registry's ALGO-ROBUST fallback handles residual errors.
 *
 * Exclusivity rules (pilots must NOT appear in sibling language lists):
 *   pt vs es  : pt uses não/você/lhe/mesmo/nossa/também/tudo/tenho — absent from es.
 *               Shared tokens (que, por, para, como, quando) removed from pt.
 *   cfg vs nou: cfg tokens are CM-exclusive (mboa, feymania, mbenguiste, feyeur).
 *               Shared tokens (tchamba, blèkè, sawa) kept only in nou.
 *   sw vs ha  : 'na' removed from both — replaced by language-exclusive sets.
 *               sw: hapo/bado/tena/wewe/yeye/wao/mimi.
 *               ha: sun/wuri/zuwa/dare/gida/kai/shi/mu/ku/su + ina/son/yana/kyau/sosai.
 *   KWA noise : all mono/bichar tokens removed from ba/ew/mi/di.
 *               Replaced by multichar tokens with diacritics absent from
 *               fr/en/es/it, providing unambiguous signal.
 *   sa vs hi  : Sanskrit pilots are Classical Sanskrit-exclusive particles and
 *               inflected forms absent from modern Hindi/Marathi/Nepali prose.
 *               Score threshold: ≥ 2 hits required to flip to 'sa'.
 */

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Returned when detection fails or text is too short. */
export const DEFAULT_LANG = 'fr';

/** Minimum token count for word-pilot scoring to be trusted. */
const MIN_TOKENS = 3;

// ─── Stage 1: Script Detector ──────────────────────────────────────────────────────

/**
 * Unicode range → language code.
 * Checked in order; first match wins.
 * Ranges cover the primary script for each language family.
 *
 * NOTE: Devanagari maps to 'hi' here as a provisional code only.
 * Stage 1.5 (disambiguateDevanagari) may upgrade it to 'sa' (Sanskrit),
 * 'mr' (Marathi) or 'ne' (Nepali) before the result is returned.
 */
const SCRIPT_RULES: Array<{ pattern: RegExp; lang: string }> = [
  // Cyrillic
  { pattern: /[\u0400-\u04FF]/, lang: 'ru' },
  // Arabic / Farsi / Urdu (native script)
  { pattern: /[\u0600-\u06FF]/, lang: 'ar' },
  // Hebrew
  { pattern: /[\u0590-\u05FF]/, lang: 'he' },
  // Devanagari (Hindi / Sanskrit / Marathi / Nepali) — Stage 1.5 disambiguates
  { pattern: /[\u0900-\u097F]/, lang: 'hi' },
  // Bengali
  { pattern: /[\u0980-\u09FF]/, lang: 'bn' },
  // Tamil
  { pattern: /[\u0B80-\u0BFF]/, lang: 'ta' },
  // Telugu
  { pattern: /[\u0C00-\u0C7F]/, lang: 'te' },
  // Kannada
  { pattern: /[\u0C80-\u0CFF]/, lang: 'kn' },
  // Malayalam
  { pattern: /[\u0D00-\u0D7F]/, lang: 'ml' },
  // Thai
  { pattern: /[\u0E00-\u0E7F]/, lang: 'th' },
  // CJK Unified Ideographs — Japanese wins over Chinese when kana present
  { pattern: /[\u3040-\u30FF]/, lang: 'ja' },   // Hiragana / Katakana (unambiguous)
  { pattern: /[\uAC00-\uD7AF]/, lang: 'ko' },   // Hangul
  { pattern: /[\u4E00-\u9FFF]/, lang: 'zh' },   // CJK (Chinese fallback)
  // Ethiopic (Amharic)
  { pattern: /[\u1200-\u137F]/, lang: 'am' },
  // Georgian
  { pattern: /[\u10A0-\u10FF]/, lang: 'ka' },
];

/**
 * Returns a language code if the text's dominant script is non-Latin,
 * or undefined if Latin (requires Stage 2).
 */
function detectByScript(text: string): string | undefined {
  for (const { pattern, lang } of SCRIPT_RULES) {
    if (pattern.test(text)) return lang;
  }
  return undefined;
}

// ─── Stage 1.5: Devanagari Disambiguation ─────────────────────────────────────

/**
 * Sanskrit-exclusive word pilots.
 *
 * Selection criteria:
 *   1. Classical Sanskrit particles and inflected forms.
 *   2. Must NOT appear in common modern Hindi / Marathi / Nepali prose.
 *   3. Multi-character only — single-character tokens create too many
 *      false positives with partial Devanagari sequences.
 *
 * Tokens include:
 *   - Classical particles: च (ca, "and"), एव (eva, "indeed"), तु (tu, "but"),
 *     अपि (api, "also"), इति (iti, end-of-quote marker), वा (vā, "or")
 *   - Relative/demonstrative: यत् (yat), तत् (tat), एतत् (etat), इदम् (idam),
 *     किम् (kim, "what?"), कः (kaḥ, "who?")
 *   - Verbs: अस्ति (asti, "is"), भवति (bhavati, "becomes"), करोति (karoti)
 *   - Pronouns: अहम् (aham, "I"), त्वम् (tvam, "you")
 *   - High-frequency lexical: सर्व (sarva, "all"), धर्म (dharma), कर्म (karma),
 *     मोक्ष (mokṣa), ब्रह्म (brahman), आत्म (ātman stem), लोक (loka),
 *     देव (deva), नाम (nāma), पुण्य (puṇya)
 *
 * Threshold: ≥ SA_PILOT_THRESHOLD hits → classify as Sanskrit.
 */
const SA_PILOTS: ReadonlySet<string> = new Set([
  'च', 'एव', 'तु', 'अपि', 'इति', 'वा',
  'यत्', 'तत्', 'एतत्', 'इदम्', 'किम्', 'कः',
  'अस्ति', 'भवति', 'करोति', 'अस्तु', 'भवतु',
  'अहम्', 'त्वम्', 'वयम्', 'युयम्', 'तेषाम्',
  'सर्व', 'सर्वे', 'सर्वम्',
  'धर्म', 'धर्मः', 'धर्मम्', 'धर्मस्य',
  'कर्म', 'कर्मः', 'कर्मणि',
  'मोक्ष', 'मोक्षः',
  'ब्रह्म', 'ब्रह्मन्', 'ब्रह्मणः',
  'आत्म', 'आत्मन्', 'आत्मनः',
  'लोक', 'लोकः', 'लोकम्',
  'देव', 'देवः', 'देवानाम्',
  'नाम', 'नामः', 'नाम्नः',
  'पुण्य', 'पुण्यम्',
  'ज्ञान', 'ज्ञानम्', 'ज्ञानस्य',
  'वेद', 'वेदः', 'वेदानाम्',
  'श्लोक', 'श्लोकः',
]);

/** Minimum Sanskrit pilot hits to flip Devanagari detection from 'hi' to 'sa'. */
const SA_PILOT_THRESHOLD = 2;

/**
 * Stage 1.5 — given that Devanagari script was detected, attempt to
 * differentiate Sanskrit (sa) from Hindi (hi).
 *
 * Splits the text into whitespace-delimited tokens and counts matches
 * against SA_PILOTS. Returns 'sa' if threshold is met, 'hi' otherwise.
 *
 * Marathi (mr) and Nepali (ne) disambiguation is not implemented yet;
 * both fall back to 'hi' — acceptable given their far lower lyric corpus
 * frequency compared to hi/sa.
 *
 * @param text  Raw Devanagari text.
 * @returns     'sa' | 'hi'
 */
function disambiguateDevanagari(text: string): 'sa' | 'hi' {
  const tokens = text.split(/\s+/).filter(t => t.length > 0);
  let hits = 0;
  for (const token of tokens) {
    // Strip trailing Devanagari punctuation (daṇḍa ।, double daṇḍa ॥)
    const clean = token.replace(/[।॥]/g, '').trim();
    if (clean.length > 0 && SA_PILOTS.has(clean)) {
      hits++;
      if (hits >= SA_PILOT_THRESHOLD) return 'sa';
    }
  }
  return 'hi';
}

// ─── Stage 2: Word-Pilot Detector ──────────────────────────────────────────────────────────────

const WORD_PILOTS: Record<string, string[]> = {
  fr: [
    'je', 'tu', 'nous', 'vous', 'dans', 'avec', 'sur', 'cette',
    'mais', 'donc', 'quand', 'comme', 'très', 'plus', 'aussi',
    'pour', 'les', 'des', 'une', 'mon', 'ton', 'son', 'mes',
    'est', 'était', 'être', 'avoir', 'fait', 'dire', 'savoir',
    'toujours', 'jamais', 'encore', 'peut', 'tout',
  ],
  en: [
    'the', 'and', 'that', 'this', 'with', 'from', 'they', 'have',
    'been', 'will', 'would', 'could', 'should', 'their', 'there',
    'when', 'what', 'which', 'your', 'you',
  ],
  es: [
    'que', 'una', 'por', 'con', 'para', 'como', 'más',
    'todo', 'este', 'esta', 'tiene', 'cuando', 'desde', 'hasta',
    'porque', 'también', 'bien', 'entre', 'puede',
  ],
  it: [
    'che', 'una', 'per', 'con', 'sono', 'come', 'anche', 'tutto',
    'questo', 'questa', 'quando', 'perché', 'loro', 'bene', 'può',
    'siamo', 'vuole', 'sapere',
  ],
  // pt pilots are PT-exclusive vs es:
  //   não, você, lhe, mesmo, nossa, agora, ainda, embora, nunca, sempre,
  //   aqui, isso, algo, nada, teu, também, tudo, tenho — none in standard es.
  //   Shared tokens (que, por, uma, para, como, quando, porque) removed.
  pt: [
    'não', 'você', 'lhe', 'mesmo', 'nossa', 'agora', 'ainda',
    'embora', 'nunca', 'sempre', 'aqui', 'isso', 'algo', 'nada', 'teu',
    'são', 'está', 'esse', 'tudo', 'bem', 'mas',
    'também', 'tenho',
  ],
  de: [
    'der', 'die', 'das', 'und', 'ist', 'ein', 'eine', 'nicht',
    'mit', 'von', 'sich', 'auch', 'auf', 'bei', 'nach', 'war',
    'wird', 'ich', 'du', 'wir', 'ihr', 'sie',
  ],
  nl: [
    'het', 'een', 'niet', 'van', 'zijn', 'ook', 'dat', 'met',
    'voor', 'door', 'bij', 'maar', 'nog', 'wel', 'wordt',
  ],
  pl: [
    'się', 'nie', 'jest', 'jak', 'ale', 'czy', 'już', 'tak',
    'przez', 'jego', 'jej', 'ich', 'tego', 'tej', 'tym',
    'będzie', 'były', 'który', 'która', 'które', 'gdzie',
    'jestem', 'jesteś', 'mnie', 'tobie', 'sobie',
  ],
  ro: [
    'că', 'cu', 'din', 'este', 'sunt', 'mai', 'care', 'când',
    'dacă', 'unde', 'acum', 'doar', 'către', 'prin', 'între',
    'pentru', 'după', 'înainte', 'atunci', 'deci', 'astfel',
    'meu', 'tău', 'său', 'nostru', 'lor', 'ești', 'eram',
  ],
  sw: [
    'kwa', 'hii', 'hilo', 'hiyo', 'sana', 'pia', 'bali', 'lakini', 'kwamba',
    'hapo', 'bado', 'tena', 'wewe', 'yeye', 'wao', 'mimi', 'nini', 'lini',
    'wapi', 'pamoja', 'kati', 'mbele', 'nyuma', 'kabla', 'baada',
  ],
  yo: [
    'ti', 'ni', 'naa', 'ati', 'fun', 'lati', 'ojo', 'omo',
    'ilu', 'ile', 'agba', 'bı', 'àwa', 'jẹ',
  ],
  // ha: 'na' removed (shared with sw), 'da' removed (FR fragment noise).
  // Added: ina, son, yana, kyau, sosai — high-frequency Hausa words
  // absent from all other pilot lists.
  ha: [
    'ne', 'ce', 'kuma', 'amma', 'don', 'daga', 'cikin', 'gare',
    'sun', 'wuri', 'zuwa', 'dare', 'gida', 'kai', 'shi',
    'mun', 'kun', 'sai', 'har', 'tun', 'karo',
    'ina', 'son', 'yana', 'kyau', 'sosai',
  ],
  id: [
    'yang', 'dan', 'ini', 'itu', 'dari', 'dengan', 'untuk', 'tidak',
    'ada', 'juga', 'bisa', 'akan',
  ],
  ms: [
    'kerana', 'kepada', 'boleh', 'awak', 'sahaja', 'manakala',
    'walau', 'bahawa', 'mengikut', 'encik', 'puan', 'mereka',
    'ialah', 'iaitu', 'selain', 'semasa', 'daripada', 'sehingga',
  ],
  tr: [
    'bir', 'bu', 'ile', 'için', 'olan', 'ben', 'sen', 'biz',
    'gibi', 'değil', 'daha', 'çok',
  ],
  fi: [
    'on', 'ja', 'ei', 'en', 'olla', 'hän', 'se', 'tämä',
    'sitten', 'myös', 'kaikki', 'niin',
  ],
  hu: [
    'és', 'az', 'egy', 'nem', 'van', 'meg', 'már', 'csak',
    'hogy', 'mint', 'de', 'pedig',
  ],
  vi: [
    'và', 'của', 'có', 'là', 'cho', 'trong', 'đó', 'với',
    'được', 'không', 'này', 'một',
  ],
  ur: [
    'hai', 'mein', 'tera', 'yaar', 'dil', 'aaj', 'kya',
    'nahi', 'tujhe', 'pyar', 'mere', 'tere', 'hum', 'tum',
    'woh', 'kyun', 'bhi', 'abhi', 'kuch', 'phir',
  ],
  ba: [
    'blɔ', 'suə', 'nguɛ', 'yapi', 'kpli', 'ɛman', 'ɔko', 'dja',
    'gblo', 'kpan', 'wari', 'nzuɛ', 'sran', 'klɔ',
  ],
  ew: [
    'kple', 'hafi', 'megbe', 'nuɖoviwo', 'deke', 'eye', 'loo', 'nku',
    'ŋu', 'ame', 'dzo', 'xo', 'nɔ', 'ɖo', 'fia', 'gbɔ', 'ƒe',
  ],
  mi: [
    'bɔ', 'kɔ', 'lɔ', 'nyi', 'amaa',
    'ɖoo', 'kɔla', 'ŋɔ', 'wɔ', 'ƒu', 'tsɔ', 'nɔla', 'ɣe',
  ],
  di: [
    'bɛ', 'tun', 'mogo', 'kama', 'folo', 'minnu',
    'dɔ', 'bolo', 'sigi', 'tɛ', 'kɛ', 'nɔ', 'cɛ', 'fɛ',
  ],
  nou: [
    'gnaman', 'yako', 'warra', 'tchamba', 'blaka', 'sawa',
    'kpoto', 'gbrou', 'drogbo', 'mboki', 'ndoki', 'broki',
    'gnamankoudji', 'fottoh', 'kraka', 'yalla',
    'blèkè', 'gbèlè', 'tchèkè', 'lèlè',
  ],
  pcm: [
    'abeg', 'wahala', 'wetin', 'naija', 'palava', 'kasala',
    'katakata', 'yawa', 'gbege', 'oga',
    'waka', 'dey', 'bele', 'belle', 'pele',
  ],
  cfg: [
    'mboa', 'feymania', 'kanda', 'makossa', 'mbamba', 'ngola',
    'manawa', 'arnaka', 'bikutsi', 'gbaka',
    'nda', 'banganté', 'ndè',
    'mbenguiste', 'feyeur', 'couper', 'boulot', 'gbata',
  ],
};

/** Tokenise to lowercase words, stripping punctuation. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\s'-]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

/**
 * Score each candidate language against the token list.
 * Returns the language with the highest score, or undefined if no signal.
 */
function detectByWordPilots(tokens: string[]): string | undefined {
  const tokenSet = new Set(tokens);
  const scores: Record<string, number> = {};

  for (const [lang, pilots] of Object.entries(WORD_PILOTS)) {
    let score = 0;
    for (const pilot of pilots) {
      if (tokenSet.has(pilot)) score += 2;
    }
    if (score > 0) scores[lang] = score;
  }

  if (Object.keys(scores).length === 0) return undefined;

  // Sort by score descending; DEFAULT_LANG wins ties
  const sorted = Object.entries(scores).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0] === DEFAULT_LANG ? -1 : 1;
  });

  return sorted[0]![0];
}

// ─── Public API ───────────────────────────────────────────────────────────────────

export function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) return DEFAULT_LANG;

  const byScript = detectByScript(text);
  if (byScript) {
    // Stage 1.5: disambiguate Devanagari before returning
    if (byScript === 'hi') return disambiguateDevanagari(text);
    return byScript;
  }

  const tokens = tokenize(text);
  if (tokens.length < MIN_TOKENS) return DEFAULT_LANG;

  return detectByWordPilots(tokens) ?? DEFAULT_LANG;
}

export function resolveLang(text: string, lang: string): string {
  return lang === 'auto' ? detectLanguage(text) : lang;
}
