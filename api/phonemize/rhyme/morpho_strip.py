"""
morpho_strip.py — Lyricist v4.1 Remediation #4
Strip morphologique pré-extraction du RN.

Familles couvertes :
  BNT  — strip préfixes de classes nominales (SW/ZU)
  TRK  — strip suffixes agglutinants (TR/UZ)
  DRV  — strip suffixes dravidiens (TA/TE)
KWA non concerné (phonologie analytique, pas d'agglutination nominale).
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

# Bantu nominal class prefixes to strip before RN extraction
_BANTU_PREFIXES: Dict[str, List[str]] = {
    "sw": ["watu", "mtu", "kitu", "vitu", "mwa", "wa", "ki", "vi", "ma", "ny", "mu", "mi", "pa", "ku", "n"],
    "zu": ["ama", "ulu", "izi", "imi", "um", "is", "iz", "in"],
    "ln": ["ba", "mo", "lo", "ma", "bo", "ko"],
}

# Turkic case/plural suffixes to strip (longest-match first at runtime)
_TURKIC_SUFFIXES: Dict[str, List[str]] = {
    "tr": ["lar", "ler", "dan", "den", "tan", "ten", "da", "de", "ta", "te",
           "\u0131n", "in", "un", "\u00fcn", "\u0131", "i", "u", "\u00fc", "a", "e"],
    "uz": ["lar", "lar", "da", "ga"],
}

# Dravidian case suffixes (Unicode)
_DRAVIDIAN_SUFFIXES: Dict[str, List[str]] = {
    "ta": ["\u0b95\u0bb3\u0bcd", "\u0b87\u0bb2\u0bcd", "\u0b87\u0ba9\u0bcd",
           "\u0b89\u0bae\u0bcd", "\u0b90", "\u0b95\u0bc1"],
    "te": ["\u0c32\u0c41", "\u0c32\u0c4b", "\u0c15\u0c41", "\u0c28\u0c41"],
}


@dataclass
class StripResult:
    original: str
    stripped: str
    affix_removed: str
    morpho_strip_applied: bool


def strip_morphology(token: str, lang: str) -> Tuple[str, str]:
    """Strip agglutinative affixes from token for BNT, TRK, DRV families.

    Returns:
        (stripped_token, affix_removed) — affix is '' when no strip occurred.
    """
    lang = lang.lower()

    # BNT — prefix strip
    prefixes = _BANTU_PREFIXES.get(lang)
    if prefixes:
        for prefix in sorted(prefixes, key=len, reverse=True):
            if token.lower().startswith(prefix) and len(token) > len(prefix) + 2:
                return token[len(prefix):], prefix

    # TRK — suffix strip (longest match)
    suffixes = _TURKIC_SUFFIXES.get(lang)
    if suffixes:
        for suffix in sorted(suffixes, key=len, reverse=True):
            if token.lower().endswith(suffix) and len(token) > len(suffix) + 2:
                return token[: -len(suffix)], suffix

    # DRV — suffix strip (Unicode, longest match)
    drv_suffixes = _DRAVIDIAN_SUFFIXES.get(lang)
    if drv_suffixes:
        for suffix in sorted(drv_suffixes, key=len, reverse=True):
            if token.endswith(suffix) and len(token) > len(suffix) + 1:
                return token[: -len(suffix)], suffix

    return token, ""


def strip_before_rn_extraction(
    ipa_token: str,
    lang: str,
    apply_strip: bool = True,
) -> StripResult:
    """Entry point for the pipeline — called before extractRN.

    Args:
        ipa_token:   IPA transcription of the token (post G2P).
        lang:        BCP-47 language code.
        apply_strip: Set False to bypass (e.g. KWA, ROM families).

    Returns:
        StripResult with audit fields for metadata logging.
    """
    if not apply_strip:
        return StripResult(
            original=ipa_token,
            stripped=ipa_token,
            affix_removed="",
            morpho_strip_applied=False,
        )

    stripped, affix = strip_morphology(ipa_token, lang)
    return StripResult(
        original=ipa_token,
        stripped=stripped,
        affix_removed=affix,
        morpho_strip_applied=bool(affix),
    )
