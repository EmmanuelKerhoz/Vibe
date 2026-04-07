"""
G2P Phonemization Microservice for Lyricist Pro
FastAPI implementation with epitran for proper IPA conversion

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

app = FastAPI(title="G2P Phonemization Service", version="1.2.0")

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


# ─── C6 — G2P Backend Registry ───────────────────────────────────────────────
# Confidence levels: "high" | "medium" | "rules" | "low"
# Per SPEC_CORRECTIONS_v4.2.md §CORRECTION 6

G2P_REGISTRY: Dict[str, Dict[str, str]] = {
    # Epitran-covered languages
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
    # Kwa — manual CV tonal rules (v4.1), ByT5 fallback in v5.x
    'bci': {'backend': 'rules_cv_tonal', 'epitran_code': None, 'confidence': 'rules'},  # Baoulé
    'dyu': {'backend': 'rules_cv_tonal', 'epitran_code': None, 'confidence': 'rules'},  # Dioula
    'ee':  {'backend': 'rules_cv_tonal', 'epitran_code': None, 'confidence': 'rules'},  # Ewe
    'gej': {'backend': 'rules_cv_tonal', 'epitran_code': None, 'confidence': 'rules'},  # Mina
    # Cross River — ByT5-G2P byte-level
    'bkv': {'backend': 'byt5_bytelevel', 'epitran_code': None, 'confidence': 'low'},   # Bekwarra
    'ijn': {'backend': 'byt5_bytelevel', 'epitran_code': None, 'confidence': 'low'},   # Calabari
    'iko': {'backend': 'byt5_bytelevel', 'epitran_code': None, 'confidence': 'low'},   # Ogoja
    'ha':  {'backend': 'epitran',        'epitran_code': 'hau-Latn', 'confidence': 'medium'},  # Hausa
}

G2pConfidence = Literal["high", "medium", "rules", "low"]
FallbackReason = Literal[
    "low_resource_g2p",
    "low_resource_g2p_rules_only",
    "unknown_language",
    None,
]

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
# Policy: initial_dominant — contour's starting height determines binary class
# Per SPEC_CORRECTIONS_v4.2.md §CORRECTION 4

TONE_CONTOUR_POLICY = "initial_dominant"

_TONE_TO_BINARY: Dict[str, str] = {
    # Flat tones
    'H': 'H', 'MH': 'H',
    'L': 'L', 'M': 'L', 'ML': 'L',
    # Contours — initial height dominates (SPEC §CORRECTION 4)
    'HL':  'H',   # starts HIGH
    'HML': 'H',   # starts HIGH
    'LH':  'L',   # starts LOW
    'LHL': 'L',   # starts LOW
}


def normalize_tone(raw_tone: Optional[str]) -> Optional[str]:
    """Normalise 5-level or contour tone to binary H/L using initial_dominant policy."""
    if raw_tone is None:
        return None
    return _TONE_TO_BINARY.get(raw_tone.upper(), raw_tone)


# ─── C3 — Rhyme type classification ──────────────────────────────────────────
# Thresholds aligned with TypeScript skeleton (no dead zone)
# Per SPEC_CORRECTIONS_v4.2.md §CORRECTION 3
#
#   rich       >= 0.95
#   sufficient >= 0.85
#   assonance  >= 0.75
#   weak       >= 0.40
#   none        < 0.40

RHYME_THRESHOLD_RICH       = 0.95
RHYME_THRESHOLD_SUFFICIENT = 0.85
RHYME_THRESHOLD_ASSONANCE  = 0.75
RHYME_THRESHOLD_WEAK       = 0.40


def _categorize(score: float) -> str:
    """Classify a phonological similarity score into a rhyme type.

    Thresholds from SPEC_CORRECTIONS_v4.2.md §CORRECTION 3.
    Replaces the previous implementation that had a dead zone between 0.60-0.80.
    """
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
# Per SPEC_CORRECTIONS_v4.2.md §CORRECTION 2

FAMILY_ACCENT_POLICY: Dict[AlgoFamily, str] = {
    # Final-accent families: last non-schwa syllable
    AlgoFamily.ALGO_ROM:  "final",
    AlgoFamily.ALGO_TRK:  "final",
    AlgoFamily.ALGO_KOR:  "final",
    AlgoFamily.ALGO_VIET: "final",
    AlgoFamily.ALGO_TAI:  "final",
    # Initial-accent families: first syllable
    AlgoFamily.ALGO_FIN:  "initial",
    AlgoFamily.ALGO_AUS:  "initial",
    # Mobile/lexical accent: dictionary or suffix rules
    AlgoFamily.ALGO_SLV:  "mobile",
    AlgoFamily.ALGO_IIR:  "mobile",
    AlgoFamily.ALGO_GER:  "mobile",
    AlgoFamily.ALGO_SEM:  "mobile",
    # Mora-based: last mora of verse
    AlgoFamily.ALGO_JAP:  "mora",
    AlgoFamily.ALGO_SIN:  "mora",
    # Tonal families: nucleus+tone extraction; Sₖ = last syllable of verse
    AlgoFamily.ALGO_KWA:  "tonal_last",
    AlgoFamily.ALGO_CRV:  "tonal_last",
    AlgoFamily.ALGO_BNT:  "tonal_last",
    AlgoFamily.ALGO_DRV:  "final",
}

SCHWA_PATTERN = re.compile(r'^[əɨ]+$')


def find_stressed_syllable_index(syllables: List['SyllableModel'], family: AlgoFamily) -> int:
    """Return index of Sₖ (stressed syllable) according to family accent policy.

    Per SPEC_CORRECTIONS_v4.2.md §CORRECTION 2.
    Falls back to last syllable when policy cannot resolve.
    """
    if not syllables:
        return -1

    policy = FAMILY_ACCENT_POLICY.get(family, "final")

    if policy == "initial":
        return 0

    if policy == "mora" or policy == "tonal_last":
        return len(syllables) - 1

    if policy == "final":
        # Last non-schwa syllable (ALGO-ROM canonical)
        for i in range(len(syllables) - 1, -1, -1):
            if not SCHWA_PATTERN.match(syllables[i].nucleus or ""):
                return i
        return len(syllables) - 1

    # mobile: no dictionary available at this stage — fall back to last
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
    """Phonemization response — v4.2 schema.

    New fields (SPEC_CORRECTIONS_v4.2.md §CORRECTION 5):
      fallback_used    — True when G2P could not use the primary backend
      fallback_reason  — Reason code for the fallback
      g2p_confidence   — Confidence level of the G2P output
    """
    algo_id:          str
    lang:             str
    input:            str
    ipa:              str
    syllables:        List[SyllableModel]
    rhyme_nucleus:    str
    rhyme_type:       Optional[str]     = None
    similarity_method: str              = "feature_weighted_levenshtein"
    method:           str
    low_resource:     bool
    # C5 — new fields
    fallback_used:    bool              = False
    fallback_reason:  Optional[str]     = None   # FallbackReason
    g2p_confidence:   str               = "high"  # G2pConfidence
    metadata:         Dict[str, Any]    = {}


# ─── G2P helpers ─────────────────────────────────────────────────────────────

def _g2p_kwa_rules(text: str, lang: str) -> str:
    """Minimal CV-tonal rules for KWA languages (BA/DI/EW/MI).

    Placeholder for the full v4.1 rule set. Returns a rough IPA approximation
    preserving vowel quality and marking tone via diacritics where inferable
    from common orthographic conventions (grave=L, acute=H, no mark=M→L).
    Full rule engine to be completed in v4.3.
    """
    cleaned = text.lower().strip()
    # Basic tone diacritic mapping (Baoulé / Dioula orthography)
    tone_map = str.maketrans({'á': 'a\u0301', 'é': 'e\u0301', 'í': 'i\u0301',
                               'ó': 'o\u0301', 'ú': 'u\u0301',
                               'à': 'a\u0300', 'è': 'e\u0300', 'ì': 'i\u0300',
                               'ò': 'o\u0300', 'ù': 'u\u0300'})
    return f"/{cleaned.translate(tone_map)}/"


def graphemic_fallback_g2p(text: str, family: AlgoFamily) -> str:
    """Minimal graphemic fallback when no backend is available."""
    return f"/{text.lower().strip()}/"


def simple_syllabify(ipa: str, family: AlgoFamily) -> List[SyllableModel]:
    """Basic syllabification for IPA text."""
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
) -> str:
    """Extract rhyme nucleus from Sₖ (prosodic accent per family).

    Per SPEC_CORRECTIONS_v4.2.md §CORRECTION 2:
    - final-accent families  → last non-schwa syllable
    - initial-accent families → first syllable
    - tonal families (KWA/CRV/BNT) → last syllable, nucleus+tone (no coda for KWA)
    - mora/Sinitic → last syllable
    - mobile → last syllable (dictionary unavailable)
    """
    if not syllables:
        return ""

    idx = find_stressed_syllable_index(syllables, family)
    if idx < 0:
        return ""
    syll = syllables[idx]

    # Tonal families: nucleus + normalised tone; KWA excludes coda
    if family in (AlgoFamily.ALGO_KWA, AlgoFamily.ALGO_BNT):
        rn = syll.nucleus
        if syll.tone:
            rn += normalize_tone(syll.tone) or syll.tone
        return rn

    if family == AlgoFamily.ALGO_CRV:
        rn = syll.nucleus
        if syll.tone:
            rn += normalize_tone(syll.tone) or syll.tone
        rn += syll.coda  # CRV includes coda weight
        return rn

    # Standard: nucleus + coda from Sₖ
    return syll.nucleus + syll.coda


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "healthy", "epitran_available": EPITRAN_AVAILABLE, "version": "1.2.0"}


@app.get("/api/health")
async def api_health_check():
    return {"status": "healthy", "epitran_available": EPITRAN_AVAILABLE, "version": "1.2.0"}


@app.post("/api/phonemize", response_model=PhonemizeResponse)
async def phonemize(request: PhonemizeRequest) -> PhonemizeResponse:
    """Main phonemization endpoint — v4.2"""
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

        # ── Epitran path ──────────────────────────────────────────────────────
        if backend == 'epitran' and EPITRAN_AVAILABLE:
            epi = get_epitran(lang_code)
            if epi:
                try:
                    ipa_text      = epi.transliterate(text)
                    method        = "epitran"
                    low_resource  = False
                    metadata['epitran_code'] = reg.get('epitran_code')
                    logger.info(f"Phonemized '{text}' via epitran")
                except Exception as e:
                    logger.warning(f"Epitran failed for {lang_code}: {e}")
                    ipa_text = None

        # ── KWA manual CV-tonal rules ─────────────────────────────────────────
        elif backend == 'rules_cv_tonal':
            ipa_text       = _g2p_kwa_rules(text, lang_code)
            method         = "rules_cv_tonal"
            low_resource   = True
            fallback_used  = False  # rules are the primary backend for KWA
            fallback_reason = None
            metadata['tone_contour_policy'] = TONE_CONTOUR_POLICY  # C4
            logger.info(f"Phonemized '{text}' via KWA CV-tonal rules")

        # ── ByT5 byte-level (stub — to be wired in v5.x) ─────────────────────
        elif backend == 'byt5_bytelevel':
            # Stub: fall through to graphemic until ByT5 model is wired
            ipa_text        = graphemic_fallback_g2p(text, family)
            method          = "graphemic_fallback"
            low_resource    = True
            fallback_used   = True
            fallback_reason = "low_resource_g2p"
            g2p_confidence  = "low"
            metadata['note'] = "ByT5-G2P not yet wired — graphemic fallback active"

        # ── Graphemic fallback (unknown language) ─────────────────────────────
        if ipa_text is None:
            # Epitran failed or language not in registry
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

        syllables    = simple_syllabify(ipa_text, family)
        rhyme_nucleus = extract_rhyme_nucleus(syllables, family)  # C2

        return PhonemizeResponse(
            algo_id          = family.value,
            lang             = lang_code,
            input            = text,
            ipa              = ipa_text,
            syllables        = syllables,
            rhyme_nucleus    = rhyme_nucleus,
            rhyme_type       = None,   # populated by scoring layer
            similarity_method = "feature_weighted_levenshtein",
            method           = method,
            low_resource     = low_resource,
            fallback_used    = fallback_used,    # C5
            fallback_reason  = fallback_reason,  # C5
            g2p_confidence   = g2p_confidence,   # C5
            metadata         = metadata,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Phonemization error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Phonemization failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
