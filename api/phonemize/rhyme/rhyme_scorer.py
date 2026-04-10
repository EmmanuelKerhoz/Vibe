"""
rhyme_scorer.py — Lyricist v4.1 Étape F
Scoring L1/L2/L3/L4 explicites + score composite pondéré par famille.

Niveaux :
  L1  Identité phonémique parfaite           RN1 == RN2
  L2  Rime riche     onset ≠, nucleus+coda   identiques
  L3  Assonance      nucleus identique seul
  L4  Approximante   embedding cosine ≥ seuil
  L0  Allitération   onset identique (bonus, non-rime)

Score composite :
  final = w1·L1 + w2·L2 + w3·L3 + w4·L4
  Poids variables par famille ALGO.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional, Dict, Tuple
import re


# ── Seuils ───────────────────────────────────────────────────────────────────

L4_THRESHOLD     = 0.70   # score embedding minimum pour compter comme L4
L3_PARTIAL_SCORE = 0.75   # score assonance si noyau = noyau (sans coda)
L2_SCORE         = 0.90   # rime riche : onset diffère, nucleus+coda identiques
L1_SCORE         = 1.00   # identité parfaite


# ── Poids par famille ────────────────────────────────────────────────────────
# Format : (w_l1, w_l2, w_l3, w_l4)
# w_l1 = poids identité ; w_l4 = poids embedding (élevé pour langues tonales)

_FAMILY_WEIGHTS: Dict[str, Tuple[float, float, float, float]] = {
    "ALGO-ROM":  (1.0, 0.90, 0.70, 0.50),
    "ALGO-GER":  (1.0, 0.90, 0.65, 0.50),
    "ALGO-SLV":  (1.0, 0.90, 0.70, 0.50),
    "ALGO-SEM":  (1.0, 0.85, 0.70, 0.55),
    "ALGO-BNT":  (1.0, 0.85, 0.75, 0.60),
    "ALGO-KWA":  (1.0, 0.80, 0.80, 0.75),  # tonales : L4 boost
    "ALGO-CRV":  (1.0, 0.80, 0.75, 0.70),
    "ALGO-SIN":  (1.0, 0.85, 0.80, 0.75),
    "ALGO-JAP":  (1.0, 0.90, 0.75, 0.60),
    "ALGO-KOR":  (1.0, 0.90, 0.70, 0.55),
    "ALGO-IIR":  (1.0, 0.88, 0.72, 0.55),
    "ALGO-DRV":  (1.0, 0.88, 0.72, 0.60),
    "ALGO-TRK":  (1.0, 0.90, 0.70, 0.50),
    "ALGO-FIN":  (1.0, 0.88, 0.75, 0.50),
    "ALGO-TAI":  (1.0, 0.82, 0.80, 0.75),
    "ALGO-VIET": (1.0, 0.82, 0.80, 0.75),
    "ALGO-AUS":  (1.0, 0.80, 0.70, 0.55),
}
_DEFAULT_WEIGHTS = (1.0, 0.88, 0.70, 0.55)


# ── Structures de données ────────────────────────────────────────────────────

@dataclass
class RhymeLevel:
    level:   int     # 0=allitération, 1=identité, 2=riche, 3=assonance, 4=approx
    label:   str     # 'identity' | 'rich' | 'assonance' | 'approximate' | 'alliteration' | 'none'
    matched: str     # description de ce qui est partagé


@dataclass
class CompositeScore:
    score:           float
    level:           RhymeLevel
    family:          str
    onset1:          str
    nucleus1:        str
    coda1:           str
    onset2:          str
    nucleus2:        str
    coda2:           str
    tone1:           Optional[str]
    tone2:           Optional[str]
    tone_match:      Optional[bool]
    alliteration:    bool
    embedding_score: Optional[float] = None
    detail:          Dict = field(default_factory=dict)


# ── Normalisation ────────────────────────────────────────────────────────────

_DIACRITIC_RE = re.compile(r"[\u0300-\u036f]")

def _norm(s: str) -> str:
    """Normalise : minuscules, sans diacritiques (sauf tons intentionnels)."""
    return _DIACRITIC_RE.sub("", s.lower().strip())


# ── Scoring L1–L4 ────────────────────────────────────────────────────────────

def score_rhyme(
    onset1:    str,
    nucleus1:  str,
    coda1:     str,
    onset2:    str,
    nucleus2:  str,
    coda2:     str,
    family:    str    = "ALGO-ROM",
    tone1:     Optional[str] = None,
    tone2:     Optional[str] = None,
    embedding: Optional[float] = None,
) -> CompositeScore:
    """
    Calcule le score composite L1→L4 pour deux unités phonémiques.

    Args:
        onset1/2:    Attaque consonantique (peut être vide).
        nucleus1/2:  Noyau vocalique.
        coda1/2:     Coda consonantique (peut être vide).
        family:      Famille ALGO pour pondération.
        tone1/2:     Étiquette tonale optionnelle ('H', 'L', 'HL', …).
        embedding:   Score cosine niveau 4 pré-calculé (None = non disponible).

    Returns:
        CompositeScore avec score final, niveau détecté, et audit.
    """
    n1, n2 = _norm(nucleus1), _norm(nucleus2)
    c1, c2 = _norm(coda1),    _norm(coda2)
    o1, o2 = _norm(onset1),   _norm(onset2)

    w = _FAMILY_WEIGHTS.get(family, _DEFAULT_WEIGHTS)
    w_l1, w_l2, w_l3, w_l4 = w

    # ── Ton ──────────────────────────────────────────────────────────────────
    tone_match: Optional[bool] = None
    tone_penalty = 0.0
    tonal_families = {"ALGO-KWA", "ALGO-CRV", "ALGO-BNT", "ALGO-SIN",
                      "ALGO-TAI", "ALGO-VIET"}
    if family in tonal_families and tone1 and tone2:
        # Normalise H/MH → H, L/ML/M → L pour comparaison
        _T = {"H": "H", "MH": "H", "L": "L", "ML": "L", "M": "L",
              "HL": "HL", "LH": "LH"}
        t1n = _T.get(tone1.upper(), tone1.upper())
        t2n = _T.get(tone2.upper(), tone2.upper())
        tone_match = (t1n == t2n)
        if not tone_match:
            # Pénalité douce : -0.15 pour famille KWA/CRV, -0.10 pour autres tonales
            tone_penalty = 0.15 if family in {"ALGO-KWA", "ALGO-CRV"} else 0.10

    # ── Allitération (bonus L0, n'affecte pas le score rime) ─────────────────
    alliteration = bool(o1 and o2 and o1 == o2)

    rn1 = n1 + c1
    rn2 = n2 + c2

    # ── L1 : identité parfaite ───────────────────────────────────────────────
    if rn1 == rn2 and (not tone1 or not tone2 or tone_match is not False):
        level = RhymeLevel(1, "identity", f"RN='{rn1}'")
        final = w_l1 - tone_penalty
        return CompositeScore(
            score=round(max(0.0, final), 4), level=level, family=family,
            onset1=o1, nucleus1=n1, coda1=c1,
            onset2=o2, nucleus2=n2, coda2=c2,
            tone1=tone1, tone2=tone2, tone_match=tone_match,
            alliteration=alliteration,
            detail={"l1": True, "tone_penalty": tone_penalty},
        )

    # ── L2 : rime riche — onset diffère, nucleus+coda identiques ────────────
    if rn1 == rn2 and o1 != o2:
        level = RhymeLevel(2, "rich", f"nucleus+coda='{rn1}' onset_diff")
        final = w_l2 - tone_penalty
        return CompositeScore(
            score=round(max(0.0, final), 4), level=level, family=family,
            onset1=o1, nucleus1=n1, coda1=c1,
            onset2=o2, nucleus2=n2, coda2=c2,
            tone1=tone1, tone2=tone2, tone_match=tone_match,
            alliteration=alliteration,
            detail={"l2": True, "tone_penalty": tone_penalty},
        )

    # ── L3 : assonance — noyau identique, coda diffère ───────────────────────
    if n1 == n2 and c1 != c2:
        level = RhymeLevel(3, "assonance", f"nucleus='{n1}'")
        final = L3_PARTIAL_SCORE - tone_penalty
        return CompositeScore(
            score=round(max(0.0, final), 4), level=level, family=family,
            onset1=o1, nucleus1=n1, coda1=c1,
            onset2=o2, nucleus2=n2, coda2=c2,
            tone1=tone1, tone2=tone2, tone_match=tone_match,
            alliteration=alliteration,
            detail={"l3": True, "coda_diff": f"'{c1}'≠'{c2}'", "tone_penalty": tone_penalty},
        )

    # ── L4 : approximante — embedding cosine ─────────────────────────────────
    if embedding is not None and embedding >= L4_THRESHOLD:
        final = embedding * w_l4 - tone_penalty
        level = RhymeLevel(4, "approximate", f"cosine={embedding:.3f}")
        return CompositeScore(
            score=round(max(0.0, final), 4), level=level, family=family,
            onset1=o1, nucleus1=n1, coda1=c1,
            onset2=o2, nucleus2=n2, coda2=c2,
            tone1=tone1, tone2=tone2, tone_match=tone_match,
            alliteration=alliteration,
            embedding_score=embedding,
            detail={"l4": True, "embedding": embedding, "tone_penalty": tone_penalty},
        )

    # ── L0 : aucune rime (score résiduel si embedding faible) ────────────────
    emb_residual = (embedding or 0.0) * 0.3
    level = RhymeLevel(0, "none", "no match")
    return CompositeScore(
        score=round(max(0.0, emb_residual - tone_penalty), 4),
        level=level, family=family,
        onset1=o1, nucleus1=n1, coda1=c1,
        onset2=o2, nucleus2=n2, coda2=c2,
        tone1=tone1, tone2=tone2, tone_match=tone_match,
        alliteration=alliteration,
        embedding_score=embedding,
        detail={"l0": True, "emb_residual": emb_residual},
    )


# ── Utilitaires ──────────────────────────────────────────────────────────────

def rhyme_type_label(level: int) -> str:
    return {
        0: "none", 1: "identity", 2: "rich",
        3: "assonance", 4: "approximate",
    }.get(level, "none")


def categorize_score(score: float) -> str:
    """Rétrocompat v4.0 — mappe score continu sur catégorie textuelle."""
    if score >= 0.95: return "rich"
    if score >= 0.85: return "sufficient"
    if score >= 0.70: return "assonance"
    if score >= 0.40: return "weak"
    return "none"
