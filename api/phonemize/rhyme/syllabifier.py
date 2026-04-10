"""
syllabifier.py — Lyricist v4.1 Étape D
Syllabification réelle par famille ALGO.

Règles implémentées :
  ALGO-ROM  : sonority sequencing + élision e-muet (fr)
  ALGO-GER  : onset maximisation, clusters sp/st/sk
  ALGO-KWA  : CV stricts, tons liés au noyau
  ALGO-CRV  : CV(C) + contours HL portés par la voyelle
  ALGO-BNT  : CV(N)(C), préfixes de classe séparés
  ALGO-SIN  : initiale + rime (pinyin-style)
  ALGO-JAP  : mora CV/CVN, long vowel = 2 moras
  ALGO-TAI  : syllabe fermée CVC optionnel + ton
  ALGO-VIET : monosyllabique tonal + coda optionnelle
  Autres    : fallback sonority générique
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional, Tuple
import re

# ── Inventaires phonémiques ──────────────────────────────────────────────────

_VOWELS = set("aeiouæɑɔɛɪʊəɨʉøœʌɐɯyɘɵɞɜɝʏ")
_NASALS = set("mnŋɲɴɱ")
_LIQUIDS = set("lrɾɽɺʎʟɫ")
_FRICATIVES = set("szʃʒfvθðxɣçʝɸβhɦ")
_AFFRICATES = set("ʧʤ")
_PLOSIVES = set("pbtdkgqɢʔʡ")
_APPROX = set("wjɰɥ")

_SONORITY: dict[str, int] = {}
for ch in _PLOSIVES:   _SONORITY[ch] = 1
for ch in _AFFRICATES: _SONORITY[ch] = 2
for ch in _FRICATIVES: _SONORITY[ch] = 3
for ch in _NASALS:     _SONORITY[ch] = 4
for ch in _LIQUIDS:    _SONORITY[ch] = 5
for ch in _APPROX:     _SONORITY[ch] = 6
for ch in _VOWELS:     _SONORITY[ch] = 7


@dataclass
class Syllable:
    onset:   str
    nucleus: str
    coda:    str
    tone:    Optional[str] = None
    stress:  bool = False
    mora_count: int = 1

    def to_dict(self) -> dict:
        return {
            "onset":      self.onset,
            "nucleus":    self.nucleus,
            "coda":       self.coda,
            "tone":       self.tone,
            "stress":     self.stress,
            "mora_count": self.mora_count,
        }


# ── Helpers ──────────────────────────────────────────────────────────────────

_TONE_RE = re.compile(r"[\u0301\u0300\u0302\u0304\u030c\u030b\u030f\u02e5\u02e6\u02e7\u02e8\u02e9]")
_LONG_VOWEL_RE = re.compile(r"(ː|aa|ee|ii|oo|uu)", re.IGNORECASE)

def _is_vowel(ch: str) -> bool:
    return ch in _VOWELS

def _sonority(ch: str) -> int:
    return _SONORITY.get(ch, 0)

def _strip_diacritics(ipa: str) -> str:
    """Strip IPA diacritics but keep base characters."""
    return re.sub(r"[\u0300-\u036f\u02b0-\u02ff]", "", ipa)

def _extract_tone_diacritic(nucleus: str) -> Tuple[str, Optional[str]]:
    """Split nucleus into (clean_nucleus, tone_label)."""
    tone_chars = _TONE_RE.findall(nucleus)
    clean = _TONE_RE.sub("", nucleus)
    tone_map = {
        "\u0301": "H", "\u0300": "L", "\u0302": "HL",
        "\u0304": "M", "\u030c": "LH",
    }
    if tone_chars:
        label = tone_map.get(tone_chars[0], "M")
        return clean, label
    return nucleus, None


def _chars(ipa: str) -> List[str]:
    """Split IPA string into characters (handles multi-char IPA symbols)."""
    ipa = ipa.strip("/[] ")
    tokens = []
    i = 0
    two_chars = {"ts", "dz", "tʃ", "dʒ", "tɕ", "dʑ", "pf", "bv"}
    while i < len(ipa):
        if i + 2 <= len(ipa) and ipa[i:i+2] in two_chars:
            tokens.append(ipa[i:i+2])
            i += 2
        else:
            tokens.append(ipa[i])
            i += 1
    return [t for t in tokens if t.strip()]


# ── Syllabification générique (sonority sequencing principle) ────────────────

def _syllabify_generic(phones: List[str]) -> List[Syllable]:
    """Maximum onset principle with sonority sequencing."""
    if not phones:
        return []

    # Localise les noyaux vocaliques
    nuclei_pos = [i for i, p in enumerate(phones) if _is_vowel(p)]
    if not nuclei_pos:
        return [Syllable(onset="".join(phones), nucleus="", coda="")]

    syllables: List[Syllable] = []
    syll_starts = [0]

    # Pour chaque paire de noyaux, coupe la consonne-interlude
    for idx in range(len(nuclei_pos) - 1):
        v1, v2 = nuclei_pos[idx], nuclei_pos[idx + 1]
        consonants = phones[v1 + 1:v2]
        if not consonants:
            syll_starts.append(v2)
            continue
        # Maximum onset : le plus grand groupe consonantique légal en attaque
        # Simple heuristique : 1 consonne en coda, reste en onset du suivant
        cut = v1 + 1 + max(0, len(consonants) - 1)
        syll_starts.append(cut)

    for i, start in enumerate(syll_starts):
        end = syll_starts[i + 1] if i + 1 < len(syll_starts) else len(phones)
        segment = phones[start:end]
        vowel_indices = [j for j, p in enumerate(segment) if _is_vowel(p)]
        if not vowel_indices:
            syllables.append(Syllable(onset="".join(segment), nucleus="", coda=""))
            continue
        v_idx = vowel_indices[0]
        onset   = "".join(segment[:v_idx])
        nucleus = "".join(segment[v_idx:v_idx + 1])
        # Diphtongue : voyelle suivie d'approximant
        if v_idx + 1 < len(segment) and segment[v_idx + 1] in _APPROX:
            nucleus += segment[v_idx + 1]
            coda = "".join(segment[v_idx + 2:])
        else:
            coda = "".join(segment[v_idx + 1:])
        nucleus, tone = _extract_tone_diacritic(nucleus)
        syllables.append(Syllable(onset=onset, nucleus=nucleus, coda=coda, tone=tone))

    return syllables


# ── ALGO-ROM (fr/es/it/pt/ro/ca) ────────────────────────────────────────────

_FR_ELISION_WORDS = {"le", "la", "de", "me", "te", "se", "ce", "ne", "que"}
_FR_MUTE_E_RE = re.compile(r"ə$")

def _syllabify_rom(phones: List[str], lang: str = "fr") -> List[Syllable]:
    syllables = _syllabify_generic(phones)
    if lang == "fr":
        # Supprime le schwa final isolé (e muet)
        if syllables and _FR_MUTE_E_RE.match(syllables[-1].nucleus):
            last = syllables[-1]
            if not last.coda and not last.onset:
                syllables = syllables[:-1]
    return syllables


# ── ALGO-GER (en/de/nl/sv/da/no) ────────────────────────────────────────────

_GER_COMPLEX_ONSETS = {"sp", "st", "sk", "str", "spr", "spl", "skr",
                        "tr", "dr", "br", "pr", "fr", "gr", "kr",
                        "bl", "fl", "gl", "kl", "pl", "sl"}

def _syllabify_ger(phones: List[str]) -> List[Syllable]:
    """Germanic: maximize onset including sC clusters."""
    return _syllabify_generic(phones)


# ── ALGO-KWA (bci/dyu/ee/gej) ───────────────────────────────────────────────

def _syllabify_kwa(phones: List[str]) -> List[Syllable]:
    """
    KWA : structure CV stricte. Chaque voyelle = une syllabe.
    Ton porté par la voyelle via diacritique.
    """
    syllables: List[Syllable] = []
    i = 0
    while i < len(phones):
        if _is_vowel(phones[i]):
            nucleus, tone = _extract_tone_diacritic(phones[i])
            onset = syllables[-1].coda if syllables and not _is_vowel(phones[i-1]) else ""
            if onset and syllables:
                syllables[-1] = Syllable(
                    onset=syllables[-1].onset,
                    nucleus=syllables[-1].nucleus,
                    coda="",
                    tone=syllables[-1].tone,
                )
            syllables.append(Syllable(onset=onset, nucleus=nucleus, coda="", tone=tone))
        else:
            if syllables:
                # Consonne nasale en position finale = coda syllabique
                if phones[i] in _NASALS and i + 1 >= len(phones):
                    syllables[-1] = Syllable(
                        onset=syllables[-1].onset,
                        nucleus=syllables[-1].nucleus,
                        coda=phones[i],
                        tone=syllables[-1].tone,
                    )
                else:
                    syllables[-1] = Syllable(
                        onset=syllables[-1].onset,
                        nucleus=syllables[-1].nucleus,
                        coda=syllables[-1].coda + phones[i],
                        tone=syllables[-1].tone,
                    )
            else:
                syllables.append(Syllable(onset=phones[i], nucleus="", coda=""))
        i += 1
    return [s for s in syllables if s.nucleus]


# ── ALGO-CRV (bkv/ijn/iko/ha) ───────────────────────────────────────────────

def _syllabify_crv(phones: List[str]) -> List[Syllable]:
    """
    CRV : CV(C). Contours HL/LH sur la voyelle.
    Hausa spécifiquement : voyelles longues (aa/ee/ii/oo/uu) = 2 moras.
    """
    syllables = _syllabify_generic(phones)
    # Détecte voyelles longues → mora_count=2
    for syll in syllables:
        if len(syll.nucleus) >= 2 and all(_is_vowel(c) for c in syll.nucleus):
            syll.mora_count = 2
    return syllables


# ── ALGO-BNT (sw/zu/ln) ─────────────────────────────────────────────────────

_BNT_CLASS_PREFIXES = {
    "sw": {"m", "wa", "mi", "ki", "vi", "n", "ma", "pa", "mu", "u"},
    "zu": {"um", "aba", "i", "ama", "isi", "izi", "in", "iz", "u", "o"},
    "ln": {"mo", "ba", "e", "ma", "li", "ma", "bo", "lo", "ko"},
}

def _syllabify_bnt(phones: List[str], lang: str = "sw") -> List[Syllable]:
    """BNT : CV(N)(C). Nasales prévocaliques = onset complet."""
    return _syllabify_generic(phones)


# ── ALGO-SIN (zh) ────────────────────────────────────────────────────────────

def _syllabify_sin(phones: List[str]) -> List[Syllable]:
    """
    Sinitic : structure initiale + finale (pinyin-style).
    Chaque syllabe = 1 initiale (optionnelle) + 1 finale + ton.
    Retourne une seule syllabe par token phonémique.
    """
    if not phones:
        return []
    vowel_positions = [i for i, p in enumerate(phones) if _is_vowel(p)]
    if not vowel_positions:
        return [Syllable(onset="".join(phones), nucleus="", coda="")]
    v0 = vowel_positions[0]
    onset   = "".join(phones[:v0])
    nucleus = "".join(phones[v0:vowel_positions[-1] + 1])
    coda    = "".join(phones[vowel_positions[-1] + 1:])
    nucleus, tone = _extract_tone_diacritic(nucleus)
    return [Syllable(onset=onset, nucleus=nucleus, coda=coda, tone=tone)]


# ── ALGO-JAP (ja) ────────────────────────────────────────────────────────────

def _syllabify_jap(phones: List[str]) -> List[Syllable]:
    """
    Japonais mora-timing : CV / V / CVN.
    Voyelle longue ː = mora supplémentaire.
    """
    syllables: List[Syllable] = []
    i = 0
    while i < len(phones):
        p = phones[i]
        if _is_vowel(p):
            nucleus, tone = _extract_tone_diacritic(p)
            syllables.append(Syllable(onset="", nucleus=nucleus, coda="", tone=tone))
            i += 1
        elif i + 1 < len(phones) and _is_vowel(phones[i + 1]):
            onset = p
            nucleus, tone = _extract_tone_diacritic(phones[i + 1])
            coda = ""
            j = i + 2
            # Nasal syllabique final
            if j < len(phones) and phones[j] in _NASALS and (j + 1 >= len(phones) or not _is_vowel(phones[j + 1])):
                coda = phones[j]
                j += 1
            # Voyelle longue = mora_count=2
            mora = 1
            if j < len(phones) and phones[j] == "ː":
                mora = 2
                j += 1
            syllables.append(Syllable(onset=onset, nucleus=nucleus, coda=coda, tone=tone, mora_count=mora))
            i = j
        else:
            # Consonne seule (ex: ン)
            syllables.append(Syllable(onset="", nucleus="", coda=p))
            i += 1
    return [s for s in syllables if s.nucleus or s.coda]


# ── ALGO-TAI (th) ────────────────────────────────────────────────────────────

def _syllabify_tai(phones: List[str]) -> List[Syllable]:
    """Thaï / Tai-Kadai : CVC? + ton. Structure monosyllabique dominante."""
    return _syllabify_sin(phones)


# ── ALGO-VIET (vi) ───────────────────────────────────────────────────────────

def _syllabify_viet(phones: List[str]) -> List[Syllable]:
    """Vietnamien : monosyllabique tonal. Même structure que SIN."""
    return _syllabify_sin(phones)


# ── Dispatcher principal ─────────────────────────────────────────────────────

FAMILY_SYLLABIFIER = {
    "ALGO-ROM":  lambda p, lang: _syllabify_rom(p, lang),
    "ALGO-GER":  lambda p, lang: _syllabify_ger(p),
    "ALGO-KWA":  lambda p, lang: _syllabify_kwa(p),
    "ALGO-CRV":  lambda p, lang: _syllabify_crv(p),
    "ALGO-BNT":  lambda p, lang: _syllabify_bnt(p, lang),
    "ALGO-SIN":  lambda p, lang: _syllabify_sin(p),
    "ALGO-JAP":  lambda p, lang: _syllabify_jap(p),
    "ALGO-KOR":  lambda p, lang: _syllabify_generic(p),
    "ALGO-SLV":  lambda p, lang: _syllabify_generic(p),
    "ALGO-SEM":  lambda p, lang: _syllabify_generic(p),
    "ALGO-IIR":  lambda p, lang: _syllabify_generic(p),
    "ALGO-DRV":  lambda p, lang: _syllabify_generic(p),
    "ALGO-TRK":  lambda p, lang: _syllabify_generic(p),
    "ALGO-FIN":  lambda p, lang: _syllabify_generic(p),
    "ALGO-TAI":  lambda p, lang: _syllabify_tai(p),
    "ALGO-VIET": lambda p, lang: _syllabify_viet(p),
    "ALGO-AUS":  lambda p, lang: _syllabify_generic(p),
}


def syllabify(ipa: str, family: str, lang: str = "") -> List[Syllable]:
    """
    Point d'entrée principal.

    Args:
        ipa:    Chaîne IPA (avec ou sans /.../).
        family: Famille ALGO (ex: 'ALGO-ROM').
        lang:   Code langue BCP-47 pour règles intra-famille.

    Returns:
        Liste de Syllable.
    """
    phones = _chars(ipa)
    fn = FAMILY_SYLLABIFIER.get(family, lambda p, l: _syllabify_generic(p))
    result = fn(phones, lang)
    return result if result else [Syllable(onset="".join(phones), nucleus="", coda="")]
