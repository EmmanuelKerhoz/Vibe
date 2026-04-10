"""
Tests — morpho_strip.py
"""
import pytest
from api.phonemize.rhyme.morpho_strip import strip_before_rn_extraction, strip_morphology


def test_no_strip_rom():
    result = strip_before_rn_extraction("monde", "fr", apply_strip=False)
    assert result.stripped == "monde"
    assert result.morpho_strip_applied is False


def test_turkic_suffix_tr():
    # "evler" = "ev" (house) + "ler" (plural)
    stripped, affix = strip_morphology("evler", "tr")
    assert stripped == "ev"
    assert affix == "ler"


def test_turkic_no_strip_short():
    # Too short to strip
    stripped, affix = strip_morphology("ev", "tr")
    assert stripped == "ev"
    assert affix == ""


def test_bantu_prefix_sw():
    stripped, affix = strip_morphology("watoto", "sw")  # wa- prefix
    assert affix == "wa"
    assert stripped == "toto"


def test_kwa_no_strip():
    # KWA — apply_strip=False should bypass
    result = strip_before_rn_extraction("awa", "bci", apply_strip=False)
    assert result.morpho_strip_applied is False
    assert result.stripped == "awa"


def test_audit_fields():
    result = strip_before_rn_extraction("evler", "tr")
    assert result.original == "evler"
    assert result.morpho_strip_applied is True
    assert result.affix_removed == "ler"
