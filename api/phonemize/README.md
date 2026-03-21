# Phonemization Microservice

This directory contains the G2P (Grapheme-to-Phoneme) microservice skeleton for Lyricist Pro's phonemic engine.

## Purpose

Convert text to IPA (International Phonetic Alphabet) phonemes with language-family-aware syllabification, as specified in `docs/docs_fusion_optimal.md`.

## Current Status

🚧 **SKELETON IMPLEMENTATION** 🚧

This is a placeholder to establish the API contract. The actual G2P conversion is not yet implemented.

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

## Implementation Roadmap

### Phase 1: Core G2P (blocked by deployment)
- [ ] Implement epitran integration
- [ ] Add CMU dict for English
- [ ] Test with Romance languages (FR, ES, IT, PT)

### Phase 2: Syllabification
- [ ] Implement CV syllabification (ALGO-KWA)
- [ ] Implement CVC syllabification (ALGO-CRV, ALGO-ROM)
- [ ] Implement moraic syllabification (ALGO-JAP)

### Phase 3: Tonal Support
- [ ] Preserve tone diacritics in normalization
- [ ] Extract tone class (H/L/M) for tonal languages
- [ ] Include tone in rhyme nucleus calculation

### Phase 4: Low-Resource Fallback
- [ ] Binary tone approximation for KWA/CRV
- [ ] Graphemic fallback for unsupported languages
- [ ] Flag low_resource in response

## Testing

```bash
python skeleton.py
```

Expected output:
```
Input: monde
Family: AlgoFamily.ALGO_ROM
IPA: /monde/
Method: graphemic_fallback
Low resource: True
```

## Notes

- This microservice is the **unlocking component** for the full phonemic engine
- All other improvements (syllableUtils, rhyme detection) depend on this
- Current frontend code includes fallback paths when service is unavailable
- TypeScript constants in `src/constants/langFamilyMap.ts` must stay in sync with Python `LANG_TO_FAMILY`
