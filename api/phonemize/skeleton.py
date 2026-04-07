"""
Phonemization microservice skeleton for Lyricist Pro
Based on docs_fusion_optimal.md + SPEC_CORRECTIONS_v4.2.md

This file establishes the API contract and type system.
It is NOT deployed — it is the reference for type-checking and documentation.

Corrections v4.2 applied:
  C2 — Définition normative de Sₖ : accent prosodique par famille
  C3 — Hiérarchie des seuils (rich/sufficient/assonance/weak/none)
  C4 — ToneContourPolicy : initial_dominant pour ALGO-KWA
  C5 — Schéma JSON : fallback_used, fallback_reason, g2p_confidence
  C6 — G2P Backend Registry par langue
"""

from typing import Optional, List, Dict, Any, Literal
from dataclasses import dataclass, field
from enum import Enum


class AlgoFamily(str, Enum):
    """Language family identifiers matching TypeScript constants."""
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


# ─── C5 — Normative type aliases ──────────────────────────────────────────────────

G2pConfidence = Literal["high", "medium", "rules", "low"]
"""
high   — native trained model (epitran)
medium — eSpeak-NG or Epitran covering the language
rules  — manual artisanal rules
low    — ByT5 byte-level or proxy transcription
"""

FallbackReason = Optional[Literal[
    "low_resource_g2p",
    "low_resource_g2p_rules_only",
    "unknown_language",
]]
"""
null                        — no fallback used
low_resource_g2p            — G2P unavailable, ByT5 or CV rules activated
low_resource_g2p_rules_only — manual rules only, no model
unknown_language            — LID failed, universal mode activated
"""

RhymeType = Literal["rich", "sufficient", "assonance", "weak", "none"]


# ─── C3 — Rhyme type thresholds (normative) ─────────────────────────────────

RHYME_THRESHOLDS: Dict[RhymeType, float] = {
    "rich":       0.95,
    "sufficient": 0.85,
    "assonance":  0.75,
    "weak":       0.40,
    "none":       0.00,
}
"""
Normative thresholds — SPEC_CORRECTIONS_v4.2.md §CORRECTION 3.
No dead zone. Aligned with TypeScript _categorize() in scoring/similarity.ts.

Previous (incorrect) mapping had a dead zone 0.60–0.80:
  assonance was defined as 0.60–0.80 (ambiguous)
  weak      was defined as  ≥ 0.75 AND < 0.60 (impossible)
"""


# ─── C4 — Tone contour policy ─────────────────────────────────────────────────

ToneContourPolicy = Literal["initial_dominant"]
"""
initial_dominant (normative for ALGO-KWA / ALGO-CRV):
  HL  → H  (starts high)
  LH  → L  (starts low)
  HML → H  (starts high)
  LHL → L  (starts low)

Justification: perception of tonal rhyme in BA/DI poetry is dominated
by the starting height of the contour (consistent with WA-KWA literature).
"""

TONE_CONTOUR_MAP: Dict[str, str] = {
    'H': 'H', 'MH': 'H',
    'L': 'L', 'M':  'L', 'ML': 'L',
    'HL': 'H', 'HML': 'H',
    'LH': 'L', 'LHL': 'L',
}


# ─── C2 — Accent policy by family ────────────────────────────────────────────────

AccentPolicy = Literal["final", "initial", "mobile", "mora", "tonal_last"]
"""
final      — last non-schwa syllable (FR, ES, TR, KO, VI, TH)
initial    — first syllable (FI, HU, AUS languages)
mobile     — dictionary/suffix resolution (RU, BG, EN, DE, AR)
mora       — last mora of verse (JA, ZH)
tonal_last — last syllable, nucleus+tone extracted (KWA, CRV, BNT)
"""


# ─── C6 — G2P Backend Registry ───────────────────────────────────────────────
"""
G2P backend per language code.
Backend values: 'epitran' | 'rules_cv_tonal' | 'byt5_bytelevel' | 'graphemic_fallback'
Confidence values: G2pConfidence

KWA languages (BA/DI/EW/MI): rules_cv_tonal is primary; ByT5 planned for v5.x.
CRV low-resource (BKV/IJN/IKO): byt5_bytelevel stub active until model is wired.
Hausa: epitran hau-Latn (medium — eSpeak-NG coverage).
"""


@dataclass
class Syllable:
    """Syllable structure with IPA components."""
    onset:   str
    nucleus: str
    coda:    str
    tone:    Optional[str] = None
    stress:  bool = False


