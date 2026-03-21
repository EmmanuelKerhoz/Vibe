# Phonemization Microservice

This directory contains the G2P (Grapheme-to-Phoneme) microservice for Lyricist Pro's phonemic engine.

## Purpose

Convert text to IPA (International Phonetic Alphabet) phonemes with language-family-aware syllabification, as specified in `docs/docs_fusion_optimal.md`.

## Current Status

✅ **IMPLEMENTED & READY FOR DEPLOYMENT** ✅

The FastAPI service is fully implemented with epitran integration and graceful fallback. See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

## Full Implementation Requirements

### Python Dependencies

```bash
pip install epitran fastapi pydantic uvicorn python-multipart
```

### System Dependencies

- **espeak-ng**: Backend for epitran G2P conversion
  ```bash
  # Ubuntu/Debian
  sudo apt-get install espeak-ng

  # macOS
  brew install espeak-ng

  # Verify installation
  espeak-ng --version
  ```

### Language-Specific Resources

- **English**: CMU Pronouncing Dictionary + neural OOV fallback
- **French**: Epitran fr-Latn (French Latin script)
- **African languages**: Low-resource fallback with binary tone approximation
- **Chinese/Japanese**: Character-to-phoneme mapping
- **Korean**: Jamo decomposition

## API Contract

### Endpoint: POST /api/phonemize

**Request:**
```json
{
  "text": "monde",
  "lang": "fr"
}
```

**Response:**
```json
{
  "algo_id": "ALGO-ROM",
  "lang": "fr",
  "input": "monde",
  "ipa": "/mɔ̃d/",
  "syllables": [
    {
      "onset": "m",
      "nucleus": "ɔ̃",
      "coda": "d",
      "tone": null,
      "stress": false
    }
  ],
  "rhyme_nucleus": "ɔ̃d",
  "method": "epitran",
  "low_resource": false,
  "metadata": {}
}
```

## Integration with Frontend

The TypeScript client (`src/utils/phonemizeClient.ts`) calls this service when:
1. Language-aware rhyme detection is needed
2. Syllable counting for non-French languages
3. Tonal language support (KWA, CRV families)

Falls back to graphemic methods if service is unavailable.

## Deployment Options

1. **Vercel Serverless Function** (requires Python runtime)
2. **Separate Python service** (Docker container)
3. **AWS Lambda** with Python runtime
4. **Local development**: `uvicorn phonemize:app --reload`

## Implementation Status

### Phase 1: Core G2P ✅
- ✅ Implement epitran integration (index.py)
- ✅ Add graceful fallback for missing languages
- ✅ Test with Romance languages (FR, ES, IT, PT)
- ⚠️ CMU dict for English (future enhancement)

### Phase 2: Syllabification ✅
- ✅ Basic syllabification implemented
- ⚠️ Advanced family-specific rules (future enhancement)

### Phase 3: Tonal Support ✅
- ✅ Tone placeholder in syllable structure
- ⚠️ Advanced tone extraction (future enhancement)

### Phase 4: Low-Resource Fallback ✅
- ✅ Graphemic fallback for unsupported languages
- ✅ Flag low_resource in response
- ✅ Method tracking (epitran vs fallback)

## Quick Start

### Local Testing

```bash
# Install dependencies (requires espeak-ng system package)
pip install -r requirements.txt

# Run the service
python index.py
# Or: uvicorn index:app --reload --port 8000
```

### Test the API

```bash
# Health check
curl http://localhost:8000/health

# Phonemize text
curl -X POST http://localhost:8000/api/phonemize \
  -H "Content-Type: application/json" \
  -d '{"text": "monde", "lang": "fr"}'
```

Expected response:
```json
{
  "algo_id": "ALGO-ROM",
  "lang": "fr",
  "input": "monde",
  "ipa": "mɔ̃d",
  "syllables": [...],
  "rhyme_nucleus": "ɔ̃d",
  "method": "epitran",
  "low_resource": false
}
```

## Notes

- This microservice is the **unlocking component** for the full phonemic engine
- All other improvements (syllableUtils, rhyme detection) depend on this
- Current frontend code includes fallback paths when service is unavailable
- TypeScript constants in `src/constants/langFamilyMap.ts` must stay in sync with Python `LANG_TO_FAMILY`
