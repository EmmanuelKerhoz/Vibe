"""
G2P Phonemization Microservice for Lyricist Pro
FastAPI implementation with epitran for proper IPA conversion

v4.5 — Remediation Étape C:
  - rhyme_scheme_detector wired: /api/scheme
  - Accepts a block of N verses, returns AABB/ABAB/ABBA/ABCB/AAAA/ABCC
  - Scorer: morpheme embedding (if available) else Levenshtein on RN

v4.4 — /api/analyze (verse_segmenter + lid_span_router)
v4.3 — morpho_strip + /api/score
v4.2 — C2/C3/C4/C5 corrections
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal
from enum import Enum
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import epitran
    EPITRAN_AVAILABLE = True
except ImportError:
    EPITRAN_AVAILABLE = False
    logger.warning("epitran not available - using fallback mode")

# ─── Remediation modules ──────────────────────────────────────────────────────
try:
    from rhyme.morpho_strip import strip_before_rn_extraction
    MORPHO_STRIP_AVAILABLE = True
except ImportError:
    MORPHO_STRIP_AVAILABLE = False
    logger.warning("morpho_strip not available")

try:
    from rhyme.phoneme_embedding import score_embedding, EmbeddingScore
    PHONEME_EMBEDDING_AVAILABLE = True
except ImportError:
    PHONEME_EMBEDDING_AVAILABLE = False
    logger.warning("phoneme_embedding not available")

try:
    from rhyme.verse_segmenter import segment_verse, RhymingUnit, SegmentMode
    VERSE_SEGMENTER_AVAILABLE = True
except ImportError:
    VERSE_SEGMENTER_AVAILABLE = False
    logger.warning("verse_segmenter not available")

try:
    from rhyme.lid_span_router import detect_spans, LangSpan
    LID_ROUTER_AVAILABLE = True
except ImportError:
    LID_ROUTER_AVAILABLE = False
    logger.warning("lid_span_router not available")

try:
    from rhyme.rhyme_scheme_detector import detect_scheme, SchemeResult
    SCHEME_DETECTOR_AVAILABLE = True
except ImportError:
    SCHEME_DETECTOR_AVAILABLE = False
    logger.warning("rhyme_scheme_detector not available")

app = FastAPI(title="G2P Phonemization Service", version="1.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Language families ────────────────────────────────────────────────────────

class AlgoFamily(str, Enum):
    ALGO_ROM  = "ALGO-ROM"
    ALGO_GER  = "ALGO-GER"
    ALGO_SLV  = "ALGO-SLV"
    ALGO_SEM  = "ALGO-SEM"
    ALGO_SIN  = "ALGO-SIN"
    ALGO_JAP  = "ALGO-JAP"
    ALGO_KOR  = "ALGO-KOR"
    ALGO_BNT  = "ALGO-BNT"
    ALGO_KWA  = "ALGO-KWA"
    ALGO_CRV  = "ALGO-CRV"
    ALGO_IIR  = "ALGO-IIR"
    ALGO_DRV  = "ALGO-DRV"
    ALGO_TRK  = "ALGO-TRK"
    ALGO_FIN  = "ALGO-FIN"
    ALGO_TAI  = "ALGO-TAI"
    ALGO_VIET = "ALGO-VIET"
    ALGO_AUS  = "ALGO-AUS"


LANG_TO_FAMILY: Dict[str, AlgoFamily] = {
    'fr': AlgoFamily.ALGO_ROM, 'es': AlgoFamily.ALGO_ROM,
    'it': AlgoFamily.ALGO_ROM, 'pt': AlgoFamily.ALGO_ROM,
    'ro': AlgoFamily.ALGO_ROM, 'ca': AlgoFamily.ALGO_ROM,
    'en': AlgoFamily.ALGO_GER, 'de': AlgoFamily.ALGO_GER,
    'nl': AlgoFamily.ALGO_GER, 'sv': AlgoFamily.ALGO_GER,
    'da': AlgoFamily.ALGO_GER, 'no': AlgoFamily.ALGO_GER,
    'bci': AlgoFamily.ALGO_KWA, 'dyu': AlgoFamily.ALGO_KWA,
    'ee':  AlgoFamily.ALGO_KWA, 'gej': AlgoFamily.ALGO_KWA,
    'bkv': AlgoFamily.ALGO_CRV, 'ijn': AlgoFamily.ALGO_CRV,
    'iko': AlgoFamily.ALGO_CRV, 'ha':  AlgoFamily.ALGO_CRV,
    'ru': AlgoFamily.ALGO_SLV, 'pl': AlgoFamily.ALGO_SLV,
    'uk': AlgoFamily.ALGO_SLV, 'cs': AlgoFamily.ALGO_SLV,
    'ar': AlgoFamily.ALGO_SEM, 'he': AlgoFamily.ALGO_SEM,
    'zh': AlgoFamily.ALGO_SIN,
    'ja': AlgoFamily.ALGO_JAP,
    'ko': AlgoFamily.ALGO_KOR,
    'hi': AlgoFamily.ALGO_IIR, 'ur': AlgoFamily.ALGO_IIR,
    'ta': AlgoFamily.ALGO_DRV, 'te': AlgoFamily.ALGO_DRV,
    'tr': AlgoFamily.ALGO_TRK,
    'fi': AlgoFamily.ALGO_FIN,
    'th': AlgoFamily.ALGO_TAI,
    'vi': AlgoFamily.ALGO_VIET,
}

_MORPHO_STRIP_FAMILIES = {
    AlgoFamily.ALGO_BNT, AlgoFamily.ALGO_TRK,
    AlgoFamily.ALGO_DRV, AlgoFamily.ALGO_FIN, AlgoFamily.ALGO_IIR,
}

_EMBEDDING_PRIORITY_FAMILIES = {
    AlgoFamily.ALGO_KWA, AlgoFamily.ALGO_CRV,
    AlgoFamily.ALGO_SIN, AlgoFamily.ALGO_TAI, AlgoFamily.ALGO_VIET,
}


# ─── G2P Backend Registry ─────────────────────────────────────────────────────

G2P_REGISTRY: Dict[str, Dict[str, str]] = {
    'fr':  {'backend': 'epitran', 'epitran_code': 'fra-Latn', 'confidence': 'high'},
    'es':  {'backend': 'epitran', 'epitran_code': 'spa-Latn', 'confidence': 'high'},
    'it':  {'backend': 'epitran', 'epitran_code': 'ita-Latn', 'confidence': 'high'},
    'pt':  {'backend': 'epitran', 'epitran_code': 'por-Latn', 'confidence': 'high'},
    'de':  {'backend': 'epitran', 'epitran_code': 'deu-Latn', 'confidence': 'high'},
    'en':  {'backend': 'epitran', 'epitran_code': 'eng-Latn', 'confidence': 'high'},
    'ru':  {'backend': 'epitran', 'epitran_code': 'rus-Cyrl', 'confidence': 'high'},
    'ar':  {'backend': 'epitran', 'epitran_code': 'ara-Arab', 'confidence': 'high'},
    'zh':  {'backend': 'epitran', 'epitran_code': 'cmn-Hans', 'confidence': 'high'},
    'ja':  {'backend': 'epitran', 'epitran_code': 'jpn-Hira', 'confidence': 'high'},
    'ko':  {'backend': 'epitran', 'epitran_code': 'kor-Hang', 'confidence': 'high'},
    'hi':  {'backend': 'epitran', 'epitran_code': 'hin-Deva', 'confidence': 'high'},
    'tr':  {'backend': 'epitran', 'epitran_code': 'tur-Latn', 'confidence': 'high'},
    'vi':  {'backend': 'epitran', 'epitran_code': 'vie-Latn', 'confidence': 'high'},
    'bci': {'backend': 'rules_cv_tonal', 'epitran_code': None, 'confidence': 'rules'},
    'dyu': {'backend': 'rules_cv_tonal', 'epitran_code': None, 'confidence': 'rules'},
    'ee':  {'backend': 'rules_cv_tonal', 'epitran_code': None, 'confidence': 'rules'},
    'gej': {'backend': 'rules_cv_tonal', 'epitran_code': None, 'confidence': 'rules'},
    'bkv': {'backend': 'byt5_bytelevel',  'epitran_code': None, 'confidence': 'low'},
    'ijn': {'backend': 'byt5_bytelevel',  'epitran_code': None, 'confidence': 'low'},
    'iko': {'backend': 'byt5_bytelevel',  'epitran_code': None, 'confidence': 'low'},
    'ha':  {'backend': 'epitran',         'epitran_code': 'hau-Latn', 'confidence': 'medium'},
}

G2pConfidence = Literal["high", "medium", "rules", "low"]
FallbackReason = Literal["low_resource_g2p", "low_resource_g2p_rules_only", "unknown_language", None]

_epitran_cache: Dict[str, Any] = {}


def get_epitran(lang_code: str) -> Optional[Any]:
    if not EPITRAN_AVAILABLE:
        return None
    entry = G2P_REGISTRY.get(lang_code, {})
    epitran_code = entry.get('epitran_code')
    if not epitran_code:
        return None
    if epitran_code not in _epitran_cache:
        try:
            _epitran_cache[epitran_code] = epitran.Epitran(epitran_code)
        except Exception as e:
            logger.error(f"Failed to create epitran for {epitran_code}: {e}")
            return None
    return _epitran_cache[epitran_code]


# ─── Tone normalisation (C4) ─────────────────────────────────────────────────────
TONE_CONTOUR_POLICY = "initial_dominant"
_TONE_TO_BINARY: Dict[str, str] = {
    'H': 'H', 'MH': 'H', 'L': 'L', 'M': 'L', 'ML': 'L',
    'HL': 'H', 'HML': 'H', 'LH': 'L', 'LHL': 'L',
}

def normalize_tone(raw_tone: Optional[str]) -> Optional[str]:
    if raw_tone is None:
        return None
    return _TONE_TO_BINARY.get(raw_tone.upper(), raw_tone)


# ─── Rhyme classification (C3) ──────────────────────────────────────────────────
RHYME_THRESHOLD_RICH       = 0.95
RHYME_THRESHOLD_SUFFICIENT = 0.85
RHYME_THRESHOLD_ASSONANCE  = 0.75
RHYME_THRESHOLD_WEAK       = 0.40

def _categorize(score: float) -> str:
    if score >= RHYME_THRESHOLD_RICH:       return "rich"
    if score >= RHYME_THRESHOLD_SUFFICIENT: return "sufficient"
    if score >= RHYME_THRESHOLD_ASSONANCE:  return "assonance"
    if score >= RHYME_THRESHOLD_WEAK:       return "weak"
    return "none"


# ─── Sₖ identification (C2) ─────────────────────────────────────────────────────
FAMILY_ACCENT_POLICY: Dict[AlgoFamily, str] = {
    AlgoFamily.ALGO_ROM: "final",   AlgoFamily.ALGO_TRK: "final",
    AlgoFamily.ALGO_KOR: "final",   AlgoFamily.ALGO_VIET: "final",
    AlgoFamily.ALGO_TAI: "final",   AlgoFamily.ALGO_FIN: "initial",
    AlgoFamily.ALGO_AUS: "initial", AlgoFamily.ALGO_SLV: "mobile",
    AlgoFamily.ALGO_IIR: "mobile",  AlgoFamily.ALGO_GER: "mobile",
    AlgoFamily.ALGO_SEM: "mobile",  AlgoFamily.ALGO_JAP: "mora",
    AlgoFamily.ALGO_SIN: "mora",    AlgoFamily.ALGO_KWA: "tonal_last",
    AlgoFamily.ALGO_CRV: "tonal_last", AlgoFamily.ALGO_BNT: "tonal_last",
    AlgoFamily.ALGO_DRV: "final",
}
SCHWA_PATTERN = re.compile(r'^[əɨ]+$')


def find_stressed_syllable_index(syllables: List['SyllableModel'], family: AlgoFamily) -> int:
    if not syllables:
        return -1
    policy = FAMILY_ACCENT_POLICY.get(family, "final")
    if policy == "initial":
        return 0
    if policy in ("mora", "tonal_last"):
        return len(syllables) - 1
    if policy == "final":
        for i in range(len(syllables) - 1, -1, -1):
            if not SCHWA_PATTERN.match(syllables[i].nucleus or ""):
                return i
        return len(syllables) - 1
    return len(syllables) - 1


# ─── Pydantic models ───────────────────────────────────────────────────────────

class SyllableModel(BaseModel):
    onset:   str
    nucleus: str
    coda:    str
    tone:    Optional[str] = None
    stress:  bool = False


class PhonemizeRequest(BaseModel):
    text: str
    lang: str


class PhonemizeResponse(BaseModel):
    algo_id:              str
    lang:                 str
    input:                str
    ipa:                  str
    syllables:            List[SyllableModel]
    rhyme_nucleus:        str
    rhyme_type:           Optional[str]            = None
    similarity_method:    str                      = "feature_weighted_levenshtein"
    method:               str
    low_resource:         bool
    fallback_used:        bool                     = False
    fallback_reason:      Optional[str]            = None
    g2p_confidence:       str                      = "high"
    morpho_strip_applied: bool                     = False
    morpho_strip_detail:  Optional[Dict[str, Any]] = None
    metadata:             Dict[str, Any]           = {}


class ScoreRequest(BaseModel):
    rn1:  str
    rn2:  str
    lang: str


class ScoreResponse(BaseModel):
    rn1:              str
    rn2:              str
    lang:             str
    algo_id:          str
    score:            float
    rhyme_type:       str
    method:           str            = "phoneme_embedding_phoible_lite"
    embedding_method: str            = "phoible_lite_dim5"
    tonal_match:      Optional[bool] = None
    detail:           Dict[str, Any] = {}


class AnalyzeRequest(BaseModel):
    verse:       str
    lang:        str
    mode:        str = "end"
    verse_index: int = 0


class SpanPhonemization(BaseModel):
    span_text:            str
    span_lang:            str
    span_family:          str
    span_position:        str
    token_span:           List[int]
    low_resource:         bool
    lid_confidence:       float
    ipa:                  str
    syllables:            List[SyllableModel]
    rhyme_nucleus:        str
    g2p_method:           str
    g2p_confidence:       str
    morpho_strip_applied: bool                     = False
    morpho_strip_detail:  Optional[Dict[str, Any]] = None


class AnalyzeResponse(BaseModel):
    verse:                str
    lang:                 str
    mode:                 str
    verse_index:          int
    spans:                List[SpanPhonemization]
    end_nuclei:           List[str]
    lid_used:             bool
    segmenter_available:  bool
    lid_router_available: bool


class SchemeRequest(BaseModel):
    """Request for /api/scheme — rhyme scheme detection on a verse block.

    verses:    List of verse strings (full lines or end-tokens).
    lang:      Language code (applied to all verses; mixed-lang to be handled by /api/analyze).
    threshold: Minimum similarity score to consider two verses rhyming (default 0.75).
    use_rn:    When True (default), extract rhyme nuclei via full pipeline before scoring.
               When False, score raw verse strings directly (faster, less accurate).
    """
    verses:    List[str]
    lang:      str
    threshold: float = 0.75
    use_rn:    bool  = True


class SchemePair(BaseModel):
    i:     int
    j:     int
    score: float
    rhyme_type: str


class SchemeResponse(BaseModel):
    """Response from /api/scheme."""
    verses:       List[str]
    lang:         str
    scheme:       str               # e.g. 'AABB', 'ABAB', 'ABBA', 'ABCB', 'AAAA', 'ABCC'
    confidence:   float
    labels:       List[str]         # e.g. ['A','B','A','B']
    pairs:        List[SchemePair]  # all pairs above threshold
    nuclei:       List[str]         # RN extracted per verse (empty if use_rn=False)
    scorer_used:  str               # 'embedding' | 'levenshtein_rn' | 'levenshtein_raw'
    scheme_detector_available: bool


# ─── Internal helpers ───────────────────────────────────────────────────────────

def _g2p_kwa_rules(text: str, lang: str) -> str:
    cleaned = text.lower().strip()
    tone_map = str.maketrans({'á': 'a\u0301', 'é': 'e\u0301', 'í': 'i\u0301',
                               'ó': 'o\u0301', 'ú': 'u\u0301',
                               'à': 'a\u0300', 'è': 'e\u0300', 'ì': 'i\u0300',
                               'ò': 'o\u0300', 'ù': 'u\u0300'})
    return f"/{cleaned.translate(tone_map)}/"


def graphemic_fallback_g2p(text: str, family: AlgoFamily) -> str:
    return f"/{text.lower().strip()}/"


def simple_syllabify(ipa: str, family: AlgoFamily) -> List[SyllableModel]:
    ipa_clean = ipa.strip('/[]')
    vowel_pattern = r'[aeiouæɑɔɛɪʊəɨʉɯyøɐɵœʌ]'
    parts = re.split(f'({vowel_pattern}+)', ipa_clean)
    syllables: List[SyllableModel] = []
    current: Dict[str, str] = {"onset": "", "nucleus": "", "coda": ""}
    for part in parts:
        if not part:
            continue
        if re.match(vowel_pattern, part):
            current["nucleus"] = part
        elif not current["nucleus"]:
            current["onset"] += part
        else:
            current["coda"] += part
            if current["nucleus"]:
                syllables.append(SyllableModel(**current))
            current = {"onset": "", "nucleus": "", "coda": ""}
    if current["nucleus"]:
        syllables.append(SyllableModel(**current))
    return syllables


def _run_g2p(
    text: str, lang_code: str, family: AlgoFamily
) -> tuple[str, str, bool, bool, Optional[str], str, Dict]:
    reg = G2P_REGISTRY.get(lang_code, {})
    backend = reg.get('backend', 'graphemic_fallback')
    g2p_confidence: str = reg.get('confidence', 'low')
    ipa_text: Optional[str] = None
    method = "graphemic_fallback"
    low_resource = True
    fallback_used = False
    fallback_reason: Optional[str] = None
    metadata: Dict[str, Any] = {}

    if backend == 'epitran' and EPITRAN_AVAILABLE:
        epi = get_epitran(lang_code)
        if epi:
            try:
                ipa_text     = epi.transliterate(text)
                method       = "epitran"
                low_resource = False
                metadata['epitran_code'] = reg.get('epitran_code')
            except Exception as e:
                logger.warning(f"Epitran failed for {lang_code}: {e}")
    elif backend == 'rules_cv_tonal':
        ipa_text       = _g2p_kwa_rules(text, lang_code)
        method         = "rules_cv_tonal"
        low_resource   = True
        metadata['tone_contour_policy'] = TONE_CONTOUR_POLICY
    elif backend == 'byt5_bytelevel':
        ipa_text       = graphemic_fallback_g2p(text, family)
        method         = "graphemic_fallback"
        low_resource   = True
        fallback_used  = True
        fallback_reason = "low_resource_g2p"
        g2p_confidence  = "low"
        metadata['note'] = "ByT5-G2P not yet wired"

    if ipa_text is None:
        ipa_text = graphemic_fallback_g2p(text, family)
        method   = "graphemic_fallback"
        low_resource    = True
        fallback_used   = True
        fallback_reason = "unknown_language" if lang_code not in LANG_TO_FAMILY else "low_resource_g2p"
        g2p_confidence  = "low"

    return ipa_text, method, low_resource, fallback_used, fallback_reason, g2p_confidence, metadata


def extract_rhyme_nucleus(
    syllables: List[SyllableModel], family: AlgoFamily, lang: str,
) -> tuple[str, bool, Optional[Dict[str, Any]]]:
    if not syllables:
        return "", False, None
    idx = find_stressed_syllable_index(syllables, family)
    if idx < 0:
        return "", False, None
    syll = syllables[idx]
    morpho_applied = False
    morpho_detail: Optional[Dict[str, Any]] = None

    if MORPHO_STRIP_AVAILABLE and family in _MORPHO_STRIP_FAMILIES:
        token_ipa = syll.onset + syll.nucleus + syll.coda
        if token_ipa.strip():
            try:
                result = strip_before_rn_extraction(token_ipa, lang)
                stripped = result.get("stripped_ipa", token_ipa)
                if stripped != token_ipa:
                    morpho_applied = True
                    morpho_detail  = result
                    new_sylls = simple_syllabify(f"/{stripped}/", family)
                    if new_sylls:
                        syll = new_sylls[-1]
            except Exception as e:
                logger.warning(f"morpho_strip failed for {lang}: {e}")

    if family in (AlgoFamily.ALGO_KWA, AlgoFamily.ALGO_BNT):
        rn = syll.nucleus
        if syll.tone:
            rn += normalize_tone(syll.tone) or syll.tone
        return rn, morpho_applied, morpho_detail
    if family == AlgoFamily.ALGO_CRV:
        rn = syll.nucleus
        if syll.tone:
            rn += normalize_tone(syll.tone) or syll.tone
        rn += syll.coda
        return rn, morpho_applied, morpho_detail
    return syll.nucleus + syll.coda, morpho_applied, morpho_detail


def _phonemize_span(
    text: str, lang_code: str, family: AlgoFamily
) -> tuple[str, List[SyllableModel], str, str, str, bool, Optional[Dict]]:
    ipa, method, _, _, _, g2p_conf, _ = _run_g2p(text, lang_code, family)
    syllables = simple_syllabify(ipa, family)
    rn, morpho_applied, morpho_detail = extract_rhyme_nucleus(syllables, family, lang_code)
    return ipa, syllables, rn, method, g2p_conf, morpho_applied, morpho_detail


def _extract_end_rn(verse_text: str, lang_code: str) -> str:
    """Extract end RN from a verse string (used by /api/scheme scorer)."""
    family = LANG_TO_FAMILY.get(lang_code, AlgoFamily.ALGO_ROM)
    # Take last token as the rhyming word
    tokens = verse_text.strip().split()
    end_token = tokens[-1] if tokens else verse_text
    ipa, method, *_ = _run_g2p(end_token, lang_code, family)
    syllables = simple_syllabify(ipa, family)
    rn, _, _ = extract_rhyme_nucleus(syllables, family, lang_code)
    return rn or end_token


def _levenshtein_similarity(a: str, b: str) -> float:
    """Normalised Levenshtein similarity in [0, 1]."""
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    la, lb = len(a), len(b)
    dp = list(range(lb + 1))
    for i, ca in enumerate(a, 1):
        prev = dp.copy()
        dp[0] = i
        for j, cb in enumerate(b, 1):
            dp[j] = min(dp[j] + 1, dp[j - 1] + 1, prev[j - 1] + (0 if ca == cb else 1))
    return 1.0 - dp[lb] / max(la, lb)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status":  "healthy",
        "version": "1.5.0",
        "epitran_available":            EPITRAN_AVAILABLE,
        "morpho_strip_available":       MORPHO_STRIP_AVAILABLE,
        "phoneme_embedding_available":  PHONEME_EMBEDDING_AVAILABLE,
        "verse_segmenter_available":    VERSE_SEGMENTER_AVAILABLE,
        "lid_router_available":         LID_ROUTER_AVAILABLE,
        "scheme_detector_available":    SCHEME_DETECTOR_AVAILABLE,
    }


@app.get("/api/health")
async def api_health_check():
    return {
        "status":  "healthy",
        "version": "1.5.0",
        "epitran_available":            EPITRAN_AVAILABLE,
        "morpho_strip_available":       MORPHO_STRIP_AVAILABLE,
        "phoneme_embedding_available":  PHONEME_EMBEDDING_AVAILABLE,
        "verse_segmenter_available":    VERSE_SEGMENTER_AVAILABLE,
        "lid_router_available":         LID_ROUTER_AVAILABLE,
        "scheme_detector_available":    SCHEME_DETECTOR_AVAILABLE,
    }


@app.post("/api/phonemize", response_model=PhonemizeResponse)
async def phonemize(request: PhonemizeRequest) -> PhonemizeResponse:
    """Single token/word phonemization."""
    try:
        lang_code = request.lang.lower()
        text = request.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Empty text provided")
        family = LANG_TO_FAMILY.get(lang_code, AlgoFamily.ALGO_ROM)
        ipa, method, low_resource, fallback_used, fallback_reason, g2p_confidence, metadata = \
            _run_g2p(text, lang_code, family)
        syllables = simple_syllabify(ipa, family)
        rhyme_nucleus, morpho_applied, morpho_detail = extract_rhyme_nucleus(syllables, family, lang_code)
        return PhonemizeResponse(
            algo_id=family.value, lang=lang_code, input=text, ipa=ipa,
            syllables=syllables, rhyme_nucleus=rhyme_nucleus, rhyme_type=None,
            method=method, low_resource=low_resource, fallback_used=fallback_used,
            fallback_reason=fallback_reason, g2p_confidence=g2p_confidence,
            morpho_strip_applied=morpho_applied, morpho_strip_detail=morpho_detail,
            metadata=metadata,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Phonemization error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Phonemization failed: {str(e)}")


@app.post("/api/score", response_model=ScoreResponse)
async def score_rhymes(request: ScoreRequest) -> ScoreResponse:
    """Phoneme embedding similarity — niveau 4 scoring."""
    if not PHONEME_EMBEDDING_AVAILABLE:
        raise HTTPException(status_code=503, detail="phoneme_embedding module not available")
    lang_code = request.lang.lower()
    family    = LANG_TO_FAMILY.get(lang_code, AlgoFamily.ALGO_ROM)
    def _to_phones(s: str) -> List[str]:
        phones = s.split()
        return phones if len(phones) > 1 else list(s)
    try:
        result: EmbeddingScore = score_embedding(_to_phones(request.rn1), _to_phones(request.rn2))
    except Exception as e:
        logger.error(f"phoneme_embedding error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Embedding scoring failed: {str(e)}")
    score = result.score
    tonal_match: Optional[bool] = None
    if family in _EMBEDDING_PRIORITY_FAMILIES:
        tonal_re = re.compile(r'[HL˥˦˧˨˩\u0301\u0300\u0302\u0304\u030c]')
        t1, t2 = tonal_re.findall(request.rn1), tonal_re.findall(request.rn2)
        tonal_match = (t1 == t2) if (t1 or t2) else None
    return ScoreResponse(
        rn1=request.rn1, rn2=request.rn2, lang=lang_code,
        algo_id=family.value, score=score, rhyme_type=_categorize(score),
        tonal_match=tonal_match,
        detail=result.detail if hasattr(result, 'detail') else {},
    )


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_verse(request: AnalyzeRequest) -> AnalyzeResponse:
    """Full verse analysis — lid_span_router + verse_segmenter + G2P + morpho_strip."""
    try:
        lang_code   = request.lang.lower()
        verse       = request.verse.strip()
        mode        = request.mode
        verse_index = request.verse_index
        if not verse:
            raise HTTPException(status_code=400, detail="Empty verse")
        if mode not in ("end", "internal", "all"):
            raise HTTPException(status_code=400, detail=f"Invalid mode '{mode}'.")

        lid_used = LID_ROUTER_AVAILABLE
        if LID_ROUTER_AVAILABLE:
            lang_spans: List[LangSpan] = detect_spans(verse, doc_lang=lang_code, lid_predictor=None)
        else:
            lang_spans = [type('_S', (), {
                'text': verse, 'lang': lang_code,
                'family': LANG_TO_FAMILY.get(lang_code, AlgoFamily.ALGO_ROM).value,
                'confidence': 1.0, 'start': 0, 'end': len(verse.split()),
                'low_resource': False,
            })()]

        result_spans: List[SpanPhonemization] = []
        for ls in lang_spans:
            span_lang   = ls.lang
            span_family = LANG_TO_FAMILY.get(span_lang, AlgoFamily.ALGO_ROM)
            if VERSE_SEGMENTER_AVAILABLE:
                units: List[RhymingUnit] = segment_verse(ls.text, lang=span_lang, mode=mode, verse_index=verse_index)
            else:
                units = [type('_U', (), {
                    'tokens': ls.text.split(), 'position': 'end',
                    'verse_index': verse_index, 'token_span': (0, len(ls.text.split())),
                })()]
            for unit in units:
                unit_text = " ".join(unit.tokens)
                if not unit_text.strip():
                    continue
                ipa, syllables, rn, g2p_method, g2p_conf, morpho_applied, morpho_detail = \
                    _phonemize_span(unit_text, span_lang, span_family)
                result_spans.append(SpanPhonemization(
                    span_text=unit_text, span_lang=span_lang, span_family=span_family.value,
                    span_position=unit.position, token_span=list(unit.token_span),
                    low_resource=ls.low_resource, lid_confidence=ls.confidence,
                    ipa=ipa, syllables=syllables, rhyme_nucleus=rn,
                    g2p_method=g2p_method, g2p_confidence=g2p_conf,
                    morpho_strip_applied=morpho_applied, morpho_strip_detail=morpho_detail,
                ))

        return AnalyzeResponse(
            verse=verse, lang=lang_code, mode=mode, verse_index=verse_index,
            spans=result_spans,
            end_nuclei=[sp.rhyme_nucleus for sp in result_spans if sp.span_position == "end"],
            lid_used=lid_used,
            segmenter_available=VERSE_SEGMENTER_AVAILABLE,
            lid_router_available=LID_ROUTER_AVAILABLE,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"analyze_verse error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Verse analysis failed: {str(e)}")


@app.post("/api/scheme", response_model=SchemeResponse)
async def detect_rhyme_scheme(request: SchemeRequest) -> SchemeResponse:
    """Rhyme scheme detection on a verse block — Étape C.

    Scorer priority:
      1. phoneme_embedding (if available): cosine on PHOIBLE-lite RN vectors
      2. levenshtein_rn: normalised Levenshtein on extracted RN strings
      3. levenshtein_raw: normalised Levenshtein on raw verse strings (use_rn=False)

    Returns scheme (AABB/ABAB/ABBA/ABCB/AAAA/ABCC), confidence, labels, pairs.
    """
    try:
        lang_code = request.lang.lower()
        verses    = [v.strip() for v in request.verses if v.strip()]

        if len(verses) < 2:
            raise HTTPException(status_code=400, detail="At least 2 non-empty verses required.")
        if len(verses) > 16:
            raise HTTPException(status_code=400, detail="Maximum 16 verses per request.")

        # ── Extract RN per verse (or use raw strings) ─────────────────────────────
        if request.use_rn:
            scoring_tokens = [_extract_end_rn(v, lang_code) for v in verses]
            scorer_used    = "levenshtein_rn"
        else:
            scoring_tokens = verses
            scorer_used    = "levenshtein_raw"

        # ── Build scorer function ──────────────────────────────────────────────
        family = LANG_TO_FAMILY.get(lang_code, AlgoFamily.ALGO_ROM)

        if PHONEME_EMBEDDING_AVAILABLE and request.use_rn:
            def _scorer(t1: str, t2: str, _lang: str) -> float:
                phones1 = t1.split() if len(t1.split()) > 1 else list(t1)
                phones2 = t2.split() if len(t2.split()) > 1 else list(t2)
                try:
                    res = score_embedding(phones1, phones2)
                    return res.score
                except Exception:
                    return _levenshtein_similarity(t1, t2)
            scorer_used = "embedding"
        else:
            def _scorer(t1: str, t2: str, _lang: str) -> float:
                return _levenshtein_similarity(t1, t2)

        # ── Detect scheme ────────────────────────────────────────────────────────
        if SCHEME_DETECTOR_AVAILABLE:
            result: SchemeResult = detect_scheme(
                scoring_tokens,
                scorer=_scorer,
                lang=lang_code,
                threshold=request.threshold,
            )
            scheme     = result.scheme
            confidence = result.confidence
            labels     = result.labels
            raw_pairs  = result.pairs
        else:
            # Inline minimal fallback: build labels + scheme from scorer directly
            n = len(scoring_tokens)
            matrix: Dict[tuple, float] = {}
            for i in range(n):
                for j in range(i + 1, n):
                    matrix[(i, j)] = _scorer(scoring_tokens[i], scoring_tokens[j], lang_code)

            labels_list = ["?"] * n
            code = ord("A")
            for i in range(n):
                if labels_list[i] != "?":
                    continue
                labels_list[i] = chr(code)
                for j in range(i + 1, n):
                    if labels_list[j] == "?" and matrix.get((i, j), 0.0) >= request.threshold:
                        labels_list[j] = chr(code)
                code += 1

            scheme     = "".join(labels_list[:4])
            confidence = sum(matrix.values()) / max(len(matrix), 1)
            labels     = labels_list
            raw_pairs  = [(i, j, s) for (i, j), s in matrix.items() if s >= request.threshold]

        pairs_out = [
            SchemePair(i=i, j=j, score=round(s, 4), rhyme_type=_categorize(s))
            for (i, j, s) in raw_pairs
        ]

        return SchemeResponse(
            verses    = verses,
            lang      = lang_code,
            scheme    = scheme,
            confidence = round(confidence, 4),
            labels    = labels,
            pairs     = pairs_out,
            nuclei    = scoring_tokens if request.use_rn else [],
            scorer_used = scorer_used,
            scheme_detector_available = SCHEME_DETECTOR_AVAILABLE,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"detect_rhyme_scheme error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scheme detection failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
