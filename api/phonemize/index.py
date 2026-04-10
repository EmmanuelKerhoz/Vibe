"""
G2P Phonemization Microservice for Lyricist Pro
FastAPI implementation with epitran for proper IPA conversion

v4.3 — Remediation wiring:
  - morpho_strip integrated into extract_rhyme_nucleus() pipeline
  - phoneme_embedding wired as scoring layer (niveau 4)
  - New endpoint POST /api/score → EmbeddingScoreResponse
  - verse_segmenter + lid_span_router available (Étape B)

v4.2 corrections applied (SPEC_CORRECTIONS_v4.2.md):
  C2 — Définition normative de Sₖ : accent prosodique par famille
  C3 — Hiérarchie des seuils corrigée (plage morte supprimée)
  C4 — ALGO-KWA : politique initial_dominant pour contours tonaux
  C5 — Schéma JSON : fallback_used, fallback_reason, g2p_confidence
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
    logger.info("epitran loaded successfully")
except ImportError:
    EPITRAN_AVAILABLE = False
    logger.warning("epitran not available - using fallback mode")

# ─── Remediation modules ──────────────────────────────────────────────────────
try:
    from rhyme.morpho_strip import strip_before_rn_extraction
    MORPHO_STRIP_AVAILABLE = True
    logger.info("morpho_strip loaded")
except ImportError:
    MORPHO_STRIP_AVAILABLE = False
    logger.warning("morpho_strip not available — skipping affix stripping")

try:
    from rhyme.phoneme_embedding import score_embedding, EmbeddingScore
    PHONEME_EMBEDDING_AVAILABLE = True
    logger.info("phoneme_embedding loaded")
except ImportError:
    PHONEME_EMBEDDING_AVAILABLE = False
    logger.warning("phoneme_embedding not available — /api/score will return 503")

app = FastAPI(title="G2P Phonemization Service", version="1.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Language families ────────────────────────────────────────────────────────

class AlgoFamily(str, Enum):
    """Language family identifiers matching TypeScript constants"""
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
    # Romance
    'fr': AlgoFamily.ALGO_ROM, 'es': AlgoFamily.ALGO_ROM,
    'it': AlgoFamily.ALGO_ROM, 'pt': AlgoFamily.ALGO_ROM,
    'ro': AlgoFamily.ALGO_ROM, 'ca': AlgoFamily.ALGO_ROM,
    # Germanic
    'en': AlgoFamily.ALGO_GER, 'de': AlgoFamily.ALGO_GER,
    'nl': AlgoFamily.ALGO_GER, 'sv': AlgoFamily.ALGO_GER,
    'da': AlgoFamily.ALGO_GER, 'no': AlgoFamily.ALGO_GER,
    # Kwa
    'bci': AlgoFamily.ALGO_KWA,  # Baoulé
    'dyu': AlgoFamily.ALGO_KWA,  # Dioula
    'ee':  AlgoFamily.ALGO_KWA,  # Ewe
    'gej': AlgoFamily.ALGO_KWA,  # Mina
    # Cross River / Chadic
    'bkv': AlgoFamily.ALGO_CRV,  # Bekwarra
    'ijn': AlgoFamily.ALGO_CRV,  # Calabari (Ijo)
    'iko': AlgoFamily.ALGO_CRV,  # Ogoja
    'ha':  AlgoFamily.ALGO_CRV,  # Hausa
    # Slavic
    'ru': AlgoFamily.ALGO_SLV, 'pl': AlgoFamily.ALGO_SLV,
    'uk': AlgoFamily.ALGO_SLV, 'cs': AlgoFamily.ALGO_SLV,
    # Others
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

# Families that benefit from morpho_strip (affix-heavy morphology)
_MORPHO_STRIP_FAMILIES = {
    AlgoFamily.ALGO_BNT,
    AlgoFamily.ALGO_TRK,
    AlgoFamily.ALGO_DRV,
    AlgoFamily.ALGO_FIN,
    AlgoFamily.ALGO_IIR,
}

# Families that benefit from phoneme_embedding scoring (tonal/non-concatenative)
_EMBEDDING_PRIORITY_FAMILIES = {
    AlgoFamily.ALGO_KWA,
    AlgoFamily.ALGO_CRV,
    AlgoFamily.ALGO_SIN,
    AlgoFamily.ALGO_TAI,
    AlgoFamily.ALGO_VIET,
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
            logger.info(f"Created epitran instance for {epitran_code}")
        except Exception as e:
            logger.error(f"Failed to create epitran for {epitran_code}: {e}")
            return None
    return _epitran_cache[epitran_code]


# ─── C4 — Tone contour normalisation (ALGO-KWA) ──────────────────────────────

TONE_CONTOUR_POLICY = "initial_dominant"

_TONE_TO_BINARY: Dict[str, str] = {
    'H': 'H', 'MH': 'H',
    'L': 'L', 'M': 'L', 'ML': 'L',
    'HL':  'H', 'HML': 'H',
    'LH':  'L', 'LHL': 'L',
}


def normalize_tone(raw_tone: Optional[str]) -> Optional[str]:
    if raw_tone is None:
        return None
    return _TONE_TO_BINARY.get(raw_tone.upper(), raw_tone)


# ─── C3 — Rhyme type classification ──────────────────────────────────────────

RHYME_THRESHOLD_RICH       = 0.95
RHYME_THRESHOLD_SUFFICIENT = 0.85
RHYME_THRESHOLD_ASSONANCE  = 0.75
RHYME_THRESHOLD_WEAK       = 0.40


def _categorize(score: float) -> str:
    if score >= RHYME_THRESHOLD_RICH:
        return "rich"
    if score >= RHYME_THRESHOLD_SUFFICIENT:
        return "sufficient"
    if score >= RHYME_THRESHOLD_ASSONANCE:
        return "assonance"
    if score >= RHYME_THRESHOLD_WEAK:
        return "weak"
    return "none"


# ─── C2 — Sₖ identification: prosodic accent by family ───────────────────────

FAMILY_ACCENT_POLICY: Dict[AlgoFamily, str] = {
    AlgoFamily.ALGO_ROM:  "final",
    AlgoFamily.ALGO_TRK:  "final",
    AlgoFamily.ALGO_KOR:  "final",
    AlgoFamily.ALGO_VIET: "final",
    AlgoFamily.ALGO_TAI:  "final",
    AlgoFamily.ALGO_FIN:  "initial",
    AlgoFamily.ALGO_AUS:  "initial",
    AlgoFamily.ALGO_SLV:  "mobile",
    AlgoFamily.ALGO_IIR:  "mobile",
    AlgoFamily.ALGO_GER:  "mobile",
    AlgoFamily.ALGO_SEM:  "mobile",
    AlgoFamily.ALGO_JAP:  "mora",
    AlgoFamily.ALGO_SIN:  "mora",
    AlgoFamily.ALGO_KWA:  "tonal_last",
    AlgoFamily.ALGO_CRV:  "tonal_last",
    AlgoFamily.ALGO_BNT:  "tonal_last",
    AlgoFamily.ALGO_DRV:  "final",
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


# ─── Models ───────────────────────────────────────────────────────────────────

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
    """Phonemization response — v4.3 schema."""
    algo_id:           str
    lang:              str
    input:             str
    ipa:               str
    syllables:         List[SyllableModel]
    rhyme_nucleus:     str
    rhyme_type:        Optional[str]     = None
    similarity_method: str               = "feature_weighted_levenshtein"
    method:            str
    low_resource:      bool
    fallback_used:     bool              = False
    fallback_reason:   Optional[str]     = None
    g2p_confidence:    str               = "high"
    # v4.3 — morpho_strip audit
    morpho_strip_applied: bool           = False
    morpho_strip_detail:  Optional[Dict[str, Any]] = None
    metadata:          Dict[str, Any]    = {}


class ScoreRequest(BaseModel):
    """Request for /api/score — phoneme embedding similarity."""
    rn1:  str          # rhyme nucleus 1 (IPA phones, space-separated or string)
    rn2:  str          # rhyme nucleus 2
    lang: str


class ScoreResponse(BaseModel):
    """Response from /api/score."""
    rn1:              str
    rn2:              str
    lang:             str
    algo_id:          str
    score:            float
    rhyme_type:       str
    method:           str               = "phoneme_embedding_phoible_lite"
    embedding_method: str               = "phoible_lite_dim5"
    tonal_match:      Optional[bool]    = None
    detail:           Dict[str, Any]    = {}


# ─── G2P helpers ─────────────────────────────────────────────────────────────

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


def extract_rhyme_nucleus(
    syllables: List[SyllableModel],
    family: AlgoFamily,
    lang: str,
) -> tuple[str, bool, Optional[Dict[str, Any]]]:
    """Extract rhyme nucleus from Sₖ, applying morpho_strip when relevant.

    Returns (rhyme_nucleus, morpho_strip_applied, morpho_strip_detail).

    v4.3: morpho_strip is applied on the IPA token of Sₖ before nucleus
    extraction when the family is in _MORPHO_STRIP_FAMILIES and the module
    is available.
    """
    if not syllables:
        return "", False, None

    idx = find_stressed_syllable_index(syllables, family)
    if idx < 0:
        return "", False, None
    syll = syllables[idx]

    morpho_applied = False
    morpho_detail: Optional[Dict[str, Any]] = None

    # ── morpho_strip: reconstruct token from Sₖ, strip, re-decompose ─────────
    if MORPHO_STRIP_AVAILABLE and family in _MORPHO_STRIP_FAMILIES:
        token_ipa = syll.onset + syll.nucleus + syll.coda
        if token_ipa.strip():
            try:
                result = strip_before_rn_extraction(token_ipa, lang)
                stripped = result.get("stripped_ipa", token_ipa)
                if stripped != token_ipa:
                    morpho_applied = True
                    morpho_detail = result
                    # Re-syllabify the stripped token to get clean nucleus/coda
                    stripped_sylls = simple_syllabify(f"/{stripped}/", family)
                    if stripped_sylls:
                        syll = stripped_sylls[-1]
                    logger.info(
                        f"morpho_strip [{lang}]: {token_ipa!r} → {stripped!r}"
                    )
            except Exception as e:
                logger.warning(f"morpho_strip failed for {lang}: {e}")

    # ── nucleus extraction per family policy ──────────────────────────────────
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


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "epitran_available": EPITRAN_AVAILABLE,
        "morpho_strip_available": MORPHO_STRIP_AVAILABLE,
        "phoneme_embedding_available": PHONEME_EMBEDDING_AVAILABLE,
        "version": "1.3.0",
    }


@app.get("/api/health")
async def api_health_check():
    return {
        "status": "healthy",
        "epitran_available": EPITRAN_AVAILABLE,
        "morpho_strip_available": MORPHO_STRIP_AVAILABLE,
        "phoneme_embedding_available": PHONEME_EMBEDDING_AVAILABLE,
        "version": "1.3.0",
    }


@app.post("/api/phonemize", response_model=PhonemizeResponse)
async def phonemize(request: PhonemizeRequest) -> PhonemizeResponse:
    """Main phonemization endpoint — v4.3"""
    try:
        lang_code = request.lang.lower()
        text = request.text.strip()

        if not text:
            raise HTTPException(status_code=400, detail="Empty text provided")

        family  = LANG_TO_FAMILY.get(lang_code, AlgoFamily.ALGO_ROM)
        reg     = G2P_REGISTRY.get(lang_code, {})
        backend = reg.get('backend', 'graphemic_fallback')
        g2p_confidence: str = reg.get('confidence', 'low')

        ipa_text: Optional[str] = None
        method        = "graphemic_fallback"
        low_resource  = True
        fallback_used = False
        fallback_reason: Optional[str] = None
        metadata: Dict[str, Any] = {}

        # ── Epitran ───────────────────────────────────────────────────────────
        if backend == 'epitran' and EPITRAN_AVAILABLE:
            epi = get_epitran(lang_code)
            if epi:
                try:
                    ipa_text      = epi.transliterate(text)
                    method        = "epitran"
                    low_resource  = False
                    metadata['epitran_code'] = reg.get('epitran_code')
                except Exception as e:
                    logger.warning(f"Epitran failed for {lang_code}: {e}")
                    ipa_text = None

        # ── KWA manual CV-tonal rules ─────────────────────────────────────────
        elif backend == 'rules_cv_tonal':
            ipa_text        = _g2p_kwa_rules(text, lang_code)
            method          = "rules_cv_tonal"
            low_resource    = True
            fallback_used   = False
            fallback_reason = None
            metadata['tone_contour_policy'] = TONE_CONTOUR_POLICY

        # ── ByT5 byte-level (stub) ────────────────────────────────────────────
        elif backend == 'byt5_bytelevel':
            ipa_text        = graphemic_fallback_g2p(text, family)
            method          = "graphemic_fallback"
            low_resource    = True
            fallback_used   = True
            fallback_reason = "low_resource_g2p"
            g2p_confidence  = "low"
            metadata['note'] = "ByT5-G2P not yet wired — graphemic fallback active"

        # ── Graphemic fallback ────────────────────────────────────────────────
        if ipa_text is None:
            ipa_text = graphemic_fallback_g2p(text, family)
            method   = "graphemic_fallback"
            low_resource    = True
            fallback_used   = True
            fallback_reason = (
                "unknown_language"
                if lang_code not in LANG_TO_FAMILY
                else "low_resource_g2p"
            )
            g2p_confidence = "low"
            metadata['note'] = "Graphemic fallback — epitran unavailable or unsupported language"

        syllables = simple_syllabify(ipa_text, family)

        # v4.3: morpho_strip integrated into RN extraction
        rhyme_nucleus, morpho_applied, morpho_detail = extract_rhyme_nucleus(
            syllables, family, lang_code
        )

        return PhonemizeResponse(
            algo_id               = family.value,
            lang                  = lang_code,
            input                 = text,
            ipa                   = ipa_text,
            syllables             = syllables,
            rhyme_nucleus         = rhyme_nucleus,
            rhyme_type            = None,
            similarity_method     = "feature_weighted_levenshtein",
            method                = method,
            low_resource          = low_resource,
            fallback_used         = fallback_used,
            fallback_reason       = fallback_reason,
            g2p_confidence        = g2p_confidence,
            morpho_strip_applied  = morpho_applied,
            morpho_strip_detail   = morpho_detail,
            metadata              = metadata,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Phonemization error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Phonemization failed: {str(e)}")


@app.post("/api/score", response_model=ScoreResponse)
async def score_rhymes(request: ScoreRequest) -> ScoreResponse:
    """Phoneme embedding similarity endpoint — niveau 4 scoring.

    Accepts two rhyme nuclei (IPA string) and returns cosine similarity
    via phoneme_embedding (PHOIBLE-lite dim=5 static vectors).
    Priority families: KWA, CRV, SIN, TAI, VIET (tonal awareness).

    v4.3 — wired from rhyme/phoneme_embedding.py
    """
    if not PHONEME_EMBEDDING_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="phoneme_embedding module not available",
        )

    lang_code = request.lang.lower()
    family = LANG_TO_FAMILY.get(lang_code, AlgoFamily.ALGO_ROM)

    # Split nucleus strings into phone lists (space-sep or char-by-char fallback)
    def _to_phones(s: str) -> List[str]:
        phones = s.split()
        return phones if len(phones) > 1 else list(s)

    rn1_phones = _to_phones(request.rn1)
    rn2_phones = _to_phones(request.rn2)

    try:
        result: EmbeddingScore = score_embedding(rn1_phones, rn2_phones)
    except Exception as e:
        logger.error(f"phoneme_embedding error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Embedding scoring failed: {str(e)}")

    score = result.score
    rhyme_type = _categorize(score)

    # Tonal match flag for tonal families
    tonal_match: Optional[bool] = None
    if family in _EMBEDDING_PRIORITY_FAMILIES:
        # Tone markers: H, L, ˥˦˧˨˩ and combining diacritics
        tonal_re = re.compile(r'[HL˥˦˧˨˩\u0301\u0300\u0302\u0304\u030c]')
        t1 = tonal_re.findall(request.rn1)
        t2 = tonal_re.findall(request.rn2)
        tonal_match = (t1 == t2) if (t1 or t2) else None

    return ScoreResponse(
        rn1          = request.rn1,
        rn2          = request.rn2,
        lang         = lang_code,
        algo_id      = family.value,
        score        = score,
        rhyme_type   = rhyme_type,
        tonal_match  = tonal_match,
        detail       = result.detail if hasattr(result, 'detail') else {},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
