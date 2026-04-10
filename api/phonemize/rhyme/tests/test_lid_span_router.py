"""
Tests — lid_span_router.py
"""
import pytest
from api.phonemize.rhyme.lid_span_router import detect_spans, LangSpan


def test_no_predictor_single_span():
    spans = detect_spans("bonjour le monde", doc_lang="fr")
    assert len(spans) == 1
    assert spans[0].lang == "fr"
    assert spans[0].family == "ALGO-ROM"
    assert spans[0].low_resource is False


def test_fallback_on_low_confidence():
    def low_conf_predictor(token):
        return ("en", 0.3)  # below threshold
    spans = detect_spans("bonjour monde", doc_lang="fr", lid_predictor=low_conf_predictor)
    assert all(s.lang == "fr" for s in spans)


def test_code_switch_detection():
    tokens = ["salut", "hello", "salut"]
    verse = " ".join(tokens)
    lang_sequence = ["fr", "en", "fr"]

    def predictor(token):
        idx = tokens.index(token)
        return (lang_sequence[idx], 0.95)

    spans = detect_spans(verse, doc_lang="fr", lid_predictor=predictor)
    langs = [s.lang for s in spans]
    assert "en" in langs
    assert "fr" in langs


def test_low_resource_flag():
    spans = detect_spans("text", doc_lang="bkv")
    assert spans[0].low_resource is True


def test_kwa_family():
    spans = detect_spans("awa bci", doc_lang="bci")
    assert spans[0].family == "ALGO-KWA"
