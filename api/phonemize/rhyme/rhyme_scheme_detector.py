"""
rhyme_scheme_detector.py — Lyricist v4.1 Remediation #2
Détection de schémas de rime sur un bloc de N vers.

Schémas reconnus : AABB, ABAB, ABBA, ABCB, AAAA, ABCC.
Accepte n'importe quel scorer (text1, text2, lang) -> float.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional, Tuple

ScorerFn = Callable[[str, str, str], float]

SCHEME_PATTERNS: Dict[str, List[Tuple[int, int]]] = {
    "AABB": [(0, 1), (2, 3)],
    "ABAB": [(0, 2), (1, 3)],
    "ABBA": [(0, 3), (1, 2)],
    "ABCB": [(1, 3)],
    "AAAA": [(0, 1), (1, 2), (2, 3)],
    "ABCC": [(2, 3)],
}


@dataclass
class SchemeResult:
    scheme: str
    confidence: float
    pairs: List[Tuple[int, int, float]]  # (i, j, score)
    labels: List[str]


def detect_scheme(
    verses: List[str],
    scorer: ScorerFn,
    lang: str = "fr",
    threshold: float = 0.75,
) -> SchemeResult:
    """Detect the rhyme scheme of a verse block.

    Args:
        verses:    List of verse strings (end tokens or full verses).
        scorer:    (text1, text2, lang) -> similarity score in [0, 1].
        lang:      Language code, passed to scorer.
        threshold: Minimum score to consider two verses rhyming.

    Returns:
        SchemeResult with scheme name, confidence, rhyming pairs, and labels.
    """
    n = len(verses)
    if n < 2:
        return SchemeResult(scheme="?", confidence=0.0, pairs=[], labels=["A"] * n)

    # Build pairwise score matrix
    matrix: Dict[Tuple[int, int], float] = {}
    for i in range(n):
        for j in range(i + 1, n):
            matrix[(i, j)] = scorer(verses[i], verses[j], lang)

    labels = _assign_labels(n, matrix, threshold)
    scheme, confidence = _match_known_scheme(labels, n, matrix)

    pairs = [
        (i, j, s)
        for (i, j), s in matrix.items()
        if s >= threshold
    ]

    return SchemeResult(
        scheme=scheme,
        confidence=round(confidence, 4),
        pairs=pairs,
        labels=labels,
    )


def _assign_labels(
    n: int,
    matrix: Dict[Tuple[int, int], float],
    threshold: float,
) -> List[str]:
    labels = ["?"] * n
    code = ord("A")
    for i in range(n):
        if labels[i] != "?":
            continue
        labels[i] = chr(code)
        for j in range(i + 1, n):
            if labels[j] == "?" and matrix.get((i, j), 0.0) >= threshold:
                labels[j] = chr(code)
        code += 1
    return labels


def _match_known_scheme(
    labels: List[str],
    n: int,
    matrix: Dict[Tuple[int, int], float],
) -> Tuple[str, float]:
    label_str = "".join(labels[:4])
    for scheme, pairs in SCHEME_PATTERNS.items():
        scheme_prefix = scheme[:n]
        if label_str[:len(scheme_prefix)] == scheme_prefix or scheme.startswith(label_str[:len(scheme)]):
            valid_pairs = [(a, b) for (a, b) in pairs if max(a, b) < n]
            if valid_pairs:
                scores = [matrix.get((min(a, b), max(a, b)), 0.0) for a, b in valid_pairs]
                confidence = sum(scores) / len(scores)
            else:
                confidence = 0.5
            return scheme, confidence
    return label_str, 0.5
