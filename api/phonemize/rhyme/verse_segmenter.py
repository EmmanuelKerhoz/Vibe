"""
verse_segmenter.py — Lyricist v4.1 Étape E
Segmentation du vers en unités rimantes avant extraction du RN.

Modes:
  'end'      — unité de fin de vers uniquement (rétrocompat v4.0)
  'internal' — détecte aussi la césure interne (règles prosodiques par famille)
  'all'      — end + internal + début de vers (rap/slam/poésie africaine)

Règles de césure implémentées :
  fr  — alexandrin 6/6 (12 tokens → mid=6), décasyllabe 4/6
  en  — ballad meter 4/3, blank verse 5 iambs (heuristique)
  ar  — hémistiche classique (شطر) : mi-vers strict
  bci/dyu/ee/gej — poésie KWA : césure après groupe CV tonal
  ha/bkv/ijn/iko — CRV : césure après 4e syllabe
  autres — heuristique générique n//2
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Literal, Tuple
import re

SegmentMode = Literal["end", "internal", "all"]

# Familles et leurs codes langue
_KWA_LANGS  = {"bci", "dyu", "ee", "gej", "tw", "ak"}
_CRV_LANGS  = {"ha", "bkv", "ijn", "iko", "yo"}
_ROM_LANGS  = {"fr", "es", "it", "pt", "ro", "ca"}
_GER_LANGS  = {"en", "de", "nl", "sv", "da", "no"}
_SEM_LANGS  = {"ar", "he", "am"}


@dataclass
class RhymingUnit:
    tokens:      List[str]
    position:    Literal["end", "internal", "start"]
    verse_index: int
    token_span:  Tuple[int, int]


def segment_verse(
    verse: str,
    lang: str = "fr",
    mode: SegmentMode = "end",
    verse_index: int = 0,
) -> List[RhymingUnit]:
    """
    Segment a verse into rhyming units.

    Args:
        verse:       Raw verse text.
        lang:        BCP-47 language code.
        mode:        'end' | 'internal' | 'all'
        verse_index: Position in stanza (for labelling).

    Returns:
        Ordered list of RhymingUnit, end-unit always last.
    """
    tokens = _tokenize(verse, lang)
    n = len(tokens)
    units: List[RhymingUnit] = []

    if mode in ("internal", "all"):
        for span in _detect_internal_rhyme_positions(tokens, lang):
            units.append(RhymingUnit(
                tokens=tokens[span[0]:span[1]],
                position="internal",
                verse_index=verse_index,
                token_span=span,
            ))

    if mode == "all" and n > 0:
        units.append(RhymingUnit(
            tokens=tokens[:1],
            position="start",
            verse_index=verse_index,
            token_span=(0, 1),
        ))

    if n > 0:
        units.append(RhymingUnit(
            tokens=tokens[-1:],
            position="end",
            verse_index=verse_index,
            token_span=(n - 1, n),
        ))

    return units


def _tokenize(verse: str, lang: str) -> List[str]:
    normalized = verse.strip().lower()
    normalized = re.sub(r"[\u2018\u2019\u0060]", "'", normalized)
    if lang == "fr":
        normalized = re.sub(r"\b(c|j|l|m|n|qu|s|t)'", r"\1'", normalized)
    return [t for t in re.findall(r"[\w'\-]+", normalized) if t]


def _syllable_count_estimate(token: str) -> int:
    """Estimation rapide du nombre de syllabes par comptage vocalique."""
    return max(1, len(re.findall(r"[aeiouæɑɔɛɪʊəɨøœy]", token.lower())))


def _detect_internal_rhyme_positions(
    tokens: List[str], lang: str
) -> List[Tuple[int, int]]:
    """
    Détecte la ou les positions de césure interne selon les règles prosodiques
    de la famille linguistique.

    Retourne une liste de spans (start, end) représentant le token(s)
    à la position de césure.
    """
    n = len(tokens)
    if n < 3:
        return []

    lang = lang.lower()

    # ── Français : alexandrin (12 syllabes → 6/6) et décasyllabe (4/6) ──────
    if lang == "fr":
        syll_counts = [_syllable_count_estimate(t) for t in tokens]
        total = sum(syll_counts)
        if total >= 10:
            target = total // 2  # 6 pour alexandrin, 5 pour décasyllabe
            cumul, cut = 0, -1
            for i, sc in enumerate(syll_counts):
                cumul += sc
                if cumul >= target and i < n - 1:
                    cut = i
                    break
            if 0 < cut < n - 1:
                return [(cut, cut + 1)]
        # Vers court ou libre : mi-vers si ≥ 5 tokens
        if n >= 5:
            return [(n // 2 - 1, n // 2)]
        return []

    # ── Anglais : ballad 4/3, blank verse ────────────────────────────────────
    if lang == "en":
        syll_counts = [_syllable_count_estimate(t) for t in tokens]
        total = sum(syll_counts)
        # Ballad meter : 4 iambs + 3 iambs → césure après ~4 syllabes
        if 6 <= total <= 8:
            target = 4
            cumul, cut = 0, -1
            for i, sc in enumerate(syll_counts):
                cumul += sc
                if cumul >= target and i < n - 1:
                    cut = i
                    break
            if 0 < cut < n - 1:
                return [(cut, cut + 1)]
        # Blank verse / free verse
        if n >= 5:
            return [(n // 2 - 1, n // 2)]
        return []

    # ── Arabe : hémistiche (شطر) — mi-vers strict ────────────────────────────
    if lang in _SEM_LANGS:
        if n >= 4:
            mid = n // 2
            return [(mid - 1, mid)]
        return []

    # ── KWA (bci/dyu/ee/gej) : césure après groupe tonal ────────────────────
    # Heuristique : on cherche un token se terminant par voyelle tonée
    if lang in _KWA_LANGS:
        tonal_re = re.compile(r"[áéíóúàèìòùâêîôû]")
        cut = -1
        mid = n // 2
        # Cherche le token tonal le plus proche du milieu
        for radius in range(0, mid + 1):
            for idx in (mid - radius, mid + radius):
                if 0 < idx < n - 1 and tonal_re.search(tokens[idx]):
                    cut = idx
                    break
            if cut >= 0:
                break
        if cut < 0:
            cut = mid  # fallback
        if 0 < cut < n - 1:
            return [(cut, cut + 1)]
        return []

    # ── CRV (ha/bkv/ijn/iko) : césure après 4e syllabe ──────────────────────
    if lang in _CRV_LANGS:
        syll_counts = [_syllable_count_estimate(t) for t in tokens]
        target = 4
        cumul, cut = 0, -1
        for i, sc in enumerate(syll_counts):
            cumul += sc
            if cumul >= target and i < n - 1:
                cut = i
                break
        if 0 < cut < n - 1:
            return [(cut, cut + 1)]
        return []

    # ── Générique : mi-vers si ≥ 5 tokens ────────────────────────────────────
    if n >= 5:
        mid = n // 2
        return [(mid - 1, mid)]
    return []
