"""
Lyricist v4.1 — rhyme sub-package
Remediation modules for the phonemization pipeline.
"""
from .verse_segmenter import segment_verse, RhymingUnit, SegmentMode
from .rhyme_scheme_detector import detect_scheme, SchemeResult
from .lid_span_router import detect_spans, LangSpan
from .morpho_strip import strip_before_rn_extraction, StripResult
from .phoneme_embedding import score_embedding, EmbeddingScore

__all__ = [
    "segment_verse", "RhymingUnit", "SegmentMode",
    "detect_scheme", "SchemeResult",
    "detect_spans", "LangSpan",
    "strip_before_rn_extraction", "StripResult",
    "score_embedding", "EmbeddingScore",
]
