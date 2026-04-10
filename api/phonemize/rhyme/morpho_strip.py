# morpho_strip.py  v2.0
# Stripping pré-extractRN : affixes BNT/TRK/DRV + clitiques KWA (Ewe/Mina)
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class StripResult:
    token: str                      # token IPA après strip
    stem_nucleus: Optional[str]     # nucleus du stem avant clitique
    stem_tone: Optional[str]        # ton base du stem
    morpho_strip_applied: str       # tag audit
    harmonic_variant: bool = False  # True si harmonie Ewe appliquée
    notes: list[str] = field(default_factory=list)

# ── clitiques Ewe/Mina ──────────────────────────────────────────────────────

_EWE_HIGH_VOWELS = {"i", "e", "ɪ"}          # height=high, front
_EWE_MID_LOW_VOWELS = {"ɛ", "a", "ɔ", "o", "u", "ʊ"}

_EWE_CLITICS = {
    "-e":  {"gloss": "3SG",     "surface_vowel": "e"},
    "-é":  {"gloss": "3SG.H",   "surface_vowel": "e"},
    "-a":  {"gloss": "FOCUS",   "surface_vowel": "a"},
    "-wo": {"gloss": "PL",      "surface_vowel": "o"},
}

def _apply_ewe_height_harmony(stem_nucleus: str, clitic_vowel: str) -> tuple[str, bool]:
    """
    Harmonie de hauteur Ewe Northern :
    le clitic assimile le trait [high] du stem.
    Retourne (vowel_harmonisée, harmony_applied).
    """
    if stem_nucleus in _EWE_HIGH_VOWELS and clitic_vowel in ("e", "a"):
        return clitic_vowel, False
    if stem_nucleus in _EWE_MID_LOW_VOWELS and clitic_vowel == "e":
        return "ɛ", True
    return clitic_vowel, False

def _strip_ewe_clitic(ipa_token: str) -> StripResult:
    """
    Détache le clitique Ewe/Mina, applique l'harmonie de hauteur,
    retourne le stem net + métadonnées.
    """
    for suffix, meta in _EWE_CLITICS.items():
        if ipa_token.endswith(suffix):
            stem = ipa_token[: -len(suffix)]
            if not stem:
                break
            stem_nucleus = _guess_nucleus(stem)
            cv_clitic, harmony_applied = _apply_ewe_height_harmony(
                stem_nucleus or "", meta["surface_vowel"]
            )
            notes = []
            if harmony_applied:
                notes.append(
                    f"height_harmony: stem_nucleus={stem_nucleus} "
                    f"→ clitic_vowel {meta['surface_vowel']}→{cv_clitic}"
                )
            return StripResult(
                token=stem,
                stem_nucleus=stem_nucleus,
                stem_tone=None,
                morpho_strip_applied="ewe_clitic",
                harmonic_variant=harmony_applied,
                notes=notes or [f"clitic={suffix} ({meta['gloss']}) détaché"],
            )
    return StripResult(
        token=ipa_token,
        stem_nucleus=_guess_nucleus(ipa_token),
        stem_tone=None,
        morpho_strip_applied="none",
    )

def _guess_nucleus(ipa: str) -> Optional[str]:
    """Heuristique : dernière voyelle IPA du token."""
    vowels = "aeiouɛɔɪʊæɑøœ"
    for ch in reversed(ipa):
        if ch in vowels:
            return ch
    return None

# ── affixes bantou (SW/ZU/LN) ───────────────────────────────────────────────

_BNT_PREFIXES = {
    "SW": ["m-", "wa-", "ki-", "vi-", "n-", "ji-", "u-", "ma-", "ku-", "pa-"],
    "ZU": ["um-", "aba-", "i-", "ama-", "in-", "izin-", "ulu-", "ubu-", "uku-"],
    "LN": ["mu-", "ba-", "ki-", "bi-", "n-", "bu-", "ku-", "pa-"],
}

