"""
verse_segmenter.py — Lyricist v4.1 Remediation #1
Segmentation du vers en unités rimantes avant extraction du RN.

Modes:
  'end'      — unité de fin de vers uniquement (rétrocompat v4.0)
  'internal' — détecte aussi la césure interne
  'all'      — end + internal + début de vers (rap/slam/poésie africaine)
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Literal, Tuple
import re

SegmentMode = Literal["end", "internal", "all"]


@dataclass
class RhymingUnit:
    tokens: List[str]
    position: Literal["end", "internal", "start"]
    verse_index: int
    token_span: Tuple[int, int]


def segment_verse(
    verse: str,
    lang: str = "fr",
    mode: SegmentMode = "end",
    verse_index: int = 0,
) -> List[RhymingUnit]:
    """Segment a verse into rhyming units.

    Args:
        verse:       Raw verse text.
        lang:        BCP-47 language code (e.g. 'fr', 'bci', 'en').
        mode:        Segmentation mode — 'end' | 'internal' | 'all'.
        verse_index: Position of this verse in the stanza (for labelling).

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

    # End unit — always present
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


def _detect_internal_rhyme_positions(
    tokens: List[str], lang: str
) -> List[Tuple[int, int]]:
    """Heuristic internal rhyme detection.

    Currently: medial caesura if verse >= 6 tokens.
    TODO: per-language prosodic rules (alexandrin FR 6/6, EN ballad 4/3, etc.)
    """
    positions: List[Tuple[int, int]] = []
    n = len(tokens)
    if n >= 6:
        mid = n // 2
        positions.append((mid - 1, mid))
    return positions
