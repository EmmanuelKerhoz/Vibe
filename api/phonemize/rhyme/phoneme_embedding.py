"""
phoneme_embedding.py — Lyricist v4.1 Remediation #5
Scoring niveau 4 : cosine similarity sur embeddings phonémiques.

Priorité d'activation : ALGO-KWA, ALGO-CRV, ALGO-SIN, ALGO-TAI, ALGO-VIET.

Embeddings statiques PHOIBLE-lite (dim=5) :
  [voisement, lieu_articulation, mode_articulation, nasalité, hauteur_tonale]
Hook ouvert pour encodeur neural (passer un NeuralEncoder).
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Literal, Optional, Protocol
import math

# ─── PHOIBLE-lite feature vectors (dim=5) ────────────────────────────────────
# [voicing, place, manner, nasality, tone_height]
# All values normalised to [0.0, 1.0]

_PHONEME_VECTORS: Dict[str, List[float]] = {
    # Vowels
    "a":    [0.0, 0.50, 0.80, 0.0, 0.00],
    "a\u02d0": [0.0, 0.50, 0.80, 0.0, 0.10],
    "e":    [0.0, 0.80, 0.60, 0.0, 0.00],
    "\u025b":    [0.0, 0.70, 0.65, 0.0, 0.00],
    "i":    [0.0, 1.00, 0.30, 0.0, 0.00],
    "i\u02d0": [0.0, 1.00, 0.30, 0.0, 0.10],
    "o":    [0.0, 0.30, 0.60, 0.0, 0.50],
    "\u0254":    [0.0, 0.20, 0.70, 0.0, 0.50],
    "u":    [0.0, 0.10, 0.30, 0.0, 1.00],
    "u\u02d0": [0.0, 0.10, 0.30, 0.0, 1.00],
    # Stops
    "p":    [0.0, 0.00, 0.00, 0.0, 0.00],
    "b":    [1.0, 0.00, 0.00, 0.0, 0.00],
    "t":    [0.0, 0.30, 0.00, 0.0, 0.00],
    "d":    [1.0, 0.30, 0.00, 0.0, 0.00],
    "k":    [0.0, 0.70, 0.00, 0.0, 0.00],
    "g":    [1.0, 0.70, 0.00, 0.0, 0.00],
    # Nasals
    "m":    [1.0, 0.00, 0.00, 1.0, 0.00],
    "n":    [1.0, 0.30, 0.00, 1.0, 0.00],
    "\u014b":    [1.0, 0.70, 0.00, 1.0, 0.00],
    # Fricatives
    "s":    [0.0, 0.35, 0.50, 0.0, 0.00],
    "z":    [1.0, 0.35, 0.50, 0.0, 0.00],
    "f":    [0.0, 0.10, 0.45, 0.0, 0.00],
    "v":    [1.0, 0.10, 0.45, 0.0, 0.00],
    # Sonorants
    "l":    [1.0, 0.30, 0.90, 0.0, 0.00],
    "r":    [1.0, 0.35, 0.85, 0.0, 0.00],
    # Tone markers (KWA/CRV — binary H/L after normalize_tone)
    "H":    [0.0, 0.00, 0.00, 0.0, 1.00],
    "M":    [0.0, 0.00, 0.00, 0.0, 0.50],
    "L":    [0.0, 0.00, 0.00, 0.0, 0.00],
    "HL":   [0.0, 0.00, 0.00, 0.0, 0.70],
    "LH":   [0.0, 0.00, 0.00, 0.0, 0.30],
}

_DIM = 5
_ZERO_VEC: List[float] = [0.0] * _DIM


class NeuralEncoder(Protocol):
    """Protocol for optional neural phoneme encoder."""
    def encode(self, phones: List[str]) -> List[float]: ...


@dataclass
class EmbeddingScore:
    score: float
    method: Literal["embedding-static", "embedding-neural"]
    embedding_rn1: List[float] = field(default_factory=list)
    embedding_rn2: List[float] = field(default_factory=list)


def _phoneme_to_vector(phone: str) -> List[float]:
    return list(_PHONEME_VECTORS.get(phone, _ZERO_VEC))


def rn_to_embedding(rn_phones: List[str]) -> List[float]:
    """Average PHOIBLE-lite vectors over the rhyme nucleus phone sequence."""
    if not rn_phones:
        return list(_ZERO_VEC)
    vecs = [_phoneme_to_vector(p) for p in rn_phones]
    return [sum(v[i] for v in vecs) / len(vecs) for i in range(_DIM)]


def _cosine(v1: List[float], v2: List[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    n1 = math.sqrt(sum(a * a for a in v1))
    n2 = math.sqrt(sum(b * b for b in v2))
    if n1 == 0.0 or n2 == 0.0:
        return 0.0
    return round(dot / (n1 * n2), 6)


def score_embedding(
    rn1: List[str],
    rn2: List[str],
    neural_model: Optional[NeuralEncoder] = None,
) -> EmbeddingScore:
    """Compute embedding similarity between two rhyme nucleus phone sequences.

    Args:
        rn1:          Phone list for rhyme nucleus 1.
        rn2:          Phone list for rhyme nucleus 2.
        neural_model: Optional NeuralEncoder — overrides static PHOIBLE-lite.

    Returns:
        EmbeddingScore with cosine similarity and method tag.
    """
    if neural_model is not None:
        emb1 = neural_model.encode(rn1)
        emb2 = neural_model.encode(rn2)
        method: Literal["embedding-static", "embedding-neural"] = "embedding-neural"
    else:
        emb1 = rn_to_embedding(rn1)
        emb2 = rn_to_embedding(rn2)
        method = "embedding-static"

    return EmbeddingScore(
        score=_cosine(emb1, emb2),
        method=method,
        embedding_rn1=emb1,
        embedding_rn2=emb2,
    )
