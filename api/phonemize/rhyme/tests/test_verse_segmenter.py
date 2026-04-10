"""
Tests — verse_segmenter.py
"""
import pytest
from api.phonemize.rhyme.verse_segmenter import segment_verse, RhymingUnit


def test_end_mode_basic():
    units = segment_verse("le soleil brille fort", lang="fr", mode="end")
    assert len(units) == 1
    assert units[0].position == "end"
    assert units[0].tokens == ["fort"]


def test_end_mode_rn_token():
    units = segment_verse("dans la nuit profonde", lang="fr", mode="end")
    assert units[-1].tokens == ["profonde"]


def test_internal_mode_short_verse_no_internal():
    # < 6 tokens → no internal unit expected
    units = segment_verse("veni vidi vici", lang="en", mode="internal")
    positions = [u.position for u in units]
    assert "internal" not in positions
    assert "end" in positions


def test_internal_mode_long_verse():
    units = segment_verse("le vent souffle fort sur les plaines", lang="fr", mode="internal")
    positions = [u.position for u in units]
    assert "internal" in positions
    assert "end" in positions


def test_all_mode_includes_start():
    units = segment_verse("la lune et le soleil dansent", lang="fr", mode="all")
    positions = [u.position for u in units]
    assert "start" in positions
    assert "internal" in positions
    assert "end" in positions


def test_empty_verse():
    units = segment_verse("", lang="fr", mode="all")
    assert units == []


def test_verse_index_propagated():
    units = segment_verse("abcde fghij klmno", lang="en", mode="end", verse_index=3)
    assert all(u.verse_index == 3 for u in units)
