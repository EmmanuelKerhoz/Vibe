"""
G2P Phonemization Microservice for Lyricist Pro
FastAPI implementation with epitran for proper IPA conversion
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import epitran with graceful fallback
try:
    import epitran
    EPITRAN_AVAILABLE = True
    logger.info("epitran loaded successfully")
except ImportError:
    EPITRAN_AVAILABLE = False
    logger.warning("epitran not available - using fallback mode")

app = FastAPI(title="G2P Phonemization Service", version="1.0.0")

# CORS configuration for Vercel deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AlgoFamily(str, Enum):
    """Language family identifiers matching TypeScript constants"""
    ALGO_ROM = "ALGO-ROM"
    ALGO_GER = "ALGO-GER"
    ALGO_SLV = "ALGO-SLV"
    ALGO_SEM = "ALGO-SEM"
    ALGO_SIN = "ALGO-SIN"
    ALGO_JAP = "ALGO-JAP"
    ALGO_KOR = "ALGO-KOR"
    ALGO_BNT = "ALGO-BNT"
    ALGO_KWA = "ALGO-KWA"
    ALGO_CRV = "ALGO-CRV"
    ALGO_IIR = "ALGO-IIR"
    ALGO_DRV = "ALGO-DRV"
    ALGO_TRK = "ALGO-TRK"
    ALGO_FIN = "ALGO-FIN"
    ALGO_TAI = "ALGO-TAI"
    ALGO_VIET = "ALGO-VIET"
    ALGO_AUS = "ALGO-AUS"


# Language code to family mapping (synced with TypeScript)
LANG_TO_FAMILY: Dict[str, AlgoFamily] = {
    # Romance
    'fr': AlgoFamily.ALGO_ROM,
    'es': AlgoFamily.ALGO_ROM,
    'it': AlgoFamily.ALGO_ROM,
    'pt': AlgoFamily.ALGO_ROM,
    'ro': AlgoFamily.ALGO_ROM,
    'ca': AlgoFamily.ALGO_ROM,
    # Germanic
    'en': AlgoFamily.ALGO_GER,
    'de': AlgoFamily.ALGO_GER,
    'nl': AlgoFamily.ALGO_GER,
    'sv': AlgoFamily.ALGO_GER,
    'da': AlgoFamily.ALGO_GER,
    'no': AlgoFamily.ALGO_GER,
    # Kwa
    'bci': AlgoFamily.ALGO_KWA,  # Baoulé
    'dyu': AlgoFamily.ALGO_KWA,  # Dioula
    'ee': AlgoFamily.ALGO_KWA,   # Ewe
    'gej': AlgoFamily.ALGO_KWA,  # Mina
    # Cross River / Chadic
    'bkv': AlgoFamily.ALGO_CRV,  # Bekwarra
    'ijn': AlgoFamily.ALGO_CRV,  # Calabari
    'iko': AlgoFamily.ALGO_CRV,  # Ogoja
    'ha': AlgoFamily.ALGO_CRV,   # Hausa
    # Slavic
    'ru': AlgoFamily.ALGO_SLV,
    'pl': AlgoFamily.ALGO_SLV,
    'uk': AlgoFamily.ALGO_SLV,
    'cs': AlgoFamily.ALGO_SLV,
    # Others
    'ar': AlgoFamily.ALGO_SEM,
    'he': AlgoFamily.ALGO_SEM,
    'zh': AlgoFamily.ALGO_SIN,
    'ja': AlgoFamily.ALGO_JAP,
    'ko': AlgoFamily.ALGO_KOR,
    'hi': AlgoFamily.ALGO_IIR,
    'ur': AlgoFamily.ALGO_IIR,
    'ta': AlgoFamily.ALGO_DRV,
    'te': AlgoFamily.ALGO_DRV,
    'tr': AlgoFamily.ALGO_TRK,
    'fi': AlgoFamily.ALGO_FIN,
    'th': AlgoFamily.ALGO_TAI,
    'vi': AlgoFamily.ALGO_VIET,
}

# Epitran code mappings - mapping language codes to epitran script codes
EPITRAN_MAPPINGS = {
    'fr': 'fra-Latn',
    'es': 'spa-Latn',
    'it': 'ita-Latn',
    'pt': 'por-Latn',
    'de': 'deu-Latn',
    'en': 'eng-Latn',
    'ru': 'rus-Cyrl',
    'ar': 'ara-Arab',
    'zh': 'cmn-Hans',
    'ja': 'jpn-Hira',
    'ko': 'kor-Hang',
    'hi': 'hin-Deva',
    'tr': 'tur-Latn',
    'vi': 'vie-Latn',
}

# Cache for epitran instances
_epitran_cache: Dict[str, Any] = {}


def get_epitran(lang_code: str) -> Optional[Any]:
    """Get or create epitran instance for language"""
    if not EPITRAN_AVAILABLE:
        return None

    epitran_code = EPITRAN_MAPPINGS.get(lang_code)
    if not epitran_code:
        logger.info(f"No epitran mapping for {lang_code}")
        return None

    if epitran_code not in _epitran_cache:
        try:
            _epitran_cache[epitran_code] = epitran.Epitran(epitran_code)
            logger.info(f"Created epitran instance for {epitran_code}")
        except Exception as e:
            logger.error(f"Failed to create epitran for {epitran_code}: {e}")
            return None

    return _epitran_cache[epitran_code]


class SyllableModel(BaseModel):
    """Syllable structure"""
    onset: str
    nucleus: str
    coda: str
    tone: Optional[str] = None
    stress: bool = False


class PhonemizeRequest(BaseModel):
    """Request model for phonemization"""
    text: str
    lang: str


class PhonemizeResponse(BaseModel):
    """Response model for phonemization"""
    algo_id: str
    lang: str
    input: str
    ipa: str
    syllables: List[SyllableModel]
    rhyme_nucleus: str
    method: str
    low_resource: bool
    metadata: Dict[str, Any] = {}


def graphemic_fallback_g2p(text: str, family: AlgoFamily) -> str:
    """
    Simple graphemic fallback when epitran is unavailable
    Returns text wrapped in IPA slashes as a minimal fallback
    """
    # Basic cleaning
    cleaned = text.lower().strip()
    # Mark as graphemic approximation
    return f"/{cleaned}/"


def simple_syllabify(ipa: str, family: AlgoFamily) -> List[SyllableModel]:
    """
    Basic syllabification for IPA text
    This is a simplified version - real implementation would use family-specific rules
    """
    # Remove IPA delimiters
    ipa_clean = ipa.strip('/[]')

    # Very basic syllabification: split by spaces and simple vowel detection
    # This is a placeholder - proper implementation would use family-specific rules
    syllables = []

    # Simple vowel pattern (very basic)
    vowel_pattern = r'[aeiouæɑɔɛɪʊəɨʉɯyø]'

    # Split into rough syllables based on vowels
    parts = re.split(f'({vowel_pattern}+)', ipa_clean)

    current_syllable = {"onset": "", "nucleus": "", "coda": ""}

    for part in parts:
        if not part:
            continue
        if re.match(vowel_pattern, part):
            current_syllable["nucleus"] = part
        elif not current_syllable["nucleus"]:
            current_syllable["onset"] += part
        else:
            current_syllable["coda"] += part
            # Complete syllable
            if current_syllable["nucleus"]:
                syllables.append(SyllableModel(**current_syllable))
            current_syllable = {"onset": "", "nucleus": "", "coda": ""}

    # Add last syllable if incomplete
    if current_syllable["nucleus"]:
        syllables.append(SyllableModel(**current_syllable))

    return syllables


def extract_rhyme_nucleus_simple(syllables: List[SyllableModel], family: AlgoFamily) -> str:
    """
    Extract rhyme nucleus from syllables
    Uses last syllable's nucleus + coda as basic approximation
    """
    if not syllables:
        return ""

    last_syll = syllables[-1]

    # For tonal languages (KWA, CRV), include tone if present
    if family in [AlgoFamily.ALGO_KWA, AlgoFamily.ALGO_CRV]:
        rn = last_syll.nucleus
        if last_syll.tone:
            rn += last_syll.tone
        if last_syll.coda and family == AlgoFamily.ALGO_CRV:
            rn += last_syll.coda
        return rn

    # Standard: nucleus + coda
    return last_syll.nucleus + last_syll.coda


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "epitran_available": EPITRAN_AVAILABLE,
        "version": "1.0.0"
    }


@app.get("/api/health")
async def api_health_check():
    """Alternative health check endpoint"""
    return {
        "status": "healthy",
        "epitran_available": EPITRAN_AVAILABLE,
        "version": "1.0.0"
    }


@app.post("/api/phonemize", response_model=PhonemizeResponse)
async def phonemize(request: PhonemizeRequest) -> PhonemizeResponse:
    """
    Main phonemization endpoint
    Converts text to IPA with syllabification and rhyme nucleus extraction
    """
    try:
        lang_code = request.lang.lower()
        text = request.text.strip()

        if not text:
            raise HTTPException(status_code=400, detail="Empty text provided")

        # Determine language family
        family = LANG_TO_FAMILY.get(lang_code, AlgoFamily.ALGO_ROM)

        # Try epitran first
        ipa_text = None
        method = "graphemic_fallback"
        low_resource = True
        metadata: Dict[str, Any] = {}

        if EPITRAN_AVAILABLE:
            epi = get_epitran(lang_code)
            if epi:
                try:
                    ipa_text = epi.transliterate(text)
                    method = "epitran"
                    low_resource = False
                    metadata["epitran_code"] = EPITRAN_MAPPINGS.get(lang_code)
                    logger.info(f"Successfully phonemized '{text}' using epitran")
                except Exception as e:
                    logger.warning(f"Epitran failed for {lang_code}: {e}")
                    ipa_text = None

        # Fallback to graphemic approximation
        if ipa_text is None:
            ipa_text = graphemic_fallback_g2p(text, family)
            method = "graphemic_fallback"
            low_resource = True
            metadata["note"] = "Using graphemic fallback - epitran unavailable or unsupported language"

        # Syllabify
        syllables = simple_syllabify(ipa_text, family)

        # Extract rhyme nucleus
        rhyme_nucleus = extract_rhyme_nucleus_simple(syllables, family)

        return PhonemizeResponse(
            algo_id=family.value,
            lang=lang_code,
            input=text,
            ipa=ipa_text,
            syllables=syllables,
            rhyme_nucleus=rhyme_nucleus,
            method=method,
            low_resource=low_resource,
            metadata=metadata
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Phonemization error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Phonemization failed: {str(e)}")


# For local testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