@dataclass
class PhonemeResult:
    """Result structure for phonemization — v4.2 schema.

    Matches PhonemizeResponse in index.py.
    New fields per SPEC_CORRECTIONS_v4.2.md §CORRECTION 5.
    """
    algo_id:          AlgoFamily
    lang:             str
    input:            str
    ipa:              str
    syllables:        List[Syllable]
    rhyme_nucleus:    str
    rhyme_type:       Optional[RhymeType]  = None
    similarity_method: str                 = "feature_weighted_levenshtein"
    method:           str                  = "graphemic_fallback"
    low_resource:     bool                 = False
    # C5 fields
    fallback_used:    bool                 = False
    fallback_reason:  FallbackReason       = None
    g2p_confidence:   G2pConfidence        = "high"
    metadata:         Dict[str, Any]       = field(default_factory=dict)


# ─── Language → family mapping ───────────────────────────────────────────────────

LANG_TO_FAMILY: Dict[str, AlgoFamily] = {
    'fr': AlgoFamily.ALGO_ROM,  'es': AlgoFamily.ALGO_ROM,
    'it': AlgoFamily.ALGO_ROM,  'pt': AlgoFamily.ALGO_ROM,
    'en': AlgoFamily.ALGO_GER,  'de': AlgoFamily.ALGO_GER,
    'nl': AlgoFamily.ALGO_GER,
    'bci': AlgoFamily.ALGO_KWA, 'dyu': AlgoFamily.ALGO_KWA,
    'ee':  AlgoFamily.ALGO_KWA, 'gej': AlgoFamily.ALGO_KWA,
    'bkv': AlgoFamily.ALGO_CRV, 'ijn': AlgoFamily.ALGO_CRV,
    'iko': AlgoFamily.ALGO_CRV, 'ha':  AlgoFamily.ALGO_CRV,
    'ru': AlgoFamily.ALGO_SLV,  'pl': AlgoFamily.ALGO_SLV,
    'ar': AlgoFamily.ALGO_SEM,  'zh': AlgoFamily.ALGO_SIN,
    'ja': AlgoFamily.ALGO_JAP,  'ko': AlgoFamily.ALGO_KOR,
    'hi': AlgoFamily.ALGO_IIR,  'tr': AlgoFamily.ALGO_TRK,
    'fi': AlgoFamily.ALGO_FIN,  'th': AlgoFamily.ALGO_TAI,
    'vi': AlgoFamily.ALGO_VIET,
}


# ─── Stub implementations ─────────────────────────────────────────────────────────

def _categorize(score: float) -> RhymeType:
    """Classify similarity score — SPEC_CORRECTIONS_v4.2.md §CORRECTION 3."""
    if score >= 0.95: return "rich"
    if score >= 0.85: return "sufficient"
    if score >= 0.75: return "assonance"
    if score >= 0.40: return "weak"
    return "none"


def phonemize_text(text: str, lang_code: str) -> PhonemeResult:
    """Convert text to IPA phonemes with syllabification.

    Skeleton — delegates to index.py for real execution.
    Preserved here as reference for type contracts and testing.
    """
    family = LANG_TO_FAMILY.get(lang_code, AlgoFamily.ALGO_ROM)
    return PhonemeResult(
        algo_id        = family,
        lang           = lang_code,
        input          = text,
        ipa            = f"/{text.lower()}/",
        syllables      = [],
        rhyme_nucleus  = "",
        method         = "graphemic_fallback",
        low_resource   = True,
        fallback_used  = True,
        fallback_reason = "low_resource_g2p",
        g2p_confidence = "low",
        metadata       = {"note": "Skeleton implementation"}
    )


def syllabify_ipa(ipa: str, family: AlgoFamily) -> List[Syllable]:
    """Syllabify IPA — per-family rules to implement.

    ALGO-KWA : CV structure, tonal, initial_dominant contour policy (C4)
    ALGO-CRV : CV(C) structure, tonal with syllable weight
    ALGO-ROM : complex onset/coda rules, final accent (C2)
    ALGO-JAP : moraic structure, last mora = Sₖ
    ALGO-FIN : initial accent (C2)
    """
    return []


def extract_rhyme_nucleus(syllables: List[Syllable], family: AlgoFamily) -> str:
    """Extract rhyme nucleus from Sₖ per family accent policy (C2).

    Implementation in index.py — this stub is for documentation only.
    See FAMILY_ACCENT_POLICY and find_stressed_syllable_index() in index.py.
    """
    return ""


if __name__ == "__main__":
    result = phonemize_text("monde", "fr")
    print(f"Input: {result.input}")
    print(f"Family: {result.algo_id}")
    print(f"IPA: {result.ipa}")
    print(f"Method: {result.method}")
    print(f"Fallback: {result.fallback_used} / {result.fallback_reason}")
    print(f"G2P confidence: {result.g2p_confidence}")
