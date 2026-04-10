"""
Tests — rhyme_scheme_detector.py
"""
import pytest
from api.phonemize.rhyme.rhyme_scheme_detector import detect_scheme, SchemeResult


def _exact_scorer(t1: str, t2: str, lang: str) -> float:
    """Returns 1.0 if last 3 chars match, else 0.0."""
    return 1.0 if t1[-3:] == t2[-3:] else 0.0


def test_aabb():
    verses = ["chat", "rat", "bone", "stone"]
    result = detect_scheme(verses, _exact_scorer, threshold=0.9)
    assert result.scheme == "AABB"
    assert result.confidence >= 0.9


def test_abab():
    verses = ["night", "day", "light", "way"]
    result = detect_scheme(verses, _exact_scorer, threshold=0.9)
    assert result.scheme == "ABAB"


def test_single_verse_returns_unknown():
    result = detect_scheme(["alone"], _exact_scorer)
    assert result.scheme == "?"
    assert result.confidence == 0.0


def test_labels_length_matches_verses():
    verses = ["a", "b", "c", "d"]
    result = detect_scheme(verses, lambda a, b, l: 0.0)
    assert len(result.labels) == 4


def test_no_rhymes_all_different():
    verses = ["alpha", "bravo", "charlie", "delta"]
    result = detect_scheme(verses, lambda a, b, l: 0.0)
    assert result.pairs == []
