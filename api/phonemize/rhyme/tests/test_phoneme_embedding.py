"""
Tests — phoneme_embedding.py
"""
import pytest
import math
from api.phonemize.rhyme.phoneme_embedding import (
    score_embedding, rn_to_embedding, EmbeddingScore, _cosine, _DIM
)


def test_identical_rn_score_is_one():
    result = score_embedding(["a", "H"], ["a", "H"])
    assert result.score == pytest.approx(1.0, abs=1e-4)


def test_zero_rn_score_is_zero():
    result = score_embedding([], [])
    assert result.score == 0.0


def test_method_static():
    result = score_embedding(["a"], ["i"])
    assert result.method == "embedding-static"


def test_method_neural():
    class FakeEncoder:
        def encode(self, phones):
            return [1.0, 0.0, 0.0, 0.0, 0.0]

    result = score_embedding(["a"], ["a"], neural_model=FakeEncoder())
    assert result.method == "embedding-neural"
    assert result.score == pytest.approx(1.0, abs=1e-4)


def test_embedding_dim():
    emb = rn_to_embedding(["a", "n"])
    assert len(emb) == _DIM


def test_vowel_tone_similarity():
    # aH vs aL — same vowel, opposite tone → score < 1
    result = score_embedding(["a", "H"], ["a", "L"])
    assert 0.0 < result.score < 1.0


def test_cosine_orthogonal():
    v1 = [1.0, 0.0, 0.0, 0.0, 0.0]
    v2 = [0.0, 1.0, 0.0, 0.0, 0.0]
    assert _cosine(v1, v2) == pytest.approx(0.0, abs=1e-6)
