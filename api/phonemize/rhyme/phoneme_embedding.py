# phoneme_embedding.py  v2.0
# Scoring niveau 4 : PHOIBLE-lite dim=6 + contours HL Hausa/CRV
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
import math

@dataclass
class ToneVector:
    """Représentation vectorielle du ton : scalaire pour niveaux, 2D pour contours."""
    onset: float    # H=1.0, M=0.5, L=0.0
    offset: float   # = onset si ton niveau ; ≠ onset si contour HL/LH
    is_contour: bool = False

    @classmethod
    def from_label(cls, label: str) -> "ToneVector":
        """
        Accepte : "H", "L", "M", "MH", "ML", "HL", "LH"
        CRV Hausa : "HL" → contour onset=1.0, offset=0.0
        """
        label = label.upper()
        MAP = {"H": 1.0, "M": 0.5, "L": 0.0, "MH": 0.75, "ML": 0.25}
        if label in MAP:
            v = MAP[label]
            return cls(onset=v, offset=v, is_contour=False)
        if label == "HL":
            return cls(onset=1.0, offset=0.0, is_contour=True)
        if label == "LH":
            return cls(onset=0.0, offset=1.0, is_contour=True)
        return cls(onset=0.5, offset=0.5, is_contour=False)

    def similarity(self, other: "ToneVector") -> float:
        """
        Cosine 2D normalisé sur [0,1].
        Ton niveau vs contour : pénalité via match partiel sur onset.
        """
        if self.is_contour != other.is_contour:
            return 0.5 * (1.0 - abs(self.onset - other.onset))
        dot = self.onset * other.onset + self.offset * other.offset
        mag_a = math.sqrt(self.onset**2 + self.offset**2) or 1e-9
        mag_b = math.sqrt(other.onset**2 + other.offset**2) or 1e-9
        return dot / (mag_a * mag_b)


# ── Vecteurs PHOIBLE-lite (dim=6) ───────────────────────────────────────────
# [voicing, place, manner, nasality, tone_onset, tone_offset]

_PHOIBLE_VECTORS: dict[str, list[float]] = {
    "p": [0.0, 0.3, 0.1, 0.0, 0.0, 0.0],
    "b": [1.0, 0.3, 0.1, 0.0, 0.0, 0.0],
    "t": [0.0, 0.5, 0.1, 0.0, 0.0, 0.0],
    "d": [1.0, 0.5, 0.1, 0.0, 0.0, 0.0],
    "k": [0.0, 0.8, 0.1, 0.0, 0.0, 0.0],
    "g": [1.0, 0.8, 0.1, 0.0, 0.0, 0.0],
    "m": [1.0, 0.3, 0.2, 1.0, 0.0, 0.0],
    "n": [1.0, 0.5, 0.2, 1.0, 0.0, 0.0],
    "l": [1.0, 0.5, 0.5, 0.0, 0.0, 0.0],
    "r": [1.0, 0.5, 0.6, 0.0, 0.0, 0.0],
    "s": [0.0, 0.5, 0.3, 0.0, 0.0, 0.0],
    "z": [1.0, 0.5, 0.3, 0.0, 0.0, 0.0],
    "f": [0.0, 0.4, 0.3, 0.0, 0.0, 0.0],
    "v": [1.0, 0.4, 0.3, 0.0, 0.0, 0.0],
    "a": [1.0, 0.5, 0.1, 0.0, 0.0, 0.0],
    "e": [1.0, 0.2, 0.7, 0.0, 0.0, 0.0],
    "i": [1.0, 0.1, 1.0, 0.0, 0.0, 0.0],
    "o": [1.0, 0.7, 0.7, 0.0, 0.0, 0.0],
    "u": [1.0, 0.9, 1.0, 0.0, 0.0, 0.0],
    "ɛ": [1.0, 0.2, 0.5, 0.0, 0.0, 0.0],
    "ɔ": [1.0, 0.7, 0.5, 0.0, 0.0, 0.0],
    "ɪ": [1.0, 0.15, 0.85, 0.0, 0.0, 0.0],
    "ʊ": [1.0, 0.85, 0.85, 0.0, 0.0, 0.0],
}

def _get_vector(phone: str) -> list[float]:
    return _PHOIBLE_VECTORS.get(phone, [0.5] * 6)

def _cosine(v1: list[float], v2: list[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    m1 = math.sqrt(sum(a**2 for a in v1)) or 1e-9
    m2 = math.sqrt(sum(b**2 for b in v2)) or 1e-9
    return dot / (m1 * m2)

def _inject_tone(vec: list[float], tone: ToneVector) -> list[float]:
    """Injecte le vecteur tonal dans les dimensions 4-5."""
    return vec[:4] + [tone.onset, tone.offset]


@dataclass
class EmbeddingScore:
    score: float
    tone_similarity: float
    phoneme_similarity: float
    method: str
    notes: list[str]


def score_embedding(
    rn1_phones: list[str],
    rn2_phones: list[str],
    tone1: Optional[str] = None,
    tone2: Optional[str] = None,
    lang: str = "",
    neural_model=None,
) -> EmbeddingScore:
    """
    Scoring niveau 4 (embedding).
    - neural_model fourni → délègue (hook ouvert).
    - Sinon : PHOIBLE-lite dim=6 avec contours HL Hausa/CRV.
    Activation prioritaire : KWA (EW/MI), CRV (HA/CB), SIN, TAI, VIET.
    """
    if neural_model is not None:
        raw = neural_model.score(rn1_phones, rn2_phones)
        return EmbeddingScore(
            score=float(raw),
            tone_similarity=0.0,
            phoneme_similarity=float(raw),
            method="neural",
            notes=["neural_model delegate"],
        )

    phones1 = rn1_phones if rn1_phones else ["a"]
    phones2 = rn2_phones if rn2_phones else ["a"]
    pairs = list(zip(phones1, phones2))
    if not pairs:
        return EmbeddingScore(0.0, 0.0, 0.0, "phoible_lite", ["empty phones"])

    phon_scores = [_cosine(_get_vector(p1), _get_vector(p2)) for p1, p2 in pairs]
    phon_sim = sum(phon_scores) / len(phon_scores)

    tone_sim = 1.0
    notes = []
    if tone1 and tone2:
        tv1 = ToneVector.from_label(tone1)
        tv2 = ToneVector.from_label(tone2)
        tone_sim = tv1.similarity(tv2)
        if tv1.is_contour or tv2.is_contour:
            notes.append(
                f"contour_tone: {tone1}↔{tone2} → tone_sim={tone_sim:.3f} "
                f"(lang={lang or 'unspecified'})"
            )

    tonal_langs = {"EW", "MI", "BA", "DI", "HA", "CB", "ZH", "YUE", "TH", "LO", "VI"}
    w_phon, w_tone = (0.6, 0.4) if lang.upper() in tonal_langs else (0.8, 0.2)

    final = w_phon * phon_sim + w_tone * tone_sim

    return EmbeddingScore(
        score=round(final, 4),
        tone_similarity=round(tone_sim, 4),
        phoneme_similarity=round(phon_sim, 4),
        method="phoible_lite_v2",
        notes=notes or [f"weights: phon={w_phon} tone={w_tone}"],
    )