def _strip_bnt(ipa_token: str, lang: str) -> StripResult:
    for pfx in _BNT_PREFIXES.get(lang, []):
        if ipa_token.startswith(pfx):
            stem = ipa_token[len(pfx):]
            return StripResult(
                token=stem,
                stem_nucleus=_guess_nucleus(stem),
                stem_tone=None,
                morpho_strip_applied=f"bnt_prefix:{pfx}",
            )
    return StripResult(
        token=ipa_token,
        stem_nucleus=_guess_nucleus(ipa_token),
        stem_tone=None,
        morpho_strip_applied="none",
    )

# ── suffixes turciques ───────────────────────────────────────────────────────

_TRK_SUFFIXES = {
    "TR": ["-lar", "-ler", "-dan", "-den", "-da", "-de", "-ın", "-in", "-un", "-ün"],
    "UZ": ["-lar", "-lar", "-dan", "-ning", "-ga", "-da"],
}

def _strip_trk(ipa_token: str, lang: str) -> StripResult:
    for sfx in _TRK_SUFFIXES.get(lang, []):
        if ipa_token.endswith(sfx):
            stem = ipa_token[: -len(sfx)]
            return StripResult(
                token=stem,
                stem_nucleus=_guess_nucleus(stem),
                stem_tone=None,
                morpho_strip_applied=f"trk_suffix:{sfx}",
            )
    return StripResult(
        token=ipa_token,
        stem_nucleus=_guess_nucleus(ipa_token),
        stem_tone=None,
        morpho_strip_applied="none",
    )

# ── suffixes dravidiens ──────────────────────────────────────────────────────

_DRV_SUFFIXES = {
    "TA": ["-kaḷ", "-iṉ", "-ukku", "-il", "-āl", "-ōḍu"],
    "TE": ["-lu", "-ki", "-lo", "-tō", "-ku"],
}

def _strip_drv(ipa_token: str, lang: str) -> StripResult:
    for sfx in _DRV_SUFFIXES.get(lang, []):
        if ipa_token.endswith(sfx):
            stem = ipa_token[: -len(sfx)]
            return StripResult(
                token=stem,
                stem_nucleus=_guess_nucleus(stem),
                stem_tone=None,
                morpho_strip_applied=f"drv_suffix:{sfx}",
            )
    return StripResult(
        token=ipa_token,
        stem_nucleus=_guess_nucleus(ipa_token),
        stem_tone=None,
        morpho_strip_applied="none",
    )

# ── dispatcher principal ─────────────────────────────────────────────────────

_LANG_TO_HANDLER = {
    "EW": _strip_ewe_clitic,
    "MI": _strip_ewe_clitic,   # Mina dérivé Ewe, même règles clitiques
    "BA": lambda t: StripResult(t, _guess_nucleus(t), None, "none"),
    "DI": lambda t: StripResult(t, _guess_nucleus(t), None, "none"),
    "SW": lambda t: _strip_bnt(t, "SW"),
    "ZU": lambda t: _strip_bnt(t, "ZU"),
    "LN": lambda t: _strip_bnt(t, "LN"),
    "TR": lambda t: _strip_trk(t, "TR"),
    "UZ": lambda t: _strip_trk(t, "UZ"),
    "TA": lambda t: _strip_drv(t, "TA"),
    "TE": lambda t: _strip_drv(t, "TE"),
}

def strip_before_rn_extraction(ipa_token: str, lang: str) -> StripResult:
    """
    Point d'entrée unique.
    KWA analytique (BA/DI) : pass-through.
    EW/MI : détachement clitique + harmonie hauteur.
    BNT   : strip préfixe classe nominale.
    TRK   : strip suffixe agglutinant.
    DRV   : strip suffixe dravidien.
    """
    handler = _LANG_TO_HANDLER.get(lang)
    if handler:
        return handler(ipa_token)
    return StripResult(
        token=ipa_token,
        stem_nucleus=_guess_nucleus(ipa_token),
        stem_tone=None,
        morpho_strip_applied="none",
        notes=[f"lang={lang} non mappé, pass-through"],
    )
