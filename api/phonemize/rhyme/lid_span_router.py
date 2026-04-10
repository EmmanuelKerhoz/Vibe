"""
lid_span_router.py — Lyricist v4.1 Remediation #3
LID span-level : détection de langue par segment avant G2P.

Sans modèle LID → fallback sûr sur doc_lang.
Avec predictor (fastText/CMX) → segmentation token-level.
Flag low_resource automatique pour langues bkv/ijn/iko.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Callable, List, Optional, Tuple

# Mirrors LANG_TO_FAMILY in index.py — keep in sync with AlgoFamily enum
LANG_TO_FAMILY: dict[str, str] = {
    "fr": "ALGO-ROM", "es": "ALGO-ROM", "it": "ALGO-ROM", "pt": "ALGO-ROM",
    "ro": "ALGO-ROM", "ca": "ALGO-ROM",
    "en": "ALGO-GER", "de": "ALGO-GER", "nl": "ALGO-GER",
    "sv": "ALGO-GER", "da": "ALGO-GER", "no": "ALGO-GER",
    "ru": "ALGO-SLV", "pl": "ALGO-SLV", "uk": "ALGO-SLV", "cs": "ALGO-SLV",
    "ar": "ALGO-SEM", "he": "ALGO-SEM",
    "zh": "ALGO-SIN",
    "ja": "ALGO-JAP",
    "ko": "ALGO-KOR",
    "hi": "ALGO-IIR", "ur": "ALGO-IIR", "bn": "ALGO-IIR",
    "ta": "ALGO-DRV", "te": "ALGO-DRV",
    "tr": "ALGO-TRK", "uz": "ALGO-TRK",
    "fi": "ALGO-FIN", "et": "ALGO-FIN",
    "th": "ALGO-TAI", "lo": "ALGO-TAI",
    "vi": "ALGO-VIET", "km": "ALGO-VIET",
    "id": "ALGO-AUS", "ms": "ALGO-AUS", "tl": "ALGO-AUS",
    "sw": "ALGO-BNT", "zu": "ALGO-BNT",
    "bci": "ALGO-KWA", "dyu": "ALGO-KWA", "ee": "ALGO-KWA", "gej": "ALGO-KWA",
    "bkv": "ALGO-CRV", "ijn": "ALGO-CRV", "iko": "ALGO-CRV", "ha": "ALGO-CRV",
}

LOW_RESOURCE_LANGS = frozenset({"bkv", "ijn", "iko"})

# Type alias: token -> (lang_code, confidence)
LidPredictor = Callable[[str], Tuple[str, float]]


@dataclass
class LangSpan:
    text: str
    lang: str
    family: str
    confidence: float
    start: int   # token index (inclusive)
    end: int     # token index (exclusive)
    low_resource: bool


def detect_spans(
    verse: str,
    doc_lang: str = "fr",
    lid_predictor: Optional[LidPredictor] = None,
    confidence_threshold: float = 0.75,
) -> List[LangSpan]:
    """Detect language spans in a potentially code-switched verse.

    Args:
        verse:                Raw verse text.
        doc_lang:             Document-level language (safe fallback).
        lid_predictor:        Optional token-level LID function.
                              Signature: (token: str) -> (lang: str, confidence: float)
        confidence_threshold: Minimum LID confidence to override doc_lang.

    Returns:
        List of LangSpan, each covering a contiguous token run in one language.
        Single span covering the full verse when no predictor is provided.
    """
    if lid_predictor is None:
        return [_build_span(verse.split(), doc_lang, 0, len(verse.split()), 1.0)]

    tokens = verse.split()
    spans: List[LangSpan] = []
    current_lang = doc_lang
    current_tokens: List[str] = []
    start_idx = 0

    for i, token in enumerate(tokens):
        detected_lang, conf = lid_predictor(token)
        effective_lang = detected_lang if conf >= confidence_threshold else doc_lang

        if effective_lang != current_lang and current_tokens:
            spans.append(_build_span(current_tokens, current_lang, start_idx, i))
            current_tokens = []
            start_idx = i
            current_lang = effective_lang

        current_tokens.append(token)

    if current_tokens:
        spans.append(_build_span(current_tokens, current_lang, start_idx, len(tokens)))

    return spans if spans else [_build_span(verse.split(), doc_lang, 0, len(verse.split()), 1.0)]


def _build_span(
    tokens: List[str],
    lang: str,
    start: int,
    end: int,
    confidence: float = 0.8,
) -> LangSpan:
    return LangSpan(
        text=" ".join(tokens),
        lang=lang,
        family=LANG_TO_FAMILY.get(lang, "ALGO-ROM"),
        confidence=confidence,
        start=start,
        end=end,
        low_resource=lang in LOW_RESOURCE_LANGS,
    )
